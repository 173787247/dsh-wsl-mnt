import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { homedir } from "node:os";

export function notWsl() {
  return { ok: false, error: "not running in WSL", onMnt: false, path: "", advice: [] };
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
  if (v.drive) lines.push(`drive: ${v.drive}`);
  if (v.kind) lines.push(`kind: ${v.kind}`);
  if (v.hasGit != null) lines.push(`hasGit: ${v.hasGit}`);
  if (v.suggestedHome) lines.push(`suggestedHome: ${v.suggestedHome}`);
  for (const a of v.advice || []) lines.push(`- ${a}`);
  return lines.join("\n");
}

/** Classify an absolute Linux path for WSL /mnt hygiene. */
export function classifyMntPath(abs, { home = homedir(), exists = existsSync } = {}) {
  const path = String(abs || "");
  const onMnt = path === "/mnt" || path.startsWith("/mnt/");
  const driveMatch = path.match(/^\/mnt\/([a-zA-Z])(?:\/|$)/);
  const drive = driveMatch ? driveMatch[1].toLowerCase() : "";
  let kind = "linux_home";
  if (onMnt) {
    if (/\/(Desktop|Downloads|Documents)(\/|$)/i.test(path)) kind = "windows_user_folder";
    else if (path.includes("/Users/")) kind = "windows_users";
    else kind = "mnt_other";
  } else if (path === home || path.startsWith(`${home}/`)) {
    kind = "linux_home";
  } else {
    kind = "linux_other";
  }
  const gitPath = path.endsWith("/") ? `${path}.git` : `${path}/.git`;
  const hasGit = exists(gitPath);
  let suggestedHome = "";
  if (onMnt) {
    const leaf = basename(path) || "project";
    suggestedHome = `${home.replace(/\/+$/, "")}/src/${leaf}`;
  }
  return { path, onMnt, drive, kind, hasGit, suggestedHome };
}

export function buildMntAdvice(info) {
  const tips = [];
  if (!info.onMnt) {
    tips.push("Path is outside /mnt — good default for day-to-day DSH / git / npm work.");
    if (info.hasGit) tips.push("Git repo on a Linux filesystem — prefer this over /mnt/c clones.");
    return tips;
  }

  tips.push(
    "This path is under /mnt — 9p I/O is much slower than ext4 under /home; git status, npm install, and node_modules suffer.",
  );
  if (info.drive === "c") {
    tips.push("Especially avoid long-lived repos on /mnt/c (NTFS + metadata). Clone or worktree under ~/… instead.");
  }
  if (info.kind === "windows_user_folder") {
    tips.push(
      "Desktop/Downloads/Documents on /mnt/c are fine for opening Office files, but not as the agent workspace root.",
    );
  }
  if (info.hasGit) {
    tips.push(
      "Detected .git on /mnt — expect slow status and permission/executable-bit quirks. Move the clone to Linux home when possible.",
    );
  }
  tips.push("CRLF line endings on /mnt/c often break bash scripts (set: pipefail invalid option) — run encoding_doctor or dos2unix.");
  if (info.suggestedHome) {
    tips.push(`Suggested Linux path: ${info.suggestedHome} (mkdir -p && git clone / rsync there).`);
  }
  tips.push("Pair with path_convert / dsh-wsl-open when you only need to open a Windows file from chat.");
  return tips;
}

export async function execute(args, _config = {}, deps = {}) {
  const home = deps.home || homedir();
  const exists = deps.exists || existsSync;
  const raw = typeof args?.path === "string" && args.path.trim() ? args.path.trim() : process.cwd();
  const abs = raw.startsWith("~/")
    ? `${home}${raw.slice(1)}`
    : raw === "~"
      ? home
      : resolve(raw);
  const info = classifyMntPath(abs, { home, exists });
  const advice = buildMntAdvice(info);
  return {
    ok: !info.onMnt,
    path: info.path,
    onMnt: info.onMnt,
    drive: info.drive || "",
    kind: info.kind,
    hasGit: info.hasGit,
    suggestedHome: info.suggestedHome || "",
    advice,
  };
}
