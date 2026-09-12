# dsh-wsl-mnt

> **套件安装：** 见 [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)。

工具 **`mnt_doctor`**：判断工作区是否在慢速 `/mnt/c`（Desktop/Downloads、是否有 `.git`），并建议 `~/src/…`。

[English → README.md](./README.md)

## 兼容性

| 项 | 值 |
|----|----|
| **插件** | `dsh-wsl-mnt` **0.2.0** |
| **最低 dsh** | ≥ **0.1.2**（Windows 中继 `:3081` 一次性 `?token=`） |
| **最新验证** | 以 [dsh-wsl-kit 兼容性](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) 为准（当前 **`0.1.5-rc.1`**）— 套件唯一真源 |
| **套件档位** | `full` 或单独安装 |
| **云端 Flash** | settings / `llm-deepseek` 使用 **`deepseek-flash`**（V4.1 Flash）；本插件不配置模型 id |
| **Agent Teams** | 上游实验包；本插件不依赖 |

套件版本地板：[`check-plugin-versions.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/check-plugin-versions.sh)。故障树：[TROUBLESHOOTING.zh.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.zh.md)。

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-mnt
npm test
```

MIT
