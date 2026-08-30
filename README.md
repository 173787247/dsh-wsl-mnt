# dsh-wsl-mnt

DeepSeek Harness tool: **`mnt_doctor`** — detect /mnt/c workspaces (slow I/O + CRLF) and advise moving to Linux home.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

---

## Why

Projects living under `/mnt/c` use DrvFs/9p: slower Node/git I/O and frequent CRLF surprises. This tool classifies the path and samples up to `scanLimit` files for CRLF, then advises moving to `~/...`.

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-mnt
```

Restart `dsh web`. New session → Tools should list `mnt_doctor`.

## Config

```yaml
- id: dsh-wsl-mnt
  name: dsh-wsl-mnt
  config:
    timeoutMs: 15000
    scanLimit: 50
```

| Key | Default | Meaning |
|-----|---------|---------|
| `timeoutMs` | `15000` | Tool timeout |
| `scanLimit` | `50` | Max files to scan for CRLF |

## Test

```sh
npm test
```

## License

MIT
