# 现有的 Makefile 内容...

# 构建 Ollama MCP 服务器
.PHONY: build-ollama-server
build-ollama-server:
	@echo "构建 Ollama MCP 服务器..."
	@go build -ldflags="-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)" -o ollama-mcp-server cmd/ollama-mcp-server/main.go

# 安装 Ollama MCP 服务器
.PHONY: install-ollama-server
install-ollama-server: build-ollama-server
	@echo "安装 Ollama MCP 服务器..."
	@cp ollama-mcp-server /usr/local/bin/
	@chmod +x /usr/local/bin/ollama-mcp-server

# 运行 Ollama MCP 服务器
.PHONY: run-ollama-server
run-ollama-server: build-ollama-server
	@echo "运行 Ollama MCP 服务器..."
	@./ollama-mcp-server stdio

# 测试 Ollama MCP 服务器
.PHONY: test-ollama-server
test-ollama-server:
	@echo "测试 Ollama MCP 服务器..."
	@go test ./pkg/ollama/...

# 清理 Ollama MCP 服务器
.PHONY: clean-ollama-server
clean-ollama-server:
	@echo "清理 Ollama MCP 服务器..."
	@rm -f ollama-mcp-server 