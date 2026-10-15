// src/inngest/functions.ts
import { z } from "zod";
import { inngest } from "./client";
import { OpenRouter, tool } from "@openrouter/agent";

import { PROMPT } from "@/prompt";
import { getSandboxId } from "./utils";
import { Sandbox } from "@e2b/code-interpreter";

const openrouter = new OpenRouter({
  apiKey: process.env.OPEN_ROUTER_API,
});

function extractTaskSummary(text: string): string {
  const match = text.match(/<task_summary>\s*([\s\S]*?)\s*<\/task_summary>/);

  return match?.[1]?.trim() ?? text.trim();
}

export const generateAI = inngest.createFunction(
  { id: "summerize-content", triggers: { event: "api/summerize.content" } },
  async ({ event, step }) => {
    const userPrompt = event.data.prompt;

    if (typeof userPrompt !== "string" || !userPrompt.trim()) {
      throw new Error("User prompt is missing from the Inngest event.");
    }

    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(
        "jaynils-project/lovable-nextjs-jaynil-123-test",
      );

      await sandbox.commands.run(
        "npm run dev -- --hostname 0.0.0.0 --port 3000 > /tmp/app.log 2>&1 &",
      );

      return sandbox.sandboxId;
    });

    const updatedFiles: Record<string, string> = {};

    const terminalTool = tool({
      name: "terminal",
      description: "Execute terminal commands inside the E2B sandbox.",
      inputSchema: z.object({
        oncommand: z.string(),
      }),
      execute: async ({ oncommand }) => {
        try {
          const sandbox = await getSandboxId(sandboxId);
          const result = await sandbox.commands.run(oncommand);

          return JSON.stringify({
            stdout: result.stdout,
            stderr: result.stderr,
          });
        } catch (error) {
          return JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    const createOrUpdateFiles = tool({
      name: "createOrUpdateFile",
      description: "Create or update files in the E2B sandbox.",
      inputSchema: z.object({
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          }),
        ),
      }),
      execute: async ({ files }) => {
        try {
          const sandbox = await getSandboxId(sandboxId);

          for (const file of files) {
            await sandbox.files.write(file.path, file.content);
            updatedFiles[file.path] = file.content;
          }

          return JSON.stringify({
            success: true,
            message: `Successfully created or updated ${files.length} file(s).`,
            paths: files.map((file) => file.path),
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    const readFiles = tool({
      name: "readFiles",
      description: "Read files from the E2B sandbox.",
      inputSchema: z.object({
        files: z.array(z.string()),
      }),
      execute: async ({ files }) => {
        try {
          const sandbox = await getSandboxId(sandboxId);

          const contents: { path: string; content: string }[] = [];

          for (const file of files) {
            const content = await sandbox.files.read(file);
            contents.push({ path: file, content });
          }

          return JSON.stringify(contents);
        } catch (error) {
          return JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    const result = await step.run("generate-content", async () => {
      const response = await openrouter.callModel({
        model: "openrouter/free",
        input: `${PROMPT}\n\nUser request:\n${userPrompt}`,
        tools: [terminalTool, createOrUpdateFiles, readFiles],
      });

      console.log("Full response:", response);

      const text = await response.getText();
      console.log("Response text:", JSON.stringify(text));

      return text;
    });

    const summary = extractTaskSummary(result);

    const sandboxUrl = await step.run("get-sandboxUrl-id", async () => {
      const sandbox = await getSandboxId(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: updatedFiles,
      summary,
    };
  },
);
