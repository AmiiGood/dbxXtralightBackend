import { Router } from 'express';
import {
  createDefectRecord,
  getMyDefectRecords,
  getAllDefectRecords,
  getDefectTypes,
  getDefectStats,
} from '../controllers/defectsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para obtener tipos de defectos (todos los usuarios autenticados)
router.get('/types', getDefectTypes);

// Rutas para usuarios de calidad
router.post('/', authorizeRoles('admin', 'calidad'), createDefectRecord);
router.get('/my-records', authorizeRoles('admin', 'calidad'), getMyDefectRecords);

// Rutas solo para admin
router.get('/all', authorizeRoles('admin'), getAllDefectRecords);
router.get('/stats', authorizeRoles('admin'), getDefectStats);

export default router;
