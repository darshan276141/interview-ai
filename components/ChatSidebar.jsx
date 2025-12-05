// components/ChatSidebar.jsx
export default function ChatSidebar({ dialog }) {
  return (
    <div style={{ padding: 20, overflowY: "auto", maxHeight: "80vh" }}>
      {dialog.map((d, idx) => {
        const isUser = d.type === "answer";
        const isAI = d.type === "ai" || d.type === "question"; // AI includes questions and AI response
        return (
          <div
            key={idx}
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 6,
              backgroundColor: isUser ? "#DCF8C6" : "#F1F0F0",
              textAlign: isUser ? "right" : "left",
            }}
          >
            <div>{d.text}</div>
            {d.meta && <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{d.meta}</div>}
          </div>
        );
      })}
    </div>
  );
}
