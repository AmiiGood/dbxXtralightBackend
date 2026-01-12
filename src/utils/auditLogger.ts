import { query } from '../config/database';

interface AuditLogParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}

export const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  details
}: AuditLogParams): Promise<void> => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Error al crear log de auditoría:', error);
    // No lanzamos el error para no interrumpir la operación principal
  }
};

// Constantes para acciones comunes
export const AUDIT_ACTIONS = {
  // Usuarios
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  
  // Registros de defectos
  DEFECT_RECORD_CREATED: 'DEFECT_RECORD_CREATED',
  DEFECT_RECORD_UPDATED: 'DEFECT_RECORD_UPDATED',
  DEFECT_RECORD_DELETED: 'DEFECT_RECORD_DELETED',
  
  // Configuración
  SHIFT_CONFIG_UPDATED: 'SHIFT_CONFIG_UPDATED',
  
  // Reportes
  REPORT_GENERATED: 'REPORT_GENERATED',
} as const;

export const ENTITY_TYPES = {
  USER: 'USER',
  DEFECT_RECORD: 'DEFECT_RECORD',
  SHIFT_CONFIG: 'SHIFT_CONFIG',
  REPORT: 'REPORT',
} as const;
