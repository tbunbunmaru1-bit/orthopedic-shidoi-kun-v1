import Anthropic from "@anthropic-ai/sdk";
import { getMaterialPrompt } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { surgeryName } = await request.json();

  if (!surgeryName) {
    return new Response(JSON.stringify({ error: "手術名を入力してください" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 8000,
          thinking: { type: "adaptive" },
          messages: [
            {
              role: "user",
              content: getMaterialPrompt(surgeryName),
            },
          ],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
