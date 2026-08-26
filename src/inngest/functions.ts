// src/inngest/functions.ts
import { inngest } from "./client";

export const processTask = inngest.createFunction(
  { id: "process-task", triggers: { event: "app/task.created" } },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("wait-a--moment", "30s");

    await step.sleep("wait-a--moment", "10s");

    await step.sleep("wait-a--moment", "5s");

    return { message: `Task ${event.data.id} complete`, result };
  },
);
