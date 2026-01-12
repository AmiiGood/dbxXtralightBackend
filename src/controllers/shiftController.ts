import { Request, Response } from "express";
import {
  getShiftConfig,
  updateShiftConfig,
  getCurrentShift,
} from "../utils/shiftCalculator";
import {
  createAuditLog,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../utils/auditLogger";
import { query } from "../config/database";

export const getShifts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const shifts = await getShiftConfig();
    res.json(shifts);
  } catch (error) {
    console.error("Error al obtener configuración de turnos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const updateShift = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { shiftNumber } = req.params;
    const { start_time, end_time, description } = req.body;

    if (!start_time || !end_time) {
      res.status(400).json({ error: "Hora de inicio y fin son requeridas" });
      return;
    }

    // Validar formato de tiempo
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      res
        .status(400)
        .json({ error: "Formato de hora inválido (HH:MM o HH:MM:SS)" });
      return;
    }

    // Obtener configuración anterior
    const oldConfig = await query(
      "SELECT * FROM shift_config WHERE shift_number = $1",
      [parseInt(shiftNumber)]
    );

    if (oldConfig.rows.length === 0) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }

    // Actualizar
    const updatedShift = await updateShiftConfig(
      parseInt(shiftNumber),
      start_time,
      end_time,
      description
    );

    // Log de auditoría
    await createAuditLog({
      userId: req.user!.id,
      action: AUDIT_ACTIONS.SHIFT_CONFIG_UPDATED,
      entityType: ENTITY_TYPES.SHIFT_CONFIG,
      entityId: shiftNumber,
      details: {
        old: oldConfig.rows[0],
        new: updatedShift,
      },
    });

    res.json(updatedShift);
  } catch (error) {
    console.error("Error al actualizar turno:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getCurrentShiftInfo = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentShift = await getCurrentShift();
    const shifts = await getShiftConfig();
    const shiftInfo = shifts.find((s) => s.shift_number === currentShift);

    res.json({
      current_shift: currentShift,
      shift_info: shiftInfo,
    });
  } catch (error) {
    console.error("Error al obtener turno actual:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
