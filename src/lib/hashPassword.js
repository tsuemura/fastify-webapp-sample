import crypto from "crypto"

export default async function hashPassword(plainPassword) {
  const salt = 'saltsalt'
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(plainPassword, salt, 10000, 64, 'sha256', function (err, hash) {
      resolve(hash.toString('base64'))
    });
  })
}
