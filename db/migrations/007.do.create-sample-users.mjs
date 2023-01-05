import hashPassword from '../../src/lib/hashPassword.js'

const sampleUsers = [
  {
    username: 'admin',
    password: 'admin',
    is_admin: true,
  },
  {
    username: 'user1',
    password: 'super-strong-passphrase',
    is_admin: false
  },
]

export async function generateSql() {
  const values = []
  for (let user of sampleUsers) {
    const hashedPassword = await hashPassword(user.password)
    values.push(`('${user.username}','${hashedPassword}',${user.is_admin})`)
  }

  const sql = 'INSERT INTO users (username, password, is_admin) VALUES ' + values.join(',')
  return sql
}
