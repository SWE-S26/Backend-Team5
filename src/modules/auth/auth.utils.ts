import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthRepository } from './auth.repository';
import { ForbiddenError } from '../../shared/errors/responseErrors';

type GoogleAuthPayloadBase = {
  client?: string;
};

export type GoogleAuthPayload =
  | ({
      status: 'returning_google';
      userId: string;
      role: string;
      subscription: unknown;
    } & GoogleAuthPayloadBase)
  | ({
      status: 'existing';
      userId: string;
      role: string;
      subscription: unknown;
      email: string;
      displayName: string;
      googleId: string;
    } & GoogleAuthPayloadBase)
  | ({
      status: 'new';
      googleId: string;
      email: string;
      displayName: string;
    } & GoogleAuthPayloadBase);

const authRepository = new AuthRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const googleId = profile.id;
        const client =
          typeof req.query.state === 'string' ? req.query.state : undefined;

        if (!email) {
          return done(new Error('Google account has no email address'), false);
        }

        const existingUser = await authRepository.findByEmail(email);

        if (existingUser) {
          if (existingUser.ban) {
            return done(
              ForbiddenError(
                `Your account has been banned. Due to ${existingUser.banReason} Please contact support.`,
              ),
              false,
            );
          }

          if (existingUser.googleId) {
            const payload: GoogleAuthPayload = {
              status: 'returning_google',
              userId: existingUser._id.toString(),
              role: existingUser.role,
              subscription: existingUser.subscription,
              client,
            };
            return done(null, payload);
          }

          const payload: GoogleAuthPayload = {
            status: 'existing',
            userId: existingUser._id.toString(),
            role: existingUser.role,
            subscription: existingUser.subscription,
            email: existingUser.email,
            displayName: existingUser.displayName,
            googleId: googleId,
            client,
          };

          return done(null, payload);
        }

        const payload: GoogleAuthPayload = {
          status: 'new',
          googleId,
          email,
          displayName,
          client,
        };

        return done(null, payload);
      } catch (err) {
        return done(err as Error, false);
      }
    },
  ),
);

export default passport;
