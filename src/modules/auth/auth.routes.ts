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

authRouter.get(
  apiVersions.v1 + '/refresh-token',
  authController.refreshToken.bind(authController),
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

authRouter.get('/v1/google', authController.googleRedirect);
authRouter.get('/v1/google/callback', authController.googleCallback);
authRouter.post('/v1/google/complete', authController.googleCompleteSignUp);

export default authRouter;
