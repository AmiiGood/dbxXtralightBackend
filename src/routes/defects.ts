import { Router } from "express";
import {
  createDefectRecord,
  getMyDefectRecords,
  getAllDefectRecords,
  getDefectTypes,
  getDefectStats,
} from "../controllers/defectsController";
import { authenticateToken } from "../middleware/auth";
import { checkModuleAccess, checkPermission } from "../middleware/moduleAccess";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Todas las rutas de este módulo requieren acceso al módulo de defectos
router.use(checkModuleAccess("quality_defects"));

// Rutas públicas del módulo (solo requieren acceso al módulo)
router.get("/types", getDefectTypes);

// Crear registro (requiere permiso 'create')
router.post(
  "/",
  checkPermission("quality_defects", "create"),
  createDefectRecord
);

// Ver mis registros (requiere permiso 'read')
router.get(
  "/my-records",
  checkPermission("quality_defects", "read"),
  getMyDefectRecords
);

// Ver todos los registros (requiere permiso 'read' - típicamente solo admin)
router.get(
  "/all",
  checkPermission("quality_defects", "read"),
  getAllDefectRecords
);

// Ver estadísticas (requiere permiso 'stats')
router.get(
  "/stats",
  checkPermission("quality_defects", "stats"),
  getDefectStats
);

export default router;
