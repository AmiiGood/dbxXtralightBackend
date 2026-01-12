import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { query } from "../config/database";
import { User, LoginRequest, UserPayload } from "../types";
import {
  createAuditLog,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../utils/auditLogger";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validaciones básicas
    if (!email || !password) {
      res.status(400).json({ error: "Email y contraseña son requeridos" });
      return;
    }

    // Buscar usuario
    const result = await query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const user: User = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    // Actualizar último login
    await query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Crear log de auditoría
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entityType: ENTITY_TYPES.USER,
      entityId: user.id,
    });

    // Generar JWT
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    const secret =
      process.env.JWT_SECRET || "default-secret-change-in-production";
    const options: SignOptions = {
      expiresIn: "24h",
    };

    const token = jwt.sign(payload, secret, options);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query(
      "SELECT id, email, full_name, role, department, created_at, last_login FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Contraseñas requeridas" });
      return;
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    // Obtener usuario
    const result = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );
    if (!validPassword) {
      res.status(401).json({ error: "Contraseña actual incorrecta" });
      return;
    }

    // Generar hash de nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      userId,
    ]);

    // Log de auditoría
    await createAuditLog({
      userId,
      action: "PASSWORD_CHANGED",
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
    });

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
