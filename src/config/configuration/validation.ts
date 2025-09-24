import * as Joi from 'joi';

export const validationSchema: Joi.ObjectSchema<any> = Joi.object({
  // Server
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().default(3000),
  // DB
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // AWS
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY: Joi.string().required(),
  AWS_SECRET_KEY: Joi.string().required(),
  // Cognito
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),
  COGNITO_REQUESTER_GROUP: Joi.string().required(),
  COGNITO_ANALYST_GROUP: Joi.string().required(),
  COGNITO_SUPERVISOR_GROUP: Joi.string().required(),
  COGNITO_AUTHORITY: Joi.string().required(),
});
