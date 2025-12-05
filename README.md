# Interview AI (MVP)

## What it does
- Local webcam + mic for candidate
- AI interviewer asks questions (server uses OpenAI)
- Candidate replies by voice; audio sent to server and transcribed using Whisper
- Sidebar shows dialog (question + transcribed answer)
- Server returns an "AI vs Human" percentage evaluation for each answer

## Setup
1. Copy files
2. `npm install`
3. Create `.env.local` from `.env.local.example`
4. Set `OPENAI_API_KEY`
5. `npm run dev` and open http://localhost:3000

## Notes
- This is an MVP. For production: add auth, persistent DB, error handling, input validation, rate-limiting.
