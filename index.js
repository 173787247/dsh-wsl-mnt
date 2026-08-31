import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/mnt.js";

export const name = "dsh-wsl-mnt";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:mnt_doctor",
    order: 117,
    text: "Use mnt_doctor for WSL/Windows interop: Warn when the workspace lives on slow /mnt/c and suggest a Linux home path.",
  });

  ctx.tools.register({
    name: "mnt_doctor",
    description: "Warn when the workspace lives on slow /mnt/c and suggest a Linux home path.",
    parameters: core.parameters(config),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.execute(args, config);
    },
    presentCall: () => ({ card: "generic", title: "mnt_doctor" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "mnt_doctor failed", content: result.content }
        : { card: "generic", title: "mnt_doctor", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
