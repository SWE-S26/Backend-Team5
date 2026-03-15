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

authRouter.post(
  apiVersions.v1 + '/forgot-password',
  authController.forgotPassword.bind(authController),
);

authRouter.post(
  apiVersions.v1 + '/reset-password',
  authController.resetPassword.bind(authController),
);

authRouter.get(
  apiVersions.v1 + '/verify-email',
  authController.verifyEmail.bind(authController),
);

authRouter.get(
  apiVersions.v1 + '/logout',
  authController.logout.bind(authController),
);

export default authRouter;
