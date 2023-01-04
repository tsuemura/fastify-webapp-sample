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
      await client.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, password", [username, password])
      await passport.authenticate("test", { authInfo: false });
      reply.redirect('/items')
    } catch (e) {
      console.log(e)
      reply.view('src/views/signup.ejs', { errorMessage: 'ユーザー名が既に使われているか、利用出来ない文字が含まれています' })
    }

  })
}
