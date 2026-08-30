# 

DeepSeek Harness 工具：**${tool}** — 

DeepSeek Harness 工具：**`mnt_doctor`** — 检测 /mnt/c 工作区（慢 I/O + CRLF）并建议迁到 Linux home。

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

---

## 为什么需要

工作区若在 `/mnt/c`（DrvFs/9p），Node/git 更慢且常遇 CRLF。本工具判断路径并抽样最多 `scanLimit` 个文件检测 CRLF，建议迁到 `~/...`。

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-mnt
```

重启 `dsh web`。新会话 → Tools 应出现 `mnt_doctor`。

## 配置

```yaml
- id: dsh-wsl-mnt
  name: dsh-wsl-mnt
  config:
        timeoutMs: 15000
        scanLimit: 50
```

| 键 | 默认 | 含义 |
|----|------|------|
| `timeoutMs` | `15000` | 工具超时 |
| `scanLimit` | `50` | CRLF 扫描文件数上限 |

## 测试

```sh
npm test
```

## 许可

MIT
