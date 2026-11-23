/**
 * Passport OAuth 2.0 Configuration
 * Configures Google Strategy for OpenID Connect / OAuth 2.0 authentication.
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

  // Check if valid Google OAuth credentials are provided
  const hasValidCredentials =
    clientID &&
    clientSecret &&
    clientID !== 'your_google_client_id' &&
    clientSecret !== 'your_google_client_secret';

  if (!hasValidCredentials) {
    console.warn(
      '[OAuth 2.0] Google OAuth credentials are not fully configured. Browser redirect flow is disabled until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.'
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract primary verified email
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // Check if user already exists by googleId
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists by email (link accounts)
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos && profile.photos[0]) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }

          // Otherwise create a new user from Google profile
          user = await User.create({
            name: profile.displayName || 'Google User',
            email,
            googleId: profile.id,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : ''
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  console.log('[OAuth 2.0] Google Strategy registered successfully.');
};

module.exports = configurePassport;
