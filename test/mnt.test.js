import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMntAdvice, classifyMntPath, format } from "../lib/mnt.js";

describe("classifyMntPath", () => {
  it("flags /mnt/c Desktop and suggests home", () => {
    const info = classifyMntPath("/mnt/c/Users/rchua/Desktop/AIFullStackDevelopment", {
      home: "/home/rchua",
      exists: (p) => p.endsWith("/.git"),
    });
    assert.equal(info.onMnt, true);
    assert.equal(info.drive, "c");
    assert.equal(info.kind, "windows_user_folder");
    assert.equal(info.hasGit, true);
    assert.match(info.suggestedHome, /\/home\/rchua\/src\/AIFullStackDevelopment/);
  });

  it("accepts linux home", () => {
    const info = classifyMntPath("/home/rchua/proj", {
      home: "/home/rchua",
      exists: () => false,
    });
    assert.equal(info.onMnt, false);
    assert.equal(info.kind, "linux_home");
  });
});

describe("buildMntAdvice", () => {
  it("warns about git on mnt", () => {
    const tips = buildMntAdvice({
      onMnt: true,
      drive: "c",
      kind: "windows_users",
      hasGit: true,
      suggestedHome: "/home/rchua/src/x",
    });
    assert.ok(tips.some((t) => /\.git on \/mnt/i.test(t)));
    assert.ok(tips.some((t) => /CRLF/i.test(t)));
  });
});

describe("format", () => {
  it("includes kind", () => {
    assert.match(
      format({ ok: false, onMnt: true, path: "/mnt/c/x", kind: "mnt_other", advice: ["tip"] }),
      /kind: mnt_other/,
    );
  });
});
