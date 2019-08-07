const { ActivityTypes, CardFactory, ConversationState, InputHints, MemoryStorage, TestAdapter } = require('botbuilder-core');
const { OAuthPrompt, OAuthPromptSettings, DialogSet, DialogTurnStatus, ListStyle } = require('../');
const assert = require('assert');

const beginMessage = { text: `begin`, type: 'message' };
const answerMessage = { text: `yes`, type: 'message' };
const invalidMessage = { text: `what?`, type: 'message' };

describe('OAuthPrompt', function () {
    this.timeout(5000);

    it('should call OAuthPrompt', async function () {
        var connectionName = "myConnection";
        var token = "abc123";

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { });
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result.token) {
                    await turnContext.sendActivity(`Logged in.`);
                }
                else {
                    await turnContext.sendActivity(`Failed`);
                }
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and AttachmentPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new OAuthPrompt('prompt', {
                connectionName,
                title: 'Login',
                timeout: 300000
            }));

        await adapter.send('Hello')
            .assertReply(activity  => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);
                assert(activity.inputHint === InputHints.AcceptingInput);

                // send a mock EventActivity back to the bot with the token
                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token);

                var eventActivity = createReply(activity);
                eventActivity.type = ActivityTypes.Event;
                var from = eventActivity.from;
                eventActivity.from = eventActivity.recipient;
                eventActivity.recipient = from;
                eventActivity.name = "tokens/response";
                eventActivity.value = {
                    connectionName,
                    token
                };

                adapter.send(eventActivity);
            })
            .assertReply('Logged in.');
    });

    it('should call OAuthPrompt with code', async function () {
        var connectionName = "myConnection";
        var token = "abc123";
        var magicCode = "888999";

        // Initialize TestAdapter.
        const adapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.prompt('prompt', { });
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result.token) {
                    await turnContext.sendActivity(`Logged in.`);
                }
                else {
                    await turnContext.sendActivity(`Failed`);
                }
            }
            await convoState.saveChanges(turnContext);
        });

        // Create new ConversationState with MemoryStorage and register the state as middleware.
        const convoState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and AttachmentPrompt.
        const dialogState = convoState.createProperty('dialogState');
        const dialogs = new DialogSet(dialogState);
        dialogs.add(new OAuthPrompt('prompt', {
                connectionName,
                title: 'Login',
                timeout: 300000
            }));

        await adapter.send('Hello')
            .assertReply(activity  => {
                assert(activity.attachments.length === 1);
                assert(activity.attachments[0].contentType === CardFactory.contentTypes.oauthCard);

                // send a mock EventActivity back to the bot with the token
                adapter.addUserToken(connectionName, activity.channelId, activity.recipient.id, token, magicCode);
            })
            .send(magicCode)
            .assertReply('Logged in.');
    });
});

function createReply(activity) {
    return {
        type: ActivityTypes.Message,
        from: { id: activity.recipient.id, name: activity.recipient.name },
        recipient: { id: activity.from.id, name: activity.from.name },
        replyToId: activity.id,
        serviceUrl: activity.serviceUrl,
        channelId: activity.channelId,
        conversation: { isGroup: activity.conversation.isGroup, id: activity.conversation.id, name: activity.conversation.name },
    };
}
