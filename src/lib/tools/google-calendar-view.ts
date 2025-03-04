import { tool } from 'ai';
import { z } from 'zod';
import { google } from 'googleapis';
import { getGoogleAccessToken } from '../auth0';

export const googleCalendarViewTool = tool({
  description: "Check a user's schedule between the given date times on their calendar",
  parameters: z.object({
    timeMin: z.coerce.date(),
    timeMax: z.coerce.date(),
  }),
  execute: async ({ timeMin, timeMax }) => {
    // Get the access token via Auth0
    const accessToken = await getGoogleAccessToken();

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const calender = google.calendar({ version: 'v3', auth });

    const response = await calender.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      timeZone: 'UTC',
    });

    return {
      status: 'success',
      startDate: timeMin,
      endDate: timeMax,
      events: response?.data?.items,
    };
  },
});
