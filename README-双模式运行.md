# GitHub MCP Server 双模式运行指南

## 🚀 两种运行方式

### 1. 本地运行 (推荐)
- **优势**: 无延迟、完全控制、更安全
- **适用**: 开发、调试、自定义功能
- **启动**: `./start-github-mcp.sh` 选择选项 1

### 2. GitHub 链接 (官方)
- **优势**: 官方维护、跨平台、一键部署
- **适用**: 生产环境、标准部署
- **启动**: `./start-github-mcp.sh` 选择选项 2

## 📋 配置说明

### VS Code 配置 (.vscode/mcp.json)
```json
{
  "servers": {
    "github-local": {
      "command": "./github-mcp-server",
      "args": ["stdio"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    },
    "github-docker": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

## 🔧 使用方法

### 快速启动
```bash
./start-github-mcp.sh
```

### 手动启动

#### 本地运行
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token"
./github-mcp-server stdio
```

#### Docker 运行
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token"
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" ghcr.io/github/github-mcp-server
```

## 🎯 选择建议

- **开发阶段**: 使用本地运行，便于调试和修改
- **生产环境**: 使用 GitHub 链接，稳定可靠
- **测试阶段**: 两种方式都可以，根据需要选择

## 📊 性能对比

| 特性 | 本地运行 | GitHub 链接 |
|------|----------|-------------|
| 响应速度 | ⚡ 极快 | 🚀 快 |
| 网络依赖 | ❌ 无 | ✅ 需要 |
| 自定义能力 | ✅ 完全 | ❌ 有限 |
| 部署复杂度 | 🟡 中等 | 🟢 简单 |
| 安全性 | 🟢 高 | 🟡 中等 |

## 🔄 切换方式

在 VS Code 中，您可以：
1. 打开设置 (Ctrl/Cmd + Shift + P)
2. 搜索 "MCP"
3. 选择不同的服务器配置
4. 重启 VS Code 或重新加载窗口 