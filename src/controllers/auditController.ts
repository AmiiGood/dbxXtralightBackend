import { Request, Response } from 'express';
import { query } from '../config/database';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { 
      startDate, 
      endDate, 
      action, 
      entityType, 
      userId, 
      limit = 100, 
      offset = 0 
    } = req.query;

    let queryText = `
      SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email,
        u.department
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCounter = 1;

    if (startDate) {
      queryText += ` AND al.created_at >= $${paramCounter}`;
      params.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      queryText += ` AND al.created_at <= $${paramCounter}`;
      params.push(endDate);
      paramCounter++;
    }

    if (action) {
      queryText += ` AND al.action = $${paramCounter}`;
      params.push(action);
      paramCounter++;
    }

    if (entityType) {
      queryText += ` AND al.entity_type = $${paramCounter}`;
      params.push(entityType);
      paramCounter++;
    }

    if (userId) {
      queryText += ` AND al.user_id = $${paramCounter}`;
      params.push(userId);
      paramCounter++;
    }

    queryText += ` ORDER BY al.created_at DESC`;
    queryText += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const getAuditLogsByEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const result = await query(
      `SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = $1 AND al.entity_id = $2
      ORDER BY al.created_at DESC`,
      [entityType, entityId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener logs por entidad:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT 
        al.action,
        al.entity_type,
        COUNT(*) as count,
        COUNT(DISTINCT al.user_id) as unique_users
      FROM audit_logs al
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCounter = 1;

    if (startDate) {
      queryText += ` AND al.created_at >= $${paramCounter}`;
      params.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      queryText += ` AND al.created_at <= $${paramCounter}`;
      params.push(endDate);
      paramCounter++;
    }

    queryText += ` GROUP BY al.action, al.entity_type ORDER BY count DESC`;

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener estadísticas de auditoría:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};
