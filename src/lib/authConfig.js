import { Authenticator } from "@fastify/passport";
import session from "@fastify/session";
import cookie from "@fastify/cookie";
import LocalStrategy from "passport-local"
import connectPgSimple from "connect-pg-simple"

export default async function authConfig(server) {
  const passport = new Authenticator();
  server.register(cookie);
  const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}`;
  const pgSession = new connectPgSimple(session)
  // allow insecure cookie only during development
  server.register(session, {
    secret: process.env.SESSION_SECRET,
    store: new pgSession({
      conString: connectionString,
    }),
    cookie: process.env.NODE_ENV == "development" ? { secure: false } : {},
  });

  server.register(passport.initialize());
  server.register(passport.secureSession());

  passport.use(
    "local",
    new LocalStrategy(function (username, password, done) {
      if (username == "admin" && password == "admin") {
        return done(null, { id: 1, username: "admin" });
      }
      return done(null, false);
    })
  );

  passport.registerUserSerializer(async (user, request) => user.id);
  passport.registerUserDeserializer((id, request) => ({
    id: 1,
    username: "admin",
    isAdmin: true,
  }));

  return passport
}

