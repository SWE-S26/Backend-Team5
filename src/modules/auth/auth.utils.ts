import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthRepository } from './auth.repository';

export type GoogleAuthPayload =
  | {
      status: 'existing';
      userId: string;
      role: string;
      subscription: unknown;
      email: string;
      displayName: string;
      googleId: string;
    }
  | {
      status: 'new';
      googleId: string;
      email: string;
      displayName: string;
    };

const authRepository = new AuthRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          return done(new Error('Google account has no email address'), false);
        }

        const existingUser = await authRepository.findByEmail(email);

        if (existingUser) {
          const payload: GoogleAuthPayload = {
            status: 'existing',
            userId: existingUser._id.toString(),
            role: existingUser.role,
            subscription: existingUser.subscription,
            email: existingUser.email,
            displayName: existingUser.displayName,
            googleId: googleId,
          };

          return done(null, payload);
        }

        const payload: GoogleAuthPayload = {
          status: 'new',
          googleId,
          email,
          displayName,
        };

        return done(null, payload);
      } catch (err) {
        return done(err as Error, false);
      }
    },
  ),
);

export default passport;
