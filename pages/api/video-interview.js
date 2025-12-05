import fs from "fs";
import path from "path";
import multer from "multer";
import Groq from "groq-sdk";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

export const config = {
  api: { bodyParser: false },
};

const upload = multer({ dest: "uploads/" });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      resolve(result);
    });
  });
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// -----------------------------
// Convert WebM → WAV
// -----------------------------
function extractAudio(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath + ".wav";

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("pcm_s16le")
      .format("wav")
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err));
  });
}

// -----------------------------
// Transcribe WAV audio
// -----------------------------
async function transcribeAudio(filePath) {
  try {
    const resp = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
    });

    return resp.text;
  } catch (err) {
    console.error("Groq Transcription Error:", err);
    throw new Error("Failed to transcribe audio");
  }
}

// -----------------------------
// Generate follow-up AI response
// -----------------------------
async function generateAIResponse(text) {
  const resp = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a professional AI interviewer. Reply concisely." },
      { role: "user", content: text },
    ],
  });

  return resp.choices[0].message.content;
}

// -----------------------------
// MAIN API HANDLER
// -----------------------------
export default async function handler(req, res) {
  try {
    await runMiddleware(req, res, upload.single("video"));

    const videoFile = req.file;
    if (!videoFile) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    console.log("Uploaded:", videoFile);

    // Convert video → WAV audio
    const audioPath = await extractAudio(videoFile.path);
    console.log("Converted to audio:", audioPath);

    // Transcribe
    const transcription = await transcribeAudio(audioPath);
    console.log("Transcription:", transcription);

    // Get AI response
    const aiResponse = await generateAIResponse(transcription);

    return res.status(200).json({
      transcription,
      aiResponse,
    });

  } catch (err) {
    console.error("Video Interview Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
