import { Router } from 'express';
const router = Router();

import devSwagger from './documentationIntegrator/swagger.dev';

router.use(devSwagger);

import userRoutes from '../user/user.routes';
router.use('/users', userRoutes);

export default router;
