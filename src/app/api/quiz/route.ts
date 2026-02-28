import Anthropic from "@anthropic-ai/sdk";
import { getQuizPrompt } from "@/lib/prompts";
import { QuizQuestion } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { surgeryName, content } = await request.json();

  if (!surgeryName || !content) {
    return new Response(JSON.stringify({ error: "必要なデータがありません" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: getQuizPrompt(surgeryName, content),
        },
      ],
    });

    const finalMessage = await stream.finalMessage();
    const textBlock = finalMessage.content.find((b) => b.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";

    let questions: QuizQuestion[] = [];
    try {
      const parsed = JSON.parse(rawText);
      questions = parsed.questions;
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions;
      }
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return new Response(JSON.stringify({ error: "クイズ生成に失敗しました" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
