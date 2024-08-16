export default async function loginRoutes(server, options) {
  const { passport } = options

  server.get("/login", async (request, reply) => {
    if (request.user) {
      return reply.redirect(302, "/items")
    }
    return reply.view("/src/views/login.ejs");
  });

  server.post(
    "/login",
    {
      preValidation: passport.authenticate("local", {
        //successRedirect: "/items",
        authInfo: false,
      }),
    },
    async (request, reply) => {
      if (request.isAuthenticated()) {
        return reply.redirect("/items");
      } else {
        return reply.redirect("/login");
      }
    }
  );

  server.get(
    '/logout',
    async (request, reply) => {
      await request.logOut()
      return reply.redirect(302, '/login')
    }
  )
}
