import { Sandbox } from "@e2b/code-interpreter";

export async function getSandboxId(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}
