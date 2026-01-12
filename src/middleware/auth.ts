import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Token no proporcionado" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token inválido o expirado" });
    return;
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "No tienes permisos para realizar esta acción",
      });
      return;
    }

    next();
  };
};
