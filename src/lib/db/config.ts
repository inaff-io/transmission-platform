// Use DIRECT_URL (Session Pooler IPv4) para evitar erro IPv6
// Fallback para DATABASE_URL se DIRECT_URL não estiver definido
export const dbConfig = {
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};