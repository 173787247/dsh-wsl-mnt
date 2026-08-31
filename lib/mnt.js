import { resolve } from "node:path";
import { homedir } from "node:os";

export function notWsl() {
  return { ok: false, error: "not running in WSL" };
}

export function parameters() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string", description: "Workspace path to check (default: process.cwd())." },
    },
  };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`mnt_doctor ok=${v.ok} onMnt=${v.onMnt} path=${v.path}`];
  for (const a of v.advice || []) lines.push(`- ${a}`);
  return lines.join("\n");
}

export async function execute(args) {
  const raw = typeof args?.path === "string" && args.path.trim() ? args.path.trim() : process.cwd();
  const abs = raw.startsWith("~/") ? `${homedir()}${raw.slice(1)}` : resolve(raw);
  const onMnt = abs === "/mnt" || abs.startsWith("/mnt/");
  const advice = onMnt
    ? [
        "This path is under /mnt — I/O and git are slower; prefer cloning under /home/…",
        "CRLF and executable bits on /mnt/c often surprise Linux tools.",
      ]
    : ["Path is outside /mnt — good default for day-to-day DSH work."];
  return { ok: !onMnt, path: abs, onMnt, advice };
}
