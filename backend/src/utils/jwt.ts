import jwt from 'jsonwebtoken';
import { User } from '../../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateJWT = (user: User, expiresIn: string = JWT_EXPIRES_IN): string => {
  const payload: JWTPayload = {
    userId: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyJWT = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};