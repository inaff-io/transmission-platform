// Use a variável de ambiente DATABASE_URL para conexão
export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};