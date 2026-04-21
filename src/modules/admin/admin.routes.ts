import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import apiVersions from '../../shared/middleware/apiVersions';

const router = Router();
const adminController = new AdminController(
  new AdminService(new AdminRepository()),
);

router.get(apiVersions.v1 + '/users', (req, res) =>
  adminController.findAll(req, res),
);

router.patch(apiVersions.v1 + '/users/:userId/suspend', (req, res) =>
  adminController.suspendUser(req, res),
);

router.patch(apiVersions.v1 + '/users/:userId/unsuspend', (req, res) =>
  adminController.unsuspendUser(req, res),
);

router.delete(apiVersions.v1 + '/users/:userId', (req, res) =>
  adminController.deleteUser(req, res),
);
// adminRouter.get('/:id',   (req, res) => adminController.findOne(req, res));
// adminRouter.post('/',     (req, res) => adminController.create(req, res));
// adminRouter.put('/:id',   (req, res) => adminController.replace(req, res));
// adminRouter.patch('/:id', (req, res) => adminController.update(req, res));
// adminRouter.delete('/:id',(req, res) => adminController.remove(req, res));

export default router;
