# 🐳 Multi-stage Dockerfile for GitHub MCP Server
# 使用多阶段构建优化镜像大小和安全性

# 📦 构建阶段
FROM golang:1.24-alpine AS builder

# 🔧 安装构建依赖
RUN apk add --no-cache git ca-certificates tzdata

# 📁 设置工作目录
WORKDIR /app

# 📋 复制依赖文件
COPY go.mod go.sum ./

# 🔧 下载依赖
RUN go mod download

# 📁 复制源代码
COPY . .

# 🏗️ 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a -installsuffix cgo \
    -ldflags="-s -w -extldflags '-static'" \
    -o github-mcp-server ./cmd/github-mcp-server

# 🏗️ 构建mcpcurl工具
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a -installsuffix cgo \
    -ldflags="-s -w -extldflags '-static'" \
    -o mcpcurl ./cmd/mcpcurl

# 🐳 运行阶段
FROM scratch

# 📋 复制CA证书
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# 📋 复制时区数据
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# 👤 创建非root用户
USER 1000:1000

# 📁 设置工作目录
WORKDIR /app

# 📦 复制构建好的二进制文件
COPY --from=builder /app/github-mcp-server /app/github-mcp-server
COPY --from=builder /app/mcpcurl /app/mcpcurl

# 🔧 设置环境变量
ENV TZ=UTC
ENV PATH="/app:${PATH}"

# 📊 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/app/github-mcp-server", "--help"] || exit 1

# 🚀 暴露端口
EXPOSE 8080

# 📋 设置入口点
ENTRYPOINT ["/app/github-mcp-server"]

# 📝 元数据标签
LABEL maintainer="GitHub MCP Server Team"
LABEL description="GitHub MCP Server - Model Context Protocol Server for GitHub"
LABEL version="2.0.0"
LABEL org.opencontainers.image.source="https://github.com/github/github-mcp-server"
