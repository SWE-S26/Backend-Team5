import { Router } from 'express';
import { AuthController } from './auth.controller';
import apiVersions from '../../shared/middleware/apiVersions';

const authRouter = Router();
const authController = new AuthController();

authRouter.post(
  apiVersions.v1 + '/find-email',
  authController.checkEmailExists.bind(authController),
);
authRouter.post(
  apiVersions.v1 + '/sign-up',
  authController.registerUser.bind(authController),
);
authRouter.post(
  apiVersions.v1 + '/login',
  authController.logInUser.bind(authController),
);

export default authRouter;
