// src/inngest/functions.ts
import { inngest } from "./client";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPEN_ROUTER_API,
});

export const processTask = inngest.createFunction(
  { id: "process-task", triggers: { event: "app/task.created" } },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("wait-a--moment", "5s");

    return { message: `Task ${event.data.value} complete`, result };
  },
);

export const generateAI = inngest.createFunction(
  { id: "summerize-content", triggers: { event: "api/summerize.content" } },
  async ({ event, step }) => {
    const result = await step.run("generate-content", async () => {
      const response = await openrouter.chat.send({
        chatRequest: {
          model: "openrouter/free",
          messages: [
            {
              role: "user",
              content: event.data.prompt,
            },
          ],
          stream: false,
        },
      });

      return response.choices[0]?.message?.content ?? "";
    });

    return { result };
  },
);
