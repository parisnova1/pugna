import { existsSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')

if (!existsSync(envPath)) {
  const secret = randomBytes(48).toString('hex')
  writeFileSync(envPath, `JWT_SECRET=${secret}\n`)
  console.log('Generated server/.env with a new JWT_SECRET.')
}

process.loadEnvFile(envPath)
