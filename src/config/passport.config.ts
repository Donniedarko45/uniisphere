import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = await prisma.user.create({
          data: {
            googleId: profile.id,
            email: profile.emails![0].value,
            username: profile.displayName,
            profilePictureUrl: profile.photos?.[0].value,
            passwordHash: "",
          },
        });

        done(null, newUser);
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  ),
);

export default passport;
