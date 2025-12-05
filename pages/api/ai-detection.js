import Groq from "groq-sdk";

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
You are an AI text analyzer.

Analyze the following answer and estimate:
- How likely it is AI-generated (0-100)
- How likely it is human-generated (0-100)

Return ONLY a JSON object:
{ "ai": number, "human": number }

Answer to analyze:
${text}
`;

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    const result = completion.choices[0].message.content;

    const parsed = JSON.parse(result);

    res.status(200).json(parsed);
  } catch (error) {
    console.log("AI Detection Error", error);
    res.status(500).json({ error: "AI detection failed" });
  }
}
