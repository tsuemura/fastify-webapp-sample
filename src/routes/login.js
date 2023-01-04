export default async function loginRoutes(server, options) {
  const { passport } = options

  server.get("/login", async (request, reply) => {
    await reply.view("/src/views/login.ejs");
  });

  server.post(
    "/login",
    {
      preValidation: passport.authenticate("local", {
        successRedirect: "/items",
        authInfo: false,
      }),
    },
    async (request, reply) => {
      reply.redirect("/items");
    }
  );
}
