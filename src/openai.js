import OpenAI from "openai";
import config from "config";
import fs from "fs";

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
            // const response = await this.openai.createTranscription(
            //     createReadStream(filePath),
            //     "whisper-1"
            // );
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
            });
            // console.log(response);
            return response.text;
        } catch (e) {
            console.log(`Error while transcription`, e.message);
        }
    }
}

export const openai = new OpenAi(config.get("OPENAI_KEY"));

