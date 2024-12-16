import { IncomingWebhook } from '@slack/webhook';
import { z } from 'zod';
import { isEmpty, some } from '@fxts/core';
import * as core from '@actions/core';

const MessageScheme = z.object({
  name: z.string(),
  version: z.string(),
});

const MessagesScheme = z.array(MessageScheme);

type Messages = z.infer<typeof MessagesScheme>;

const parseMessage = (message: string): Messages => {
  try {
    const json = JSON.parse(message);
    return MessagesScheme.parse(json);
  } catch (error) {
    return [];
  }
};

export async function run(): Promise<void> {
  try {
    const TITLE: string = core.getInput('TITLE');
    const WEB_HOOK_URL: string = core.getInput('WEB_HOOK_URL');
    const OWNER: string = core.getInput('OWNER');
    const AUTHOR: string = core.getInput('AUTHOR');
    const GITHUB_URL: string = core.getInput('GITHUB_URL');
    const REPOSITORY_NAME: string = core.getInput('REPOSITORY_NAME');
    const CHANGESET_MESSAGE: string = core.getInput('CHANGESET_MESSAGE');
    const webhook = new IncomingWebhook(WEB_HOOK_URL);
    const messages = parseMessage(CHANGESET_MESSAGE);
    const hasInvalidInput = some(isEmpty, [AUTHOR, WEB_HOOK_URL, REPOSITORY_NAME, CHANGESET_MESSAGE]);

    if (hasInvalidInput) {
      core.setFailed('Invalid input');
      return;
    }

    await webhook.send({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: TITLE,
            emoji: true,
          },
        },
      ],
      attachments: [
        {
          color: '#2EB67D',
          blocks: [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Repository:*',
                },
                {
                  type: 'mrkdwn',
                  text: `*<${GITHUB_URL}/${OWNER}/${REPOSITORY_NAME}|${REPOSITORY_NAME}>*`,
                },
                {
                  type: 'mrkdwn',
                  text: '*Author:*',
                },
                {
                  type: 'mrkdwn',
                  text: `*${AUTHOR}*`,
                },
              ],
            },
            ...messages.map(({ name, version }) => {
              return {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `<${GITHUB_URL}/${OWNER}/${REPOSITORY_NAME}/pkgs/npm/${name.replace(`@${OWNER}\/`, '')}|${name}@${version}>`,
                },
              };
            }),
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
