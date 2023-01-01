import fastify from "fastify";
import view from "@fastify/view"
import postgres from "@fastify/postgres"
import connectPgSimple from "connect-pg-simple"
import formbody from "@fastify/formbody"
import session from "@fastify/session"
import cookie from "@fastify/cookie"

import ejs from "ejs"
import * as dotenv from "dotenv"

dotenv.config()
const server = fastify();
const pgSession = new connectPgSimple(session)

server.register(view, {
  engine: {
    ejs: ejs
  }
})

server.register(cookie)

const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}`

// allow insecure cookie only during development
server.register(session, {
  secret: process.env.SESSION_SECRET,
  store: new pgSession({
    conString: connectionString,
  }),
  cookie: process.env.NODE_ENV == "development" ? { secure: false } : {},
});


server.register(formbody)

server.register(postgres, {
  connectionString
})

server.get("/items", async (request, reply) => {
  const client = await server.pg.connect()
  const result = await client.query(
    "SELECT id, name, description, price FROM items"
  );

  await reply.view("/src/views/items.ejs", {
    items: result.rows,
    itemsInCart: request.session.items
  })
})

server.post("/items", async (request, reply) => {
  const { itemId, quantity } = request.body

  // 1. Initialize
  request.session.items ??= {}

  // 2. Current quantity of the itemId
  request.session.items[itemId] ??= 0

  // 3. Increase the quantity
  request.session.items[itemId] += Number(quantity)

  await reply.redirect(302, '/items')
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
