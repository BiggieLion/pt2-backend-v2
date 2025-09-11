export const configuration = () => ({
  // Server
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,

  // Database
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});
