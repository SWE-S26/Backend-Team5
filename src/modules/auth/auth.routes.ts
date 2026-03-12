import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();
//TODO: const authController = new AuthController(/* TODO: inject service */);

// authRouter.get('/',      (req, res) => authController.findAll(req, res));
// authRouter.get('/:id',   (req, res) => authController.findOne(req, res));
// authRouter.post('/',     (req, res) => authController.create(req, res));
// authRouter.put('/:id',   (req, res) => authController.replace(req, res));
// authRouter.patch('/:id', (req, res) => authController.update(req, res));
// authRouter.delete('/:id',(req, res) => authController.remove(req, res));

export default router;
