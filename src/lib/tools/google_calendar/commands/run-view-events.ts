import { calendar_v3 } from 'googleapis';
import type { OAuth2Client, JWT } from 'googleapis-common';
import { PromptTemplate } from '@langchain/core/prompts';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { StringOutputParser } from '@langchain/core/output_parsers';

import { VIEW_EVENTS_PROMPT } from '../prompts/index';
import { getTimezoneOffsetInHours } from '../utils/get-timezone-offset-in-hours';

type RunViewEventParams = {
  calendarId: string;
  calendar: calendar_v3.Calendar;
  model: BaseLanguageModel;
};

const runViewEvents = async (
  query: string,
  { model, calendar, calendarId }: RunViewEventParams,
  runManager?: CallbackManagerForToolRun,
) => {
  const prompt = new PromptTemplate({
    template: VIEW_EVENTS_PROMPT,
    inputVariables: ['date', 'query', 'u_timezone', 'dayName'],
  });

  const viewEventsChain = prompt.pipe(model).pipe(new StringOutputParser());

  const date = new Date().toISOString();
  const u_timezone = getTimezoneOffsetInHours();
  const dayName = new Date().toLocaleString('en-us', { weekday: 'long' });

  const output = await viewEventsChain.invoke(
    {
      query,
      date,
      u_timezone,
      dayName,
    },
    runManager?.getChild(),
  );
  const loaded = JSON.parse(output);

  try {
    const response = await calendar.events.list({
      calendarId,
      ...loaded,
    });

    const curatedItems =
      response.data && response.data.items
        ? response.data.items.map(
            ({
              status,
              summary,
              description,
              start,
              end,
            }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any) => ({
              status,
              summary,
              description,
              start,
              end,
            }),
          )
        : [];

    return `Result for the prompt "${query}": \n${JSON.stringify(curatedItems, null, 2)}`;
  } catch (error) {
    return `An error occurred: ${error}`;
  }
};

export { runViewEvents };
