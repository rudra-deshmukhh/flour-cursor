import twilio from 'twilio';
import { collections } from '../config/firebase';
import { logger } from './logger';

// In-memory OTP storage (in production, use Redis or similar)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phoneNumber: string): Promise<boolean> => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.set(phoneNumber, { otp, expiresAt });

    if (client) {
      // Send via Twilio
      await client.messages.create({
        body: `Your Flour Delivery OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
    } else {
      // Development mode - log OTP
      logger.info(`Development OTP for ${phoneNumber}: ${otp}`);
    }

    return true;
  } catch (error) {
    logger.error('Error sending OTP:', error);
    return false;
  }
};

export const verifyOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  try {
    const storedOTP = otpStore.get(phoneNumber);
    
    if (!storedOTP) {
      return false;
    }

    // Check if OTP is expired
    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(phoneNumber);
      return false;
    }

    // Check if OTP matches
    if (storedOTP.otp === otp) {
      // Remove OTP after successful verification
      otpStore.delete(phoneNumber);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    return false;
  }
};

export const resendOTP = async (phoneNumber: string): Promise<boolean> => {
  // Remove existing OTP if any
  otpStore.delete(phoneNumber);
  
  // Send new OTP
  return await sendOTP(phoneNumber);
};