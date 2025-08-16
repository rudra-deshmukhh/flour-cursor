import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../config/firebase';
import { collections } from '../config/firebase';
import { generateJWT } from '../utils/jwt';
import { sendOTP, verifyOTP } from '../utils/otp';
import { logger } from '../utils/logger';
import { ApiResponse, User, LoginRequest, OtpRequest } from '../../../shared/types';

const router = Router();

// Send OTP
router.post('/send-otp', [
  body('phoneNumber').isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse<null>);
    }

    const { phoneNumber }: OtpRequest = req.body;

    // Check if user exists
    const userSnapshot = await collections.users
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      // User doesn't exist, create new user
      const newUser: Omit<User, 'id'> = {
        name: '',
        phoneNumber,
        location: {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        role: 'user'
      };

      const userRef = await collections.users.add(newUser);
      const user: User = {
        id: userRef.id,
        ...newUser
      };

      // Send OTP
      const otpSent = await sendOTP(phoneNumber);
      if (!otpSent) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send OTP'
        } as ApiResponse<null>);
      }

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: { userId: user.id, isNewUser: true }
      } as ApiResponse<{ userId: string; isNewUser: boolean }>);
    }

    // User exists, send OTP
    const otpSent = await sendOTP(phoneNumber);
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      } as ApiResponse<null>);
    }

    const existingUser = userSnapshot.docs[0].data() as User;
    existingUser.id = userSnapshot.docs[0].id;

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: { userId: existingUser.id, isNewUser: false }
    } as ApiResponse<{ userId: string; isNewUser: boolean }>);

  } catch (error) {
    logger.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Verify OTP and login
router.post('/verify-otp', [
  body('phoneNumber').isMobilePhone().withMessage('Invalid phone number'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('Invalid OTP')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse<null>);
    }

    const { phoneNumber, otp }: LoginRequest = req.body;

    // Verify OTP
    const isValidOTP = await verifyOTP(phoneNumber, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      } as ApiResponse<null>);
    }

    // Get user
    const userSnapshot = await collections.users
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    const userData = userSnapshot.docs[0].data();
    const user: User = {
      id: userSnapshot.docs[0].id,
      ...userData
    };

    // Generate JWT token
    const token = generateJWT(user);
    const refreshToken = generateJWT(user, '7d');

    // Update last login
    await collections.users.doc(user.id).update({
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    } as ApiResponse<{ user: User; token: string; refreshToken: string }>);

  } catch (error) {
    logger.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Complete user profile (for new users)
router.post('/complete-profile', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('address').notEmpty().withMessage('Address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse<null>);
    }

    const { userId, name, latitude, longitude, address } = req.body;

    // Update user profile
    await collections.users.doc(userId).update({
      name,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      },
      updatedAt: new Date()
    });

    // Get updated user
    const userDoc = await collections.users.doc(userId).get();
    const user: User = {
      id: userDoc.id,
      ...userDoc.data()
    } as User;

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: user
    } as ApiResponse<User>);

  } catch (error) {
    logger.error('Error completing profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Refresh token
router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_SECRET);
    
    // Get user
    const userDoc = await collections.users.doc(decoded.userId).get();
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      } as ApiResponse<null>);
    }

    const user: User = {
      id: userDoc.id,
      ...userDoc.data()
    } as User;

    // Generate new token
    const newToken = generateJWT(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken }
    } as ApiResponse<{ token: string }>);

  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    } as ApiResponse<null>);
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse<null>);
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router;