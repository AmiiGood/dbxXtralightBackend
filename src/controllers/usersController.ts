import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { query } from "../config/database";
import { CreateUserRequest } from "../types";
import {
  createAuditLog,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../utils/auditLogger";

export const getAllUsers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, department, is_active, created_at, last_login 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, full_name, role, department }: CreateUserRequest =
      req.body;

    // Validaciones
    if (!email || !password || !full_name || !role || !department) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }

    if (!["admin", "calidad", "usuario"].includes(role)) {
      res.status(400).json({ error: "Rol inválido" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    // Verificar si el email ya existe
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "El email ya está registrado" });
      return;
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, department, is_active, created_at`,
      [email.toLowerCase(), passwordHash, full_name, role, department]
    );

    const newUser = result.rows[0];

    // Log de auditoría
    await createAuditLog({
      userId: req.user!.id,
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: ENTITY_TYPES.USER,
      entityId: newUser.id,
      details: {
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, full_name, role, department, is_active } = req.body;

    // Validaciones
    if (
      !email ||
      !full_name ||
      !role ||
      !department ||
      is_active === undefined
    ) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }

    if (!["admin", "calidad", "usuario"].includes(role)) {
      res.status(400).json({ error: "Rol inválido" });
      return;
    }

    // Verificar si el usuario existe
    const userCheck = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const oldUser = userCheck.rows[0];

    // Verificar si el email ya existe en otro usuario
    const emailCheck = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email.toLowerCase(), id]
    );
    if (emailCheck.rows.length > 0) {
      res.status(409).json({ error: "El email ya está registrado" });
      return;
    }

    // Actualizar usuario
    const result = await query(
      `UPDATE users 
       SET email = $1, full_name = $2, role = $3, department = $4, is_active = $5
       WHERE id = $6
       RETURNING id, email, full_name, role, department, is_active, created_at, updated_at`,
      [email.toLowerCase(), full_name, role, department, is_active, id]
    );

    const updatedUser = result.rows[0];

    // Log de auditoría
    await createAuditLog({
      userId: req.user!.id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      entityType: ENTITY_TYPES.USER,
      entityId: id,
      details: {
        old: {
          email: oldUser.email,
          full_name: oldUser.full_name,
          role: oldUser.role,
          department: oldUser.department,
          is_active: oldUser.is_active,
        },
        new: {
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          department: updatedUser.department,
          is_active: updatedUser.is_active,
        },
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que no se está eliminando a sí mismo
    if (id === req.user!.id) {
      res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
      return;
    }

    // Verificar si el usuario existe
    const userCheck = await query(
      "SELECT email, full_name FROM users WHERE id = $1",
      [id]
    );
    if (userCheck.rows.length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const deletedUser = userCheck.rows[0];

    // Eliminar usuario
    await query("DELETE FROM users WHERE id = $1", [id]);

    // Log de auditoría
    await createAuditLog({
      userId: req.user!.id,
      action: AUDIT_ACTIONS.USER_DELETED,
      entityType: ENTITY_TYPES.USER,
      entityId: id,
      details: {
        email: deletedUser.email,
        full_name: deletedUser.full_name,
      },
    });

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    // Verificar si el usuario existe
    const userCheck = await query("SELECT email FROM users WHERE id = $1", [
      id,
    ]);
    if (userCheck.rows.length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Hash de nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      id,
    ]);

    // Log de auditoría
    await createAuditLog({
      userId: req.user!.id,
      action: "PASSWORD_RESET_BY_ADMIN",
      entityType: ENTITY_TYPES.USER,
      entityId: id,
      details: {
        reset_by: req.user!.email,
      },
    });

    res.json({ message: "Contraseña restablecida exitosamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
