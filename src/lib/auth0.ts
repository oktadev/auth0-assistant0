import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  // this is required to get federated access tokens from services like Google
  authorizationParameters: {
    access_type: 'offline',
    prompt: 'consent',
  },
});

export const getGoogleAccessToken = async () => {
  const { token } = await auth0.getAccessTokenForConnection({
    connection: 'google-oauth2',
  });
  return token;
};
