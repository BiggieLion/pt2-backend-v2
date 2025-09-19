export interface JwtToken {
  sub: string;
  email?: string;
  name?: string;
  'cognito:groups'?: string[];
  'cognito:username'?: string;
  token_use?: 'id' | 'access';
  aud?: string;
  iss?: string;
}
