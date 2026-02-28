import Anthropic from "@anthropic-ai/sdk";
import { getSlidePrompt } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { surgeryName, content } = await request.json();

  if (!surgeryName || !content) {
    return new Response(JSON.stringify({ error: "必要なデータがありません" }), {
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
              content: getSlidePrompt(surgeryName, content),
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
