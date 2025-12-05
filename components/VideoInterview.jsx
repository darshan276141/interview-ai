import { useEffect, useRef, useState } from "react";

export default function VideoInterview({ currentQuestion, onResponse }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Media error:", err);
        alert("Please allow access to camera and microphone.");
      }
    }

    init();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const getMimeType = () => {
    const types = ["video/webm; codecs=vp9,opus", "video/webm; codecs=vp8,opus", "video/webm"];
    for (const t of types) if (MediaRecorder.isTypeSupported(t)) return t;
    return "";
  };

  function startRecording() {
    if (!stream) return;
    setIsRecording(true);
    chunksRef.current = [];

    const mimeType = getMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start();
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
      await uploadVideo(videoBlob);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  async function uploadVideo(blob) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("video", blob, "recording.webm");

      const res = await fetch("/api/video-interview", {
        method: "POST",
        body: form,
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error("Invalid server response:", raw);
        alert("Server returned invalid response.");
        setLoading(false);
        return;
      }

      console.log("FRONTEND RECEIVED:", data);
      setLoading(false);

      if (data.error) {
        alert("Transcription failed.");
        return;
      }

      // Pass transcription and AI response back to parent
      onResponse({
        transcription: data.transcription,
        aiResponse: data.aiResponse
      });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      alert("Upload failed");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  style={{
    width: "80%",
    maxWidth: "100%",
    aspectRatio: "1/1", // makes it square
    borderRadius: 8,
    background: "#000",
    objectFit: "cover",
  }}
/>


      <div style={{ marginTop: 12 }}>
        <strong>AI Interviewer:</strong>
        <div style={{ fontSize: 14, color: "#777" }}>
          {currentQuestion || "Press Start to begin"}
        </div>
      </div>

      {loading && <p>Processing… please wait</p>}

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        {!isRecording ? (
          <button onClick={startRecording}>🎙 Start</button>
        ) : (
          <button onClick={stopRecording}>⏹ Stop & Submit</button>
        )}
      </div>
    </div>
  );
}
