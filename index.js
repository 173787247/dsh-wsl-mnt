import { detectWsl } from "./lib/wsl-host.js";
import {
  buildMntAdvice,
  classifyMountPath,
  formatMntReport,
  sampleCrlfFiles,
} from "./lib/mnt.js";

export const name = "dsh-wsl-mnt";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const scanLimit = positive(config.scanLimit, 50);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:mnt_doctor",
    order: 125,
    text: [
      "Use mnt_doctor when builds or git feel slow, or when CRLF/LF issues appear.",
      "It checks whether the path/cwd lives under /mnt/c (DrvFs) and samples files for CRLF.",
      "Advise moving the workspace to ~/... on the Linux filesystem.",
    ].join(" "),
  });

  ctx.tools.register({
    name: "mnt_doctor",
    description:
      "Check if a path/cwd is under /mnt/<drive> (slow + CRLF); sample CRLF files and advise moving to ~/...",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        path: {
          type: "string",
          description: "Linux path to inspect (default process.cwd()).",
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          wsl: { type: "boolean" },
          path: { type: "string" },
          underDrvFs: { type: "boolean" },
          drive: { type: "string" },
          mount: { type: "string" },
          scanned: { type: "integer" },
          crlfCount: { type: "integer" },
          crlfSamples: { type: "array", items: { type: "string" } },
          scanLimit: { type: "integer" },
          advice: { type: "array", items: { type: "string" } },
          error: { type: "string" },
        },
      },
      render: (_args, value) => [{ type: "text", text: formatMntReport(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) {
        return { wsl: false, error: "not running in WSL", advice: [] };
      }
      const raw = typeof args?.path === "string" && args.path.trim()
        ? args.path.trim()
        : process.cwd().replace(/\\/g, "/");
      const classified = classifyMountPath(raw);
      let sample = { scanned: 0, crlfCount: 0, crlfSamples: [] };
      if (classified.underDrvFs) {
        sample = sampleCrlfFiles(classified.path, { scanLimit });
      }
      const report = {
        wsl: true,
        ...classified,
        ...sample,
        scanLimit,
      };
      report.advice = buildMntAdvice(report);
      return report;
    },
    presentCall: () => ({ card: "generic", title: "mnt doctor" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "mnt doctor failed", content: result.content }
        : { card: "generic", title: "mnt doctor", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
