require('dotenv').config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const  { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require('telegram/events');
const ogg = require("./ogg.js");
const openai = require("./openai.js");

const apiId = Number(process.env.API_ID); 
const apiHash = process.env.API_HASH; 
const authorizedUsers = (process.env.AUTHORIZED_UZERS_ID).split(","); 
const chatWithGptIdNum = Number(process.env.CHAT_WITH_GPT_ID); 
const chatWithGptId = chatWithGptIdNum < 0 ? chatWithGptIdNum * -1 : chatWithGptIdNum; 

const stringSession = new StringSession(process.env.TG_SESSION);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const sessions = new Map();


const telegramClient = async () => {

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    // --------------------------------------
    await client.start({
        phoneNumber: process.env.USER_PHONE,
        password: process.env.USER_PASSWORD,
        phoneCode: async () =>
        new Promise((resolve) =>
            rl.question("Please enter the code you received: ", resolve) 
        ),
        onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    console.log(client.session.save());  
    // -------------------------------------
    client.addEventHandler(async (event) => {
        const message = event.message;
        const incomingChatId = Number(message.peerId.chatId.value);
        const messageAuthorId = Number(message.fromId.userId.value);
        
        if (incomingChatId === chatWithGptId && authorizedUsers.includes(String(messageAuthorId))) {
            let session = getSession(messageAuthorId);
            if (event.message.media?.document?.mimeType === "audio/ogg") {
                try {
                    const file = await client.downloadMedia(event.message.media, {workers: 1});
                    let voiceOgg = path.resolve(__dirname, "voice", messageAuthorId + ".ogg");
                    fs.writeFile(voiceOgg, file, err => {
                        if (err) console.log(`Failed to retrieve voice file from message: ${err}`);
                    })
                    let voiceMp3 = await ogg.toMp3(voiceOgg, messageAuthorId);

                    const text = await openai.transcription(voiceMp3);

                    updateSession(messageAuthorId, {role: openai.roles.USER, content: text});

                    const response = await openai.chat(session.messages);

                    updateSession(messageAuthorId, {role: openai.roles.ASSISTANT, content: response?.content});
                
                    await sendGptResponse(client, chatWithGptId, response?.content);
                } catch (e) {
                    console.log(`Error processing audio file: ${e}`);
                    await sendGptResponse(client, chatWithGptId, "Error processing audio file, try again");
                }
            } else {
                try {
                    const text = message.message;
                    console.log(text);
                    updateSession(messageAuthorId, {role: openai.roles.USER, content: text});

                    const response = await openai.chat(session.messages);

                    updateSession(messageAuthorId, {role: openai.roles.ASSISTANT, content: response?.content});
                
                    await sendGptResponse(client, chatWithGptId, response?.content);
                } catch (e) {
                    console.log(`Error receiving response from chatGPT: ${e}`);
                    await sendGptResponse(client, chatWithGptId, "Error receiving response from chatGPT, try again");
                }
            }
        }
    }, new NewMessage({}))
};

telegramClient();



async function sendGptResponse(userBot, chatId, message) {
    try {
        await userBot.invoke(new Api.messages.SendMessage({
            peer: chatId,
            message: message
        }))
    } catch (e) {
        console.log(`Error sending response from chatGPT: ${e}`);
    }
}

function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, { messages: [] }); 
    }
    return sessions.get(userId);
}

function updateSession(userId, message) {
    const session = getSession(userId);
    if (session.messages.length >= 10) {
        session.messages.shift();
    }
    session.messages.push(message); 
    return session;
}
