import { randomBytes, scryptSync } from 'node:crypto'

const password = process.argv[2]

if (!password) {
  console.error('Usage: npm run db:hash-password -- "<password>"')
  process.exit(1)
}

const salt = randomBytes(16)
const hash = scryptSync(password, salt, 64)

console.log(`scrypt:${salt.toString('hex')}:${hash.toString('hex')}`)
console.log('\nCopy the line above into ADMIN_PASSWORD_HASH in your .env.local file.')
