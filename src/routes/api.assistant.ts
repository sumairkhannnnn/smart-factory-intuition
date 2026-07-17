import type { APIEvent } from "@tanstack/react-start/server";
import { buildGeminiPrompt } from "@/lib/ai-service";

export async function POST({ request }: APIEvent) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const question = typeof body?.question === "string" ? body.question : "";
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!question.trim()) {
      return Response.json({ error: "A question is required." }, { status: 400 });
    }

    const prompt = buildGeminiPrompt(question, history);
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      return Response.json(
        { error: data?.error?.message || "Gemini request failed." },
        { status: 502 },
      );
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I could not generate a response.";
    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Assistant request failed." },
      { status: 500 },
    );
  }
}
