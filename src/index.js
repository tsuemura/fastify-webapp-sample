import fastify from "fastify";
import view from "@fastify/view"
import postgres from "@fastify/postgres"
import formbody from "@fastify/formbody"
import ejs from "ejs"
import authConfig from "./lib/authConfig.js";
import loginRoutes from "./routes/login.js";
import itemRoutes from "./routes/items.js";
import orderRoutes from "./routes/order.js";
import signUpRoutes from "./routes/signUp.js";
import * as dotenv from "dotenv"

dotenv.config()
const server = fastify();

server.register(view, {
  engine: {
    ejs: ejs
  }
})

server.register(formbody)

const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}`;
server.register(postgres, {
  connectionString
})

const passport = await authConfig(server)

// Routes
server.register(loginRoutes, { passport })
server.register(itemRoutes, { passport })
server.register(orderRoutes, { passport })
server.register(signUpRoutes, { passport })

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
