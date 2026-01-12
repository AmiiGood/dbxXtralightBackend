import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";

/**
 * Middleware para verificar si un usuario tiene acceso a un módulo específico
 */
export const checkModuleAccess = (moduleKey: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const userId = req.user.id;

      // Los admins tienen acceso a todo
      if (req.user.role === "admin") {
        next();
        return;
      }

      // Verificar si el usuario tiene acceso al módulo
      const result = await query(
        `SELECT EXISTS(
          SELECT 1 FROM v_user_access
          WHERE user_id = $1 
            AND module_key = $2
            AND has_permission = true
        ) as has_access`,
        [userId, moduleKey]
      );

      if (!result.rows[0].has_access) {
        res.status(403).json({
          error: "No tienes acceso a este módulo",
          module: moduleKey,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error verificando acceso a módulo:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  };
};

/**
 * Middleware para verificar permisos específicos dentro de un módulo
 */
export const checkPermission = (moduleKey: string, permissionKey: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const userId = req.user.id;

      // Los admins tienen todos los permisos
      if (req.user.role === "admin") {
        next();
        return;
      }

      // Verificar permiso específico
      const result = await query(
        `SELECT user_has_permission($1, $2, $3) as has_permission`,
        [userId, moduleKey, permissionKey]
      );

      if (!result.rows[0].has_permission) {
        res.status(403).json({
          error: "No tienes permiso para realizar esta acción",
          required_permission: permissionKey,
          module: moduleKey,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error verificando permiso:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  };
};

/**
 * Obtener todos los módulos accesibles para el usuario actual
 */
export const getUserModules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT DISTINCT
        m.module_key,
        m.module_name,
        m.description,
        m.icon,
        array_agg(DISTINCT mp.permission_key) FILTER (WHERE va.has_permission = true) as permissions
      FROM modules m
      LEFT JOIN v_user_access va ON m.module_key = va.module_key AND va.user_id = $1
      LEFT JOIN module_permissions mp ON m.id = mp.module_id
      WHERE m.is_active = true
        AND (
          $2 = 'admin' 
          OR EXISTS(
            SELECT 1 FROM v_user_access 
            WHERE user_id = $1 
              AND module_key = m.module_key 
              AND has_permission = true
          )
        )
      GROUP BY m.id, m.module_key, m.module_name, m.description, m.icon
      ORDER BY m.module_name`,
      [userId, req.user!.role]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo módulos del usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
