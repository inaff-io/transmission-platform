import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  VIMEO_ACCESS_TOKEN: z.string()
})

const env = envSchema.parse(process.env)

export default env
