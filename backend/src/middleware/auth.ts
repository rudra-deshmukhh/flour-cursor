import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt';
import { collections } from '../config/firebase';
import { User } from '../../../shared/types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyJWT(token);
      
      // Get user from database
      const userDoc = await collections.users.doc(decoded.userId).get();
      
      if (!userDoc.exists) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      const userData = userDoc.data();
      const user: User = {
        id: userDoc.id,
        ...userData
      };

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const adminMiddleware = roleMiddleware(['admin']);
export const flourMillMiddleware = roleMiddleware(['flour_mill']);
export const deliveryPartnerMiddleware = roleMiddleware(['delivery_partner']);
export const userMiddleware = roleMiddleware(['user']);