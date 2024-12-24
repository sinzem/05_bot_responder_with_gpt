require('dotenv').config();
const fs = require("fs");
const OpenAI = require("openai");

class OpenAi {

    roles = {
        ASSISTANT: "assistant",
        USER: "user",
        SYSTEM: "system"
    }

    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
    }

    async chat(messages) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages
            })
            return response.data.choices[0].message;
        } catch (e) {
            console.log(`Error while gpt chat`, e.message);
        }
    }

    async transcription(filePath) {
        console.log(filePath);
        try {
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
            });
           
            return response.text;
        } catch (e) {
            console.log(`Error while transcription`, e.message);
        }
    }
}

module.exports = new OpenAi(process.env.OPENAI_KEY);

