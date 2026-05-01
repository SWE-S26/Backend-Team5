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

router.get(apiVersions.v1 + '/media', (req, res) =>
  adminController.listMedia(req, res),
);

router.get(apiVersions.v1 + '/reports', (req, res) =>
  adminController.listReports(req, res),
);

router.get(apiVersions.v1 + '/analytics/overview', (req, res) =>
  adminController.analyticsOverview(req, res),
);

router.get(apiVersions.v1 + '/analytics/storage', (req, res) =>
  adminController.analyticsStorage(req, res),
);

router.get(apiVersions.v1 + '/artist-analytics/me', (req, res) =>
  adminController.artistAnalytics(req, res),
);

router.post(apiVersions.v1 + '/reports', (req, res) =>
  adminController.createReport(req, res),
);

router.patch(apiVersions.v1 + '/reports/:reportId/status', (req, res) =>
  adminController.updateReportStatus(req, res),
);

router.patch(apiVersions.v1 + '/users/:userId/suspend', (req, res) =>
  adminController.suspendUser(req, res),
);

router.patch(apiVersions.v1 + '/users/:userId/unsuspend', (req, res) =>
  adminController.unsuspendUser(req, res),
);

router.patch(apiVersions.v1 + '/tracks/:trackId/ban', (req, res) =>
  adminController.banTrack(req, res),
);

router.patch(apiVersions.v1 + '/tracks/:trackId/unban', (req, res) =>
  adminController.unbanTrack(req, res),
);

router.delete(apiVersions.v1 + '/users/:userId', (req, res) =>
  adminController.deleteUser(req, res),
);

router.delete(apiVersions.v1 + '/tracks/:trackId', (req, res) =>
  adminController.deleteTrack(req, res),
);
// adminRouter.get('/:id',   (req, res) => adminController.findOne(req, res));
// adminRouter.post('/',     (req, res) => adminController.create(req, res));
// adminRouter.put('/:id',   (req, res) => adminController.replace(req, res));
// adminRouter.patch('/:id', (req, res) => adminController.update(req, res));
// adminRouter.delete('/:id',(req, res) => adminController.remove(req, res));

export default router;
