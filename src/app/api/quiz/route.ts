import { GoogleGenerativeAI } from "@google/generative-ai";
import { getQuizPrompt } from "@/lib/prompts";
import { QuizQuestion } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const { surgeryName, content } = await request.json();

  if (!surgeryName || !content) {
    return new Response(JSON.stringify({ error: "必要なデータがありません" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(getQuizPrompt(surgeryName, content));
    const rawText = result.response.text();

    let questions: QuizQuestion[] = [];
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
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
