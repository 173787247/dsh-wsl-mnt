import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMntAdvice,
  classifyMountPath,
  formatMntReport,
  sampleCrlfFiles,
} from "../lib/mnt.js";

describe("mnt_doctor", () => {
  it("detects /mnt/c", () => {
    const c = classifyMountPath("/mnt/c/Users/a/proj");
    assert.equal(c.underDrvFs, true);
    assert.equal(c.drive, "c");
    assert.equal(c.mount, "/mnt/c");
  });

  it("treats linux home as non-drvfs", () => {
    assert.equal(classifyMountPath("/home/u/proj").underDrvFs, false);
  });

  it("samples CRLF with injected fs", () => {
    const files = new Map([
      ["/mnt/c/p/a.txt", Buffer.from("a\r\nb\n")],
      ["/mnt/c/p/b.txt", Buffer.from("ok\n")],
    ]);
    const r = sampleCrlfFiles("/mnt/c/p", {
      scanLimit: 50,
      readdir: (dir) => {
        if (dir === "/mnt/c/p") {
          return ["a.txt", "b.txt"].map((name) => ({
            name,
            isDirectory: () => false,
            isFile: () => true,
          }));
        }
        return [];
      },
      readFile: (p) => files.get(p),
      stat: () => ({ size: 10 }),
    });
    assert.equal(r.scanned, 2);
    assert.equal(r.crlfCount, 1);
  });

  it("advises ~/ move", () => {
    const advice = buildMntAdvice({
      underDrvFs: true,
      mount: "/mnt/c",
      scanned: 2,
      crlfCount: 1,
      scanLimit: 50,
    });
    assert.ok(advice.some((t) => /~\/projects/i.test(t) || /Linux path/i.test(t)));
  });

  it("formats", () => {
    assert.match(formatMntReport({ path: "/mnt/c/x", underDrvFs: true, mount: "/mnt/c", scanned: 1, crlfCount: 0, advice: [] }), /under_mnt: true/);
  });
});
