import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogsByEntity,
  getAuditStats,
} from '../controllers/auditController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/:entityType/:entityId', getAuditLogsByEntity);

export default router;
