import * as functions from 'firebase-functions';
import { auth, db } from '@/utils/firebase';
import type { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    service?: {
      serviceId: string;
    };
  };
}

/**
 * Middleware to verify Firebase ID token and attach user to request
 */
export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    // Fetch user document for additional data
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userDoc.data(),
    };

    next();
  } catch (error: any) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to check if user has specific role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role!)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Middleware to check multi-tenant access
 */
export function requireService(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.service?.serviceId) {
    res.status(403).json({ error: 'User not associated with a service' });
    return;
  }

  next();
}
