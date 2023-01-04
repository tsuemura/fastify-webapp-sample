import { Authenticator } from "@fastify/passport";
import session from "@fastify/session";
import cookie from "@fastify/cookie";
import LocalStrategy from "passport-local"
import connectPgSimple from "connect-pg-simple"
import hashPassword from "./hashPassword.js";

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
    new LocalStrategy(async function (username, password, done) {
      const client = await server.pg.connect();

      const { rows } = await client.query("SELECT id, username, password FROM users WHERE username = $1", [username])
      const user = rows[0]
      if (!user) {
        return done(null, false)
      }

      const hashedPassword = await hashPassword(password)
      if (hashedPassword === user.password) {
        return done(null, user)
      }

      return done(null, false);
    })
  );

  passport.registerUserSerializer(async (user, request) => user.id);
  passport.registerUserDeserializer(async (id,  request) => {
    const client = await server.pg.connect();
    const { rows } = await client.query('SELECT id, username, password FROM users WHERE id = $1', [id])
    const user = rows[0]
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin
    }
  });

  return passport
}

