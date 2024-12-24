const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const installer = require("@ffmpeg-installer/ffmpeg");

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    toMp3(input, output) {
        try {
            const outputPath = path.resolve(__dirname, "voice", `${output}.mp3`);
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOption("-t 30")
                    .output(outputPath)
                    .on("end", () => {
                        fs.rm(input, err => console.log(`Error deleting ogg file: ${err}`));
                        resolve(outputPath);
                    })
                    .on("error", (err) => reject(err.message))
                    .run()
            })
        } catch (e) {
            console.log(`Error while creating ogg`, e.message);
        }
    }
}

module.exports = new OggConverter();