# 🤖 无网络 Claude 本地运行指南

## 🎯 概述

您的项目已经集成了 **Ollama MCP 服务器**，可以实现**完全无网络的 Claude 本地运行**！

## 🚀 快速开始

### 1. 安装 Ollama
```bash
# macOS
brew install ollama

# 或者从官网下载
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. 下载 Claude 模型
```bash
# 下载 Claude 3.5 Sonnet (推荐)
ollama pull claude:3.5-sonnet

# 或者下载其他版本
ollama pull claude:3-haiku    # 快速版本
ollama pull claude:3-opus     # 最强版本
```

### 3. 启动本地 Claude
```bash
# 使用启动脚本
./start-claude-local.sh

# 或者手动启动
ollama serve &
cd cmd/ollama-mcp-server
go run main.go stdio
```

## 📋 功能特性

### ✅ 支持的功能
- **文本生成**: 使用 `generate_text` 工具
- **聊天对话**: 使用 `chat` 工具
- **模型管理**: 列出、下载、删除模型
- **完全离线**: 无需网络连接
- **本地处理**: 所有数据在本地处理

### 🔧 可用的工具

#### 1. 文本生成
```json
{
  "tool": "generate_text",
  "arguments": {
    "model": "claude:3.5-sonnet",
    "prompt": "解释什么是人工智能",
    "stream": false
  }
}
```

#### 2. 聊天对话
```json
{
  "tool": "chat",
  "arguments": {
    "model": "claude:3.5-sonnet",
    "messages": [
      {"role": "user", "content": "你好"},
      {"role": "assistant", "content": "你好！有什么我可以帮助你的吗？"},
      {"role": "user", "content": "请解释什么是机器学习"}
    ]
  }
}
```

#### 3. 模型管理
- `list_models` - 列出可用模型
- `pull_model` - 下载新模型
- `delete_model` - 删除模型

## 🎮 使用方法

### 方式 1: 使用启动脚本
```bash
./start-claude-local.sh
```
然后选择：
- `1` - 启动 Ollama 服务
- `2` - 启动 Claude MCP 服务器
- `3` - 启动完整环境
- `4` - 检查状态
- `5` - 下载模型

### 方式 2: VS Code 集成
在 VS Code 中配置 MCP 服务器：
1. 打开设置 (Ctrl/Cmd + Shift + P)
2. 搜索 "MCP"
3. 选择 `claude-local` 服务器
4. 重启 VS Code

### 方式 3: 手动启动
```bash
# 启动 Ollama 服务
ollama serve &

# 启动 MCP 服务器
cd cmd/ollama-mcp-server
go run main.go stdio
```

## 📊 性能对比

| 特性 | 本地 Claude | 云端 Claude |
|------|-------------|-------------|
| 网络依赖 | ❌ 无 | ✅ 需要 |
| 响应速度 | ⚡ 极快 | 🚀 快 |
| 隐私安全 | 🟢 完全本地 | 🟡 云端处理 |
| 成本 | 🟢 免费 | 🟡 付费 |
| 自定义能力 | ✅ 完全 | ❌ 有限 |
| 离线使用 | ✅ 支持 | ❌ 不支持 |

## 🔧 配置选项

### 环境变量
```bash
export OLLAMA_MCP_OLLAMA_URL="http://localhost:11434"
export OLLAMA_MCP_LOG_LEVEL="info"
export OLLAMA_MCP_LOG_FILE="/path/to/log.txt"
```

### 命令行参数
```bash
# 指定 Ollama 服务器 URL
go run main.go stdio --ollama-url http://localhost:11434

# 设置日志级别
go run main.go stdio --log-level debug

# 指定日志文件
go run main.go stdio --log-file claude.log
```

## 🛠️ 故障排除

### 常见问题

#### 1. Ollama 未安装
```bash
# 安装 Ollama
brew install ollama

# 验证安装
ollama --version
```

#### 2. 模型未下载
```bash
# 列出可用模型
ollama list

# 下载 Claude 模型
ollama pull claude:3.5-sonnet
```

#### 3. 服务未启动
```bash
# 启动 Ollama 服务
ollama serve &

# 检查服务状态
curl http://localhost:11434/api/tags
```

#### 4. MCP 服务器连接失败
```bash
# 检查端口是否被占用
lsof -i :11434

# 重启 Ollama 服务
pkill ollama
ollama serve &
```

## 🎯 最佳实践

1. **模型选择**: 根据需求选择合适的 Claude 模型
2. **资源管理**: 监控内存和 CPU 使用情况
3. **定期更新**: 保持 Ollama 和模型版本最新
4. **备份配置**: 定期备份重要的模型和配置

## 🔄 与 GitHub MCP 集成

您可以同时运行 GitHub MCP 和 Claude MCP 服务器：

```bash
# 启动 GitHub MCP
./start-github-mcp.sh

# 启动 Claude MCP
./start-claude-local.sh
```

这样您就可以在同一个环境中使用 GitHub API 和本地 Claude AI！

## 📝 总结

现在您拥有了一个完整的**无网络 Claude 运行环境**：

- ✅ **完全离线**: 无需网络连接
- ✅ **本地处理**: 所有数据在本地
- ✅ **隐私安全**: 数据不会发送到云端
- ✅ **免费使用**: 无需支付 API 费用
- ✅ **完全控制**: 可以自定义和修改

开始享受无网络的 Claude 体验吧！🚀 