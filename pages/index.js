// pages/index.js
import { useEffect, useState } from "react";
import VideoInterview from "../components/VideoInterview";
import ChatSidebar from "../components/ChatSidebar";

export default function Home() {
  const [dialog, setDialog] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [role, setRole] = useState("frontend developer");
  const [isRecording, setIsRecording] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  useEffect(() => {
    // on load, fetch initial question
    fetchNextQuestion(true);
  }, []);

  async function fetchNextQuestion(initial = false) {
    setLoadingQuestion(true);
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          history: dialog,
          initial: initial,
        }),
      });
      const data = await res.json();
      const q = data.question || "Tell me about yourself.";
      setCurrentQuestion(q);

      // add question to dialog
      setDialog((d) => [...d, { type: "question", text: q }]);
    } catch (err) {
      console.error(err);
      alert("Could not get question");
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function onSendAudioBlob(blob) {
    // show temporary "transcribing..." in UI
    setDialog((d) => [...d, { type: "answer", text: "⏳ Transcribing audio..." }]);
    try {
      const form = new FormData();
      form.append("file", blob, "answer.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      const j = await res.json();
      const text = j.text || "";

      // remove last placeholder and append real answer
      setDialog((prev) => {
        const newD = prev.slice(0, prev.length - 1);
        newD.push({ type: "answer", text });
        return newD;
      });

      // Evaluate answer
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: text }),
      });
      const ej = await evalRes.json();

      // attach meta to last dialog item
      setDialog((prev) => {
        const newD = [...prev];
        const lastIdx = newD.length - 1;
        newD[lastIdx].meta = `Human: ${ej.humanPercent}%  •  AI: ${ej.aiPercent}%`;
        return newD;
      });

    } catch (err) {
      console.error(err);
      alert("Transcription failed");
      setDialog((prev) => {
        const newD = prev.slice(0, prev.length - 1);
        newD.push({ type: "answer", text: "[Transcription failed]" });
        return newD;
      });
    }
  }

  return (
    <div className="app">
      <div className="left">
        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 13, color: "#6b7280" }}>Role: </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", marginLeft: 8 }}
            />
          </div>
          <button className="button small" onClick={() => fetchNextQuestion(true)} disabled={loadingQuestion}>
            {loadingQuestion ? "..." : "Generate New Question"}
          </button>
        </div>

        <VideoInterview
          currentQuestion={currentQuestion}
          onResponse={async (data) => {
            try {
              // Add user's answer
              setDialog((prev) => [...prev, { type: "answer", text: data.transcription }]);

              // Evaluate answer using your evaluate API
              const evalRes = await fetch("/api/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answer: data.transcription }),
              });
              const evalData = await evalRes.json();

              // Add AI response + scores
              setDialog((prev) => [
                ...prev,
                {
                  type: "ai",
                  text: data.aiResponse,
                  meta: `Human: ${evalData.humanPercent}% • AI: ${evalData.aiPercent}%`,
                },
              ]);

              // Only fetch next question **after evaluation is complete**
              await fetchNextQuestion(false);
            } catch (err) {
              console.error("Error processing response:", err);
            }
          }}
        />


      </div>

      <div className="right">
        <ChatSidebar dialog={dialog} />
      </div>
    </div>
  );
}
