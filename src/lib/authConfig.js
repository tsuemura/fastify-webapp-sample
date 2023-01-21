import { Authenticator } from "@fastify/passport";
import session from "@fastify/session";
import cookie from "@fastify/cookie";
import LocalStrategy from "passport-local"
import connectPgSimple from "connect-pg-simple"
import hashPassword from "./hashPassword.js";
import pg from 'pg';

export default async function authConfig(server) {
  const passport = new Authenticator();
  server.register(cookie);
  const pgPool = new pg.Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 20,
  });
  const pgSession = new connectPgSimple(session)
  // allow insecure cookie only during development
  server.register(session, {
    secret: process.env.SESSION_SECRET,
    store: new pgSession({
      pool: pgPool
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
      client.release()
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
    const { rows } = await client.query('SELECT id, username, is_admin, fullname, tel FROM users WHERE id = $1', [id])
    const user = rows[0]
    client.release()
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      fullname: user.fullname,
      tel: user.tel
    }
  });

  return passport
}


