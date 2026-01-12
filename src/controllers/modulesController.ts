import { Request, Response } from "express";
import { query } from "../config/database";
import {
  createAuditLog,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../utils/auditLogger";

/**
 * Obtener todos los módulos del sistema
 */
export const getAllModules = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await query(
      `SELECT m.*, 
        (SELECT COUNT(*) FROM module_permissions WHERE module_id = m.id) as permissions_count,
        (SELECT COUNT(*) FROM department_modules WHERE module_id = m.id) as departments_count
      FROM modules m
      ORDER BY m.module_name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo módulos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Crear un nuevo módulo
 */
export const createModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { module_key, module_name, description, icon } = req.body;

    if (!module_key || !module_name) {
      res
        .status(400)
        .json({ error: "Clave y nombre del módulo son requeridos" });
      return;
    }

    const result = await query(
      `INSERT INTO modules (module_key, module_name, description, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [module_key, module_name, description, icon]
    );

    await createAuditLog({
      userId: req.user!.id,
      action: "MODULE_CREATED",
      entityType: "MODULE",
      entityId: result.rows[0].id.toString(),
      details: { module_key, module_name },
    });

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") {
      // duplicate key
      res.status(409).json({ error: "Ya existe un módulo con esa clave" });
      return;
    }
    console.error("Error creando módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Obtener todos los departamentos
 */
export const getAllDepartments = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await query(
      `SELECT d.*,
        (SELECT COUNT(*) FROM users WHERE department_id = d.id AND is_active = true) as users_count,
        (SELECT COUNT(*) FROM department_modules WHERE department_id = d.id) as modules_count
      FROM departments d
      ORDER BY d.dept_name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo departamentos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Asignar módulo a departamento
 */
export const assignModuleToDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId, moduleId } = req.body;

    if (!departmentId || !moduleId) {
      res
        .status(400)
        .json({ error: "ID de departamento y módulo son requeridos" });
      return;
    }

    const result = await query(
      `INSERT INTO department_modules (department_id, module_id, has_access)
       VALUES ($1, $2, true)
       ON CONFLICT (department_id, module_id) 
       DO UPDATE SET has_access = true
       RETURNING *`,
      [departmentId, moduleId]
    );

    await createAuditLog({
      userId: req.user!.id,
      action: "MODULE_ASSIGNED_TO_DEPARTMENT",
      entityType: "DEPARTMENT_MODULE",
      entityId: result.rows[0].id.toString(),
      details: { departmentId, moduleId },
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error asignando módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Revocar acceso de módulo a departamento
 */
export const revokeModuleFromDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId, moduleId } = req.params;

    await query(
      `UPDATE department_modules 
       SET has_access = false
       WHERE department_id = $1 AND module_id = $2`,
      [departmentId, moduleId]
    );

    await createAuditLog({
      userId: req.user!.id,
      action: "MODULE_REVOKED_FROM_DEPARTMENT",
      entityType: "DEPARTMENT_MODULE",
      details: { departmentId, moduleId },
    });

    res.json({ message: "Acceso revocado exitosamente" });
  } catch (error) {
    console.error("Error revocando módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Asignar permiso específico a un usuario
 */
export const assignPermissionToUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, moduleId, permissionId } = req.body;

    if (!userId || !moduleId || !permissionId) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }

    const result = await query(
      `INSERT INTO user_module_permissions (user_id, module_id, permission_id, granted, granted_by)
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (user_id, module_id, permission_id)
       DO UPDATE SET granted = true, granted_by = $4, granted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, moduleId, permissionId, req.user!.id]
    );

    await createAuditLog({
      userId: req.user!.id,
      action: "PERMISSION_GRANTED",
      entityType: "USER_PERMISSION",
      entityId: result.rows[0].id.toString(),
      details: { userId, moduleId, permissionId },
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error asignando permiso:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Obtener permisos de un usuario
 */
export const getUserPermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
        va.module_key,
        va.module_name,
        va.permission_key,
        va.permission_name,
        va.has_permission
      FROM v_user_access va
      WHERE va.user_id = $1
      ORDER BY va.module_name, va.permission_key`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo permisos de usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

/**
 * Obtener módulos de un departamento
 */
export const getDepartmentModules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId } = req.params;

    const result = await query(
      `SELECT 
        m.*,
        dm.has_access,
        dm.created_at as assigned_at
      FROM modules m
      LEFT JOIN department_modules dm ON m.id = dm.module_id AND dm.department_id = $1
      ORDER BY m.module_name`,
      [departmentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo módulos del departamento:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
