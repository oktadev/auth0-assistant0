import { NextRequest, NextResponse } from 'next/server';
import { type Message, LangChainAdapter } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { SystemMessage } from '@langchain/core/messages';

import { GmailSearch } from '@/lib/tools/gmail/search';
import { getGoogleAccessToken } from '@/lib/auth0';
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { logToolCallsInDevelopment } from '@/utils/stream-logging';
import { GmailCreateDraft } from '@/lib/tools/gmail/create_draft';
import { GmailGetMessage } from '@/lib/tools/gmail/get_message';
import { GmailGetThread } from '@/lib/tools/gmail/get_thread';
import { GmailSendMessage } from '@/lib/tools/gmail/send_message';
import { GoogleCalendarCreateTool, GoogleCalendarViewTool } from '@/lib/tools/google_calendar';

export const runtime = 'nodejs';

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. You have access to a set of tools, use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks.`;

/**
 * This handler initializes and calls an tool calling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? [])
      .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
      .map(convertVercelMessageToLangChainMessage);

    const chat = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    });

    // Provide the access token to the Gmail tools
    const gmailParams = {
      credentials: {
        accessToken: await getGoogleAccessToken(),
      },
    };

    const googleCalendarParams = {
      credentials: {
        accessToken: await getGoogleAccessToken(),
        calendarId: 'primary',
      },
      model: chat,
    };

    const tools = [
      new Calculator(),
      // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
      new SerpAPI(),
      new GmailSearch(gmailParams),
      new GmailCreateDraft(gmailParams),
      new GmailGetMessage(gmailParams),
      new GmailGetThread(gmailParams),
      new GmailSendMessage(gmailParams),
      new GoogleCalendarCreateTool(googleCalendarParams),
      new GoogleCalendarViewTool(googleCalendarParams),
    ];
    /**
     * Use a prebuilt LangGraph agent.
     */
    const agent = createReactAgent({
      llm: chat,
      tools,
      /**
       * Modify the stock prompt in the prebuilt agent. See docs
       * for how to customize your agent:
       *
       * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
       */
      messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
    });

    /**
     * Stream back all generated tokens and steps from their runs.
     *
     * See: https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/
     */
    const eventStream = agent.streamEvents({ messages }, { version: 'v2' });

    // Log tool calling data. Only in development mode
    const transformedStream = logToolCallsInDevelopment(eventStream);

    return LangChainAdapter.toDataStreamResponse(transformedStream);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
