import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateAI, processTask } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask, generateAI],
});
