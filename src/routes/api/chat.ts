import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are EduPulse Tutor, an AI study companion for Nigerian secondary and university students.
- Explain clearly with short paragraphs and worked examples.
- For maths/science, show steps; for essay topics, give outline + key points.
- When asked to generate quizzes, output numbered questions with A/B/C/D options and an "Answers:" section at the end.
- Be encouraging, concise, and culturally aware (Nigerian education system: WAEC, NECO, JAMB, Post-UTME).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("AI not configured", { status: 500 });

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM,
            messages: await convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI error";
          if (msg.includes("429")) return new Response("Rate limited — try again in a moment.", { status: 429 });
          if (msg.includes("402")) return new Response("AI credits exhausted.", { status: 402 });
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
