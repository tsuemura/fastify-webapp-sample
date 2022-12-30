import fastify from "fastify";
import view from "@fastify/view"
import postgres from "@fastify/postgres"
import ejs from "ejs"

const server = fastify();

server.register(view, {
  engine: {
    ejs: ejs
  }
})

server.register(postgres, {
  connectionString: 'postgres://admin@admin@localhost:5432'
})

server.get("/items", async (request, reply) => {
  reply.view("/src/views/items.ejs", {
    items: [
      { name: 'foo' },
      { name: 'bar' },
    ]
  })
  return reply
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
