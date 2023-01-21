import hashPassword from "../lib/hashPassword.js"

export default async function signUpRoutes(server, options) {
  const { passport } = options

  server.get('/signup', (request, reply) => {
    if (request.user) {
      reply.redirect(302, '/items')
    }
    reply.view('src/views/signup.ejs')
  })

  server.post('/signup', async (request, reply) => {
    try {
      const client = await server.pg.connect()
      const { username, password } = request.body
      const hashedPassword = await hashPassword(password)
      const { rows } = await client.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, is_admin", [username, hashedPassword])
      const user = rows[0]
      await request.login(
        {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin
        }
      )
      client.release()
      await reply.redirect('/items')
    } catch (e) {
      reply.view('src/views/signup.ejs', { errorMessage: 'ユーザー名が既に使われているか、利用出来ない文字が含まれています' })
    }
  })
}
