import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '../controllers/usersController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPassword);

export default router;
