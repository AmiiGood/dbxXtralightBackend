import { Router } from 'express';
import { getShifts, updateShift, getCurrentShiftInfo } from '../controllers/shiftController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener configuración de turnos (todos los usuarios autenticados)
router.get('/', getShifts);
router.get('/current', getCurrentShiftInfo);

// Actualizar turnos (solo admin)
router.put('/:shiftNumber', authorizeRoles('admin'), updateShift);

export default router;
