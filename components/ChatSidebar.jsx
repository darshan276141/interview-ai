// components/ChatSidebar.jsx
export default function ChatSidebar({ dialog }) {
  return (
    <div className="chat">
      <h3 style={{ margin: 0 }}>Dialog</h3>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
        Questions & answers (transcribed). AI/human % shown after each answer.
      </div>
      {dialog.map((d, i) => (
        <div key={i} className={`chat-item ${d.type === "question" ? "question" : "answer"}`}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.type === "question" ? "Q:" : "A:"}</div>
          <div>{d.text}</div>
          {d.meta ? <div className="meta">{d.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}
