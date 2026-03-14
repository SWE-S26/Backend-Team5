import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from '../user/user.repository';

const authRouter = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// find email
authRouter.post('/find-email', (req, res) =>
  authController.checkEmail(req, res),
);
// authRouter.get('/:id',   (req, res) => authController.findOne(req, res));
// authRouter.post('/',     (req, res) => authController.create(req, res));
// authRouter.put('/:id',   (req, res) => authController.replace(req, res));
// authRouter.patch('/:id', (req, res) => authController.update(req, res));
// authRouter.delete('/:id',(req, res) => authController.remove(req, res));

export default authRouter;
