import { supabase } from '../config/supabase.js';

/**
 * Authentication middleware
 * Verifies Supabase JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
    }
    
    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use: Bearer <token>',
      });
    }
    
    const token = parts[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
    
    // Attach user to request object for use in route handlers
    req.user = user;
    req.token = token;
    
    // Continue to next middleware/route handler
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * If token is provided, validates it. If not, continues without user.
 * Useful for routes that work differently for logged-in vs anonymous users.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // No header = continue without user
    if (!authHeader) {
      req.user = null;
      return next();
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }
    
    const token = parts[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    // Invalid token = continue without user (don't reject)
    if (error || !user) {
      req.user = null;
      return next();
    }
    
    req.user = user;
    req.token = token;
    next();
    
  } catch (error) {
    // On error, continue without user
    req.user = null;
    next();
  }
};

export default authenticate;