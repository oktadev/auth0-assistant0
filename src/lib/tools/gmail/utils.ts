// import { getGoogleAccessToken } from '@/lib/auth0';

// export const searchEmails = async (query: string) => {
//   const accessToken = await getGoogleAccessToken();
//   const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       'Content-Type': 'application/json',
//     },
//   });
//   return response.json();
// };

// const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// export async function verifyAccessToken(accessToken: string, scopesToCheck: string[] | string): Promise<boolean> {
//   const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?accessToken=${accessToken}`);

//   if (!res.ok) {
//     console.log(`Unable to verify Google API access token: ${await res.text()}`);
//     return false;
//   }

//   const tokenInfo = await res.json();
//   const tokenScopes = tokenInfo.scope.split(' ');

//   return (Array.isArray(scopesToCheck) ? scopesToCheck : [scopesToCheck]).every((scope) => tokenScopes.includes(scope));
// }
