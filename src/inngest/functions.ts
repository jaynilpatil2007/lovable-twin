// src/inngest/functions.ts
import { inngest } from "./client";
import { OpenRouter } from "@openrouter/sdk";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandboxId } from "./utils";

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
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(
        "jaynils-project/lovable-nextjs-jaynil-123-test",
      );

      await sandbox.commands.run(
        "npm run dev -- --hostname 0.0.0.0 --port 3000 > /tmp/app.log 2>&1 &",
      );

      return sandbox.sandboxId;
    });

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

    const sandboxUrl = await step.run("get-sandboxUrl-id", async () => {
      const sandbox = await getSandboxId(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { result, sandboxUrl };
  },
);
