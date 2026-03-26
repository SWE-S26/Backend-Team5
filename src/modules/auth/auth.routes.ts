import { Router } from 'express';
import { AuthController } from './auth.controller';
import apiVersions from '../../shared/middleware/apiVersions';
import { requireAuth } from '../../shared/middleware/requireAuth';

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
  apiVersions.v1 + '/resend-verification-email',
  authController.resendVerificationEmail.bind(authController),
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

authRouter.get(apiVersions.v1 + '/google', authController.googleRedirect);

authRouter.get(
  apiVersions.v1 + '/google/callback',
  authController.googleCallback,
);

authRouter.post(
  apiVersions.v1 + '/google/complete',
  authController.googleCompleteSignUp,
);

authRouter.post(
  apiVersions.v1 + '/google/verify-code',
  authController.googleVerifyCode,
);

authRouter.get(
  apiVersions.v1 + '/cross/desktop',
  authController.createQRCode.bind(authController),
);

authRouter.post(
  apiVersions.v1 + '/cross/mobile',
  requireAuth,
  authController.approveLoginFromMobile.bind(authController),
);

authRouter.post(
  apiVersions.v1 + '/cross/desktop/poll',
  authController.pollQRCode.bind(authController),
);

authRouter.delete(
  apiVersions.v1 + '/delete-account',
  requireAuth,
  authController.deleteAccount.bind(authController),
);

export default authRouter;
