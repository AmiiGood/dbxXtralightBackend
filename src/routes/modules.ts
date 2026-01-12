import { Router } from "express";
import {
  getAllModules,
  createModule,
  getAllDepartments,
  assignModuleToDepartment,
  revokeModuleFromDepartment,
  assignPermissionToUser,
  getUserPermissions,
  getDepartmentModules,
} from "../controllers/modulesController";
import { getUserModules } from "../middleware/moduleAccess";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener módulos del usuario actual (cualquier usuario autenticado)
router.get("/user/modules", getUserModules);

// Solo admins pueden gestionar módulos y permisos
router.get("/", authorizeRoles("admin"), getAllModules);
router.post("/", authorizeRoles("admin"), createModule);

router.get("/departments", authorizeRoles("admin"), getAllDepartments);
router.get(
  "/departments/:departmentId/modules",
  authorizeRoles("admin"),
  getDepartmentModules
);

router.post(
  "/departments/assign",
  authorizeRoles("admin"),
  assignModuleToDepartment
);
router.delete(
  "/departments/:departmentId/modules/:moduleId",
  authorizeRoles("admin"),
  revokeModuleFromDepartment
);

router.post(
  "/users/permissions",
  authorizeRoles("admin"),
  assignPermissionToUser
);
router.get(
  "/users/:userId/permissions",
  authorizeRoles("admin"),
  getUserPermissions
);

export default router;
