# Ollama MCP 服务器

这是一个 Ollama MCP (Model Context Protocol) 服务器，允许通过 MCP 协议与 Ollama 服务器进行交互。

## 功能特性

- **文本生成**: 使用指定的模型生成文本
- **聊天对话**: 与模型进行多轮对话
- **模型管理**: 列出、拉取和删除模型
- **流式输出**: 支持流式文本生成
- **多模型支持**: 支持所有 Ollama 支持的模型

## 安装

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/github/github-mcp-server.git
cd github-mcp-server

# 构建 Ollama MCP 服务器
make build-ollama-server

# 安装到系统
make install-ollama-server
```

### 直接运行

```bash
# 构建并运行
make run-ollama-server
```

## 配置

### 环境变量

- `OLLAMA_MCP_OLLAMA_URL`: Ollama 服务器 URL (默认: http://localhost:11434)
- `OLLAMA_MCP_LOG_FILE`: 日志文件路径
- `OLLAMA_MCP_LOG_LEVEL`: 日志级别 (debug, info, warn, error)

### 命令行参数

```bash
./ollama-mcp-server stdio \
  --ollama-url http://localhost:11434 \
  --log-file /path/to/logfile \
  --log-level info
```

## 使用方法

### 1. 启动 Ollama 服务器

首先确保 Ollama 服务器正在运行：

```bash
# 启动 Ollama 服务器
ollama serve
```

### 2. 启动 MCP 服务器

```bash
# 启动 Ollama MCP 服务器
./ollama-mcp-server stdio
```

### 3. 在 MCP 客户端中使用

在支持 MCP 的客户端（如 Claude Desktop）中配置服务器：

```json
{
  "mcpServers": {
    "ollama": {
      "command": "./ollama-mcp-server",
      "args": ["stdio"]
    }
  }
}
```

## 可用工具

### 1. generate_text - 文本生成

使用指定的模型生成文本。

**参数:**
- `model` (必需): 要使用的模型名称
- `prompt` (必需): 输入提示
- `stream` (可选): 是否流式输出

**示例:**
```json
{
  "tool": "generate_text",
  "arguments": {
    "model": "llama2",
    "prompt": "解释什么是人工智能",
    "stream": false
  }
}
```

### 2. chat - 聊天对话

与模型进行多轮对话。

**参数:**
- `model` (必需): 要使用的模型名称
- `messages` (必需): 对话消息列表

**示例:**
```json
{
  "tool": "chat",
  "arguments": {
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "你好"},
      {"role": "assistant", "content": "你好！有什么我可以帮助你的吗？"},
      {"role": "user", "content": "请解释什么是机器学习"}
    ]
  }
}
```

### 3. list_models - 列出模型

列出可用的模型。

**参数:**
- `details` (可选): 是否包含详细信息

**示例:**
```json
{
  "tool": "list_models",
  "arguments": {
    "details": true
  }
}
```

### 4. pull_model - 拉取模型

拉取指定的模型。

**参数:**
- `model` (必需): 要拉取的模型名称

**示例:**
```json
{
  "tool": "pull_model",
  "arguments": {
    "model": "llama2:7b"
  }
}
```

### 5. delete_model - 删除模型

删除指定的模型。

**参数:**
- `model` (必需): 要删除的模型名称

**示例:**
```json
{
  "tool": "delete_model",
  "arguments": {
    "model": "llama2:7b"
  }
}
```

## 支持的模型

Ollama MCP 服务器支持所有 Ollama 支持的模型，包括但不限于：

- **Llama 系列**: llama2, llama2:7b, llama2:13b, llama2:70b
- **Code Llama**: codellama, codellama:7b, codellama:13b
- **Mistral**: mistral, mistral:7b
- **Gemma**: gemma, gemma:2b, gemma:7b
- **Phi**: phi, phi:2.7b
- **Qwen**: qwen, qwen:7b, qwen:14b
- **Yi**: yi, yi:6b, yi:34b

## 故障排除

### 1. 连接错误

如果遇到连接错误，请检查：

- Ollama 服务器是否正在运行
- 服务器 URL 是否正确
- 防火墙设置是否允许连接

### 2. 模型不存在

如果模型不存在，请先拉取模型：

```bash
ollama pull llama2
```

### 3. 内存不足

对于大型模型，确保有足够的内存：

- 7B 模型需要约 8GB RAM
- 13B 模型需要约 16GB RAM
- 70B 模型需要约 40GB RAM

## 开发

### 运行测试

```bash
make test-ollama-server
```

### 清理构建文件

```bash
make clean-ollama-server
```

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。 