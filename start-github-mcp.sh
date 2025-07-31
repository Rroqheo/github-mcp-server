#!/bin/bash

# GitHub MCP Server 启动脚本
# 支持本地运行和 Docker 运行两种方式

echo "🚀 GitHub MCP Server 启动器"
echo "================================"
echo "请选择运行方式："
echo "1) 本地运行 (推荐 - 无延迟)"
echo "2) Docker 运行 (官方方式)"
echo "3) 退出"
echo ""

read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "🖥️  启动本地运行模式..."
        if [ ! -f "./github-mcp-server" ]; then
            echo "📦 编译本地版本..."
            cd cmd/github-mcp-server
            go build -o ../../github-mcp-server
            cd ../..
        fi
        
        if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
            echo "🔑 请设置 GitHub 令牌："
            read -s -p "请输入您的 GitHub Personal Access Token: " token
            export GITHUB_PERSONAL_ACCESS_TOKEN="$token"
        fi
        
        echo "✅ 启动本地服务器..."
        ./github-mcp-server stdio
        ;;
    2)
        echo "🐳 启动 Docker 运行模式..."
        if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
            echo "🔑 请设置 GitHub 令牌："
            read -s -p "请输入您的 GitHub Personal Access Token: " token
            export GITHUB_PERSONAL_ACCESS_TOKEN="$token"
        fi
        
        echo "✅ 启动 Docker 容器..."
        docker run -i --rm \
            -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" \
            ghcr.io/github/github-mcp-server
        ;;
    3)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac 