export default async function usersRoute(server, options) {
  server.get('/users/:id/edit', async (request, reply) => {
    if (request.user.id != request.params.id) {
      await reply.redirect(403, '/items')
    }
    await reply.view('/src/views/editUser.ejs', { user: request.user })
  })

  server.post('/users/:id/edit', async (request, reply) => {
    const client = await server.pg.connect()
    if (request.user.id != request.params.id) {
      await reply.redirect(403, "/items");
    }
    const { fullname, tel } = request.body
    await client.query("UPDATE users SET fullname = $1, tel = $2 WHERE id = $3", [fullname, tel, request.params.id])
    await reply.view("/src/views/editUser.ejs", { user: request.user });
  })
}
