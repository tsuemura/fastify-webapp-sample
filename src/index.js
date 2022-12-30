import fastify from "fastify";
import view from "@fastify/view"
import postgres from "@fastify/postgres"
import ejs from "ejs"
import * as dotenv from "dotenv"
import { resourceLimits } from "worker_threads";

dotenv.config()
const server = fastify();

server.register(view, {
  engine: {
    ejs: ejs
  }
})

const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}`

server.register(postgres, {
  connectionString,
})

server.get("/items", async (request, reply) => {
  const client = await server.pg.connect()
  const result = await client.query(
    "SELECT id, name, description, price FROM items"
  );
  await reply.view("/src/views/items.ejs", { items: result.rows })
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
