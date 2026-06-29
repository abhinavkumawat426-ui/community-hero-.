import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "elite_dispatch_secret_2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: "citizen" | "architect";
    specialty?: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
        specialty: decoded.specialty
      };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
  } else {
    // Tolerant check for local dev / unauthenticated legacy requests in frontend
    // If there is an x-user-id header, we can attach a mocked user to remain backward-compatible
    const fallbackUserId = req.headers["x-user-id"] || req.query.userId;
    if (fallbackUserId) {
      req.user = {
        id: String(fallbackUserId),
        name: "Citizen",
        role: "citizen"
      };
      return next();
    }
    
    // Default to unauthorized if they explicitly hit an endpoint needing auth
    return res.status(401).json({ error: "Unauthorized: Missing authorization header" });
  }
}
