export const configuration = () => ({
  // Server
  node_env: process.env.NODE_ENV,
  port: process.env.PORT ? Number(process.env.PORT) : 3000,

  // Database
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION,
    accessKey: process.env.AWS_ACCESS_KEY,
    secretKey: process.env.AWS_SECRET_KEY,
  },

  // Cognito
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    requesterGroup: process.env.COGNITO_REQUESTER_GROUP,
    analystGroup: process.env.COGNITO_ANALYST_GROUP,
    supervisorGroup: process.env.COGNITO_SUPERVISOR_GROUP,
    authority: process.env.COGNITO_AUTHORITY,
  },
});
