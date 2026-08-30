import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const posix = path.posix;

/** Normalize a Linux path string without Windows path.resolve side effects. */
export function posixNormalize(inputPath) {
  let p = String(inputPath || ".").replace(/\\/g, "/");
  if (!p.startsWith("/")) {
    // Relative: keep as-is for classification; callers usually pass abs/cwd.
    p = posix.normalize(p);
  } else {
    p = posix.normalize(p);
  }
  return p;
}

export function classifyMountPath(inputPath) {
  const p = posixNormalize(inputPath);
  const m = p.match(/^\/mnt\/([a-zA-Z])(\/|$)/);
  if (m) {
    return {
      path: p,
      underDrvFs: true,
      drive: m[1].toLowerCase(),
      mount: `/mnt/${m[1].toLowerCase()}`,
    };
  }
  return { path: p, underDrvFs: false, drive: null, mount: null };
}

export function sampleCrlfFiles(root, {
  scanLimit = 50,
  readdir = readdirSync,
  readFile = readFileSync,
  stat = statSync,
} = {}) {
  const limit = Math.max(1, Number(scanLimit) || 50);
  const crlf = [];
  const scanned = [];
  const queue = [posixNormalize(root)];
  while (queue.length && scanned.length < limit) {
    const dir = queue.shift();
    let entries = [];
    try {
      entries = readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (scanned.length >= limit) break;
      const full = posix.join(dir, ent.name);
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      try {
        if (ent.isDirectory()) {
          queue.push(full);
          continue;
        }
        if (!ent.isFile()) continue;
        const st = stat(full);
        if (st.size > 256 * 1024) continue;
        scanned.push(full);
        const buf = readFile(full);
        if (buf.includes(0x0d) && buf.includes(0x0a)) {
          crlf.push(full);
        }
      } catch {
        /* skip */
      }
    }
  }
  return { scanned: scanned.length, crlfCount: crlf.length, crlfSamples: crlf.slice(0, 10) };
}

export function buildMntAdvice(report) {
  const tips = [];
  if (report.underDrvFs) {
    tips.push(`Path is under ${report.mount} (9p/DrvFs) — expect slower I/O and Windows CRLF line endings.`);
    tips.push("Advise: move the workspace to a Linux path such as ~/projects/... (ext4) for Node/git performance.");
    if (report.crlfCount > 0) {
      tips.push(`Sampled ${report.crlfCount} file(s) with CRLF (of ${report.scanned} scanned, cap ${report.scanLimit}).`);
    } else {
      tips.push(`No CRLF found in sample (${report.scanned} files, cap ${report.scanLimit}).`);
    }
  } else {
    tips.push("Path is not under /mnt/<drive> — good for Linux-native tooling.");
  }
  return tips;
}

export function formatMntReport(report) {
  const lines = ["mnt_doctor", `path: ${report.path}`];
  lines.push(`under_mnt: ${Boolean(report.underDrvFs)}`);
  if (report.mount) lines.push(`mount: ${report.mount}`);
  if (report.scanned != null) lines.push(`scanned: ${report.scanned} crlf: ${report.crlfCount}`);
  for (const tip of report.advice || []) lines.push(`- ${tip}`);
  return lines.join("\n");
}
