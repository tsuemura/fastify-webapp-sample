export default async function loginRoutes(server, options) {
  const { passport } = options

  server.get("/login", async (request, reply) => {
    if (request.user) {
      await reply.redirect(302, "/items")
    }
    await reply.view("/src/views/login.ejs");
  });

  server.post(
    "/login",
    {
      preValidation: passport.authenticate("local", {
        authInfo: false,
      }),
    },
    async (request, reply) => {
      await reply.redirect("/items");
    }
  );

  server.get(
    '/logout',
    async (request, reply) => {
      await request.logOut()
      await reply.redirect(302, '/login')
    }
  )
}
