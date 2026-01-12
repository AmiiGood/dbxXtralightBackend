import { Request, Response } from "express";
import { query } from "../config/database";
import { CreateDefectRecordRequest } from "../types";
import { calculateShift } from "../utils/shiftCalculator";
import {
  createAuditLog,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../utils/auditLogger";

export const createDefectRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      area,
      defect_type_id,
      rejected_pairs,
      notes,
    }: CreateDefectRecordRequest = req.body;
    const userId = req.user!.id;

    // Validaciones
    if (!area || !defect_type_id || rejected_pairs === undefined) {
      res
        .status(400)
        .json({
          error: "Área, tipo de defecto y pares rechazados son requeridos",
        });
      return;
    }

    if (!["Empaque en maquina", "Digital printing"].includes(area)) {
      res.status(400).json({ error: "Área inválida" });
      return;
    }

    if (rejected_pairs < 0) {
      res
        .status(400)
        .json({ error: "Los pares rechazados no pueden ser negativos" });
      return;
    }

    // Verificar que el tipo de defecto existe
    const defectCheck = await query(
      "SELECT id FROM defect_types WHERE id = $1 AND is_active = true",
      [defect_type_id]
    );
    if (defectCheck.rows.length === 0) {
      res
        .status(404)
        .json({ error: "Tipo de defecto no encontrado o inactivo" });
      return;
    }

    // Obtener fecha y hora actual
    const now = new Date();
    const recordDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const recordTime = now.toTimeString().split(" ")[0]; // HH:MM:SS

    // Calcular turno basado en la hora actual
    const shiftNumber = await calculateShift(recordTime);

    // Crear registro
    const result = await query(
      `INSERT INTO defect_records 
       (user_id, area, defect_type_id, rejected_pairs, shift_number, record_date, record_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        area,
        defect_type_id,
        rejected_pairs,
        shiftNumber,
        recordDate,
        recordTime,
        notes,
      ]
    );

    const newRecord = result.rows[0];

    // Log de auditoría
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.DEFECT_RECORD_CREATED,
      entityType: ENTITY_TYPES.DEFECT_RECORD,
      entityId: newRecord.id,
      details: {
        area,
        defect_type_id,
        rejected_pairs,
        shift_number: shiftNumber,
      },
    });

    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Error al crear registro de defecto:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getMyDefectRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        dr.*,
        dt.defect_name,
        u.full_name as recorded_by
      FROM defect_records dr
      JOIN defect_types dt ON dr.defect_type_id = dt.id
      JOIN users u ON dr.user_id = u.id
      WHERE dr.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCounter = 2;

    if (startDate) {
      queryText += ` AND dr.record_date >= $${paramCounter}`;
      params.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      queryText += ` AND dr.record_date <= $${paramCounter}`;
      params.push(endDate);
      paramCounter++;
    }

    queryText += ` ORDER BY dr.record_date DESC, dr.record_time DESC`;
    queryText += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener registros propios:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getAllDefectRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      area,
      shift,
      limit = 100,
      offset = 0,
    } = req.query;

    let queryText = `
      SELECT 
        dr.*,
        dt.defect_name,
        u.full_name as recorded_by,
        u.email as user_email,
        u.department
      FROM defect_records dr
      JOIN defect_types dt ON dr.defect_type_id = dt.id
      JOIN users u ON dr.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCounter = 1;

    if (startDate) {
      queryText += ` AND dr.record_date >= $${paramCounter}`;
      params.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      queryText += ` AND dr.record_date <= $${paramCounter}`;
      params.push(endDate);
      paramCounter++;
    }

    if (area) {
      queryText += ` AND dr.area = $${paramCounter}`;
      params.push(area);
      paramCounter++;
    }

    if (shift) {
      queryText += ` AND dr.shift_number = $${paramCounter}`;
      params.push(shift);
      paramCounter++;
    }

    queryText += ` ORDER BY dr.record_date DESC, dr.record_time DESC`;
    queryText += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener todos los registros:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getDefectTypes = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await query(
      "SELECT * FROM defect_types WHERE is_active = true ORDER BY defect_name"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener tipos de defectos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getDefectStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT 
        dt.defect_name,
        COUNT(dr.id) as occurrences,
        SUM(dr.rejected_pairs) as total_rejected_pairs,
        dr.area
      FROM defect_records dr
      JOIN defect_types dt ON dr.defect_type_id = dt.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCounter = 1;

    if (startDate) {
      queryText += ` AND dr.record_date >= $${paramCounter}`;
      params.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      queryText += ` AND dr.record_date <= $${paramCounter}`;
      params.push(endDate);
      paramCounter++;
    }

    queryText += ` GROUP BY dt.defect_name, dr.area ORDER BY total_rejected_pairs DESC`;

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
