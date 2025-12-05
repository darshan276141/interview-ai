// import { useEffect, useState } from "react";
// import VideoInterview from "../components/VideoInterview";
// import ChatSidebar from "../components/ChatSidebar";

// export default function Home() {
//   const [dialog, setDialog] = useState([]);
//   const [currentQuestion, setCurrentQuestion] = useState("");
//   const [role, setRole] = useState("frontend developer");
//   const [loadingQuestion, setLoadingQuestion] = useState(false);

//   useEffect(() => {
//     fetchNextQuestion(true);
//   }, []);

//   // Fetch next AI question
//   async function fetchNextQuestion(initial = false) {
//     setLoadingQuestion(true);
//     try {
//       const res = await fetch("/api/question", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           role,
//           history: dialog,
//           initial,
//         }),
//       });
//       const data = await res.json();
//       const q = data.question || "Tell me about yourself.";
//       setCurrentQuestion(q);

//       setDialog((d) => [...d, { type: "question", text: q }]);
//     } catch (err) {
//       console.error(err);
//       alert("Could not get question");
//     } finally {
//       setLoadingQuestion(false);
//     }
//   }

//   // Handle response from VideoInterview component
//   async function handleResponse({ transcription, aiResponse }) {
//     // Add user's answer
//     setDialog((d) => [
//       ...d,
//       { type: "answer", text: transcription, meta: "⏳ Evaluating..." },
//     ]);

//     try {
//       // Evaluate answer with Groq
//       const evalRes = await fetch("/api/evaluate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ answer: transcription }),
//       });

//       const ej = await evalRes.json();
//       // Update last dialog entry with human/AI %
//       setDialog((prev) => {
//         const newD = [...prev];
//         const lastIdx = newD.length - 1;
//         newD[lastIdx].meta = `Human: ${ej.humanPercent}% • AI: ${ej.aiPercent}%`;
//         return newD;
//       });

//       // Add AI response
//       setDialog((d) => [
//         ...d,
//         { type: "question", text: aiResponse },
//       ]);

//       setCurrentQuestion(aiResponse);
//     } catch (err) {
//       console.error("Evaluation failed:", err);
//       setDialog((prev) => {
//         const newD = [...prev];
//         const lastIdx = newD.length - 1;
//         newD[lastIdx].meta = "[Evaluation failed]";
//         return newD;
//       });
//     }
//   }

//   return (
//     <div className="app">
//       <div className="left">
//         <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
//           <div>
//             <label style={{ fontSize: 13, color: "#6b7280" }}>Role: </label>
//             <input
//               value={role}
//               onChange={(e) => setRole(e.target.value)}
//               style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", marginLeft: 8 }}
//             />
//           </div>
//           <button className="button small" onClick={() => fetchNextQuestion(true)} disabled={loadingQuestion}>
//             {loadingQuestion ? "..." : "Generate New Question"}
//           </button>
//         </div>

//         <VideoInterview
//           currentQuestion={currentQuestion}
//           onResponse={handleResponse}
//         />
//       </div>

//       <div className="right">
//         <ChatSidebar dialog={dialog} />
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import VideoInterview from "../components/VideoInterview";
import ChatSidebar from "../components/ChatSidebar";

export default function Home() {
  const [dialog, setDialog] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [role, setRole] = useState("frontend developer");
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  useEffect(() => {
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
          initial,
        }),
      });
      const data = await res.json();
      const q = data.question || "Tell me about yourself.";
      setCurrentQuestion(q);
      setDialog((d) => [...d, { type: "question", text: q }]);
    } catch (err) {
      console.error(err);
      alert("Could not get question");
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function handleResponse({ transcription, aiResponse }) {
    // Add user's answer
    setDialog((d) => [
      ...d,
      { type: "answer", text: transcription, meta: "⏳ Evaluating..." },
    ]);

    try {
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: transcription }),
      });
      const ej = await evalRes.json();

      // Update last dialog entry with human/AI %
      setDialog((prev) => {
        const newD = [...prev];
        const lastIdx = newD.length - 1;
        newD[lastIdx].meta = `Human: ${ej.humanPercent}% • AI: ${ej.aiPercent}%`;
        return newD;
      });

      // Add AI follow-up
      setDialog((d) => [...d, { type: "question", text: aiResponse }]);
      setCurrentQuestion(aiResponse);
    } catch (err) {
      console.error("Evaluation failed:", err);
      setDialog((prev) => {
        const newD = [...prev];
        const lastIdx = newD.length - 1;
        newD[lastIdx].meta = "[Evaluation failed]";
        return newD;
      });
    }
  }

  return (
    <div className="app-container">
      <div className="left-panel">
        <VideoInterview currentQuestion={currentQuestion} onResponse={handleResponse} />
      </div>

      <div className="right-panel">
        <ChatSidebar dialog={dialog} />
      </div>

      <style jsx>{`
        .app-container {
          display: flex;
          height: 100vh;
          width: 100%;
          gap: 0;
          overflow: hidden;
        }

        .left-panel {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
          min-width: 300px;
        }

        .right-panel {
          flex: 1;
          border-left: 1px solid #ddd;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 10px;
          min-width: 300px;
        }

        @media (max-width: 800px) {
          .app-container {
            flex-direction: column;
          }
          .left-panel,
          .right-panel {
            flex: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
