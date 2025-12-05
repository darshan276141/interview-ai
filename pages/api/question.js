import Groq from "groq-sdk";

export default async function handler(req, res) {
  try {
    const { role, history = [] } = req.body;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Fix: Ensure history elements have "role" + "content"
    const safeHistory = history
      .filter(m => m && m.content)
      .map(m => ({
        role: m.role || "user",
        content: m.content.toString(),
      }));

    const messages = [
      {
        role: "system",
        content: "You are an AI interview bot. Ask one interview question at a time."
      },
      ...safeHistory,
      {
        role: "user",
        content: `Generate the next interview question for role: ${role}. Keep it ONE question.`
      }
    ];

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages,
      max_tokens: 120,
    });

    const question = completion.choices[0].message.content;

    res.status(200).json({ question });

  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ error: "Groq API Failed" });
  }
}
