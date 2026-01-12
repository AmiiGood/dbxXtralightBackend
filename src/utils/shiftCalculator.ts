import { query } from '../config/database';
import { ShiftConfig } from '../types';

/**
 * Calcula el número de turno basado en la hora proporcionada
 * Consulta la configuración de turnos en la base de datos
 */
export const calculateShift = async (time: string): Promise<number> => {
  try {
    const result = await query('SELECT * FROM shift_config ORDER BY shift_number');
    const shifts: ShiftConfig[] = result.rows;

    if (shifts.length === 0) {
      throw new Error('No hay configuración de turnos en la base de datos');
    }

    const currentTime = parseTime(time);

    for (const shift of shifts) {
      const startTime = parseTime(shift.start_time);
      const endTime = parseTime(shift.end_time);

      // Caso normal: turno no cruza medianoche
      if (startTime < endTime) {
        if (currentTime >= startTime && currentTime < endTime) {
          return shift.shift_number;
        }
      } 
      // Caso especial: turno cruza medianoche (ej: 23:00 a 07:00)
      else {
        if (currentTime >= startTime || currentTime < endTime) {
          return shift.shift_number;
        }
      }
    }

    // Si no encuentra turno, retorna el primer turno por defecto
    return shifts[0].shift_number;
  } catch (error) {
    console.error('Error al calcular turno:', error);
    throw error;
  }
};

/**
 * Convierte una cadena de tiempo (HH:MM:SS o HH:MM) a minutos desde medianoche
 */
const parseTime = (timeString: string): number => {
  const parts = timeString.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  return hours * 60 + minutes;
};

/**
 * Obtiene la configuración actual de turnos
 */
export const getShiftConfig = async (): Promise<ShiftConfig[]> => {
  const result = await query('SELECT * FROM shift_config ORDER BY shift_number');
  return result.rows;
};

/**
 * Actualiza la configuración de un turno
 */
export const updateShiftConfig = async (
  shiftNumber: number,
  startTime: string,
  endTime: string,
  description?: string
): Promise<ShiftConfig> => {
  const result = await query(
    `UPDATE shift_config 
     SET start_time = $1, end_time = $2, description = $3
     WHERE shift_number = $4
     RETURNING *`,
    [startTime, endTime, description, shiftNumber]
  );

  if (result.rows.length === 0) {
    throw new Error(`Turno ${shiftNumber} no encontrado`);
  }

  return result.rows[0];
};

/**
 * Obtiene el turno actual basado en la hora del sistema
 */
export const getCurrentShift = async (): Promise<number> => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return await calculateShift(currentTime);
};
