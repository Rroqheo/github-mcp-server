#!/bin/bash

# 无网络 Claude 本地运行启动器
# 使用 Ollama + MCP 服务器实现本地 Claude 运行

echo "🤖 无网络 Claude 本地运行启动器"
echo "=================================="
echo "请选择运行方式："
echo "1) 启动 Ollama 服务"
echo "2) 启动 Claude MCP 服务器"
echo "3) 启动完整环境 (Ollama + MCP)"
echo "4) 检查 Ollama 状态"
echo "5) 下载 Claude 模型"
echo "6) 测试本地 Claude 4"
echo "7) 退出"
echo ""

read -p "请输入选择 (1-7): " choice

case $choice in
    1)
        echo "🐳 启动 Ollama 服务..."
        if ! command -v ollama &> /dev/null; then
            echo "❌ Ollama 未安装，请先安装 Ollama"
            echo "安装命令: brew install ollama"
            exit 1
        fi
        
        echo "✅ 启动 Ollama 服务..."
        ollama serve &
        echo "✅ Ollama 服务已启动 (后台运行)"
        echo "🌐 服务地址: http://localhost:11434"
        ;;
    2)
        echo "🤖 启动 Claude MCP 服务器..."
        cd cmd/ollama-mcp-server
        go run main.go stdio
        ;;
    3)
        echo "🚀 启动完整环境..."
        
        # 检查 Ollama 是否安装
        if ! command -v ollama &> /dev/null; then
            echo "❌ Ollama 未安装，请先安装 Ollama"
            echo "安装命令: brew install ollama"
            exit 1
        fi
        
        # 启动 Ollama 服务
        echo "🐳 启动 Ollama 服务..."
        ollama serve &
        OLLAMA_PID=$!
        echo "✅ Ollama 服务已启动 (PID: $OLLAMA_PID)"
        
        # 等待服务启动
        echo "⏳ 等待 Ollama 服务启动..."
        sleep 3
        
        # 检查服务状态
        if curl -s http://localhost:11434/api/tags > /dev/null; then
            echo "✅ Ollama 服务运行正常"
        else
            echo "❌ Ollama 服务启动失败"
            exit 1
        fi
        
        # 启动 MCP 服务器
        echo "🤖 启动 Claude MCP 服务器..."
        cd cmd/ollama-mcp-server
        go run main.go stdio
        ;;
    4)
        echo "🔍 检查 Ollama 状态..."
        if command -v ollama &> /dev/null; then
            echo "✅ Ollama 已安装"
            
            # 检查服务状态
            if curl -s http://localhost:11434/api/tags > /dev/null; then
                echo "✅ Ollama 服务正在运行"
                
                # 列出已安装的模型
                echo "📋 已安装的模型："
                ollama list
            else
                echo "❌ Ollama 服务未运行"
                echo "请运行: ollama serve"
            fi
        else
            echo "❌ Ollama 未安装"
            echo "安装命令: brew install ollama"
        fi
        ;;
    5)
        echo "📥 下载 Claude 模型..."
        if ! command -v ollama &> /dev/null; then
            echo "❌ Ollama 未安装，请先安装 Ollama"
            exit 1
        fi
        
        echo "请选择要下载的 Claude 模型："
        echo "1) Claude 3.5 Sonnet (推荐)"
        echo "2) Claude 3 Haiku (快速)"
        echo "3) Claude 3 Opus (最强)"
        echo "4) 自定义模型"
        echo "5) 创建本地 Claude 4 (已创建)"
        echo ""
        
        read -p "请输入选择 (1-5): " model_choice
        
        case $model_choice in
            1)
                echo "📥 下载 Claude 3.5 Sonnet..."
                ollama pull claude:3.5-sonnet
                ;;
            2)
                echo "📥 下载 Claude 3 Haiku..."
                ollama pull claude:3-haiku
                ;;
            3)
                echo "📥 下载 Claude 3 Opus..."
                ollama pull claude:3-opus
                ;;
            4)
                read -p "请输入模型名称: " custom_model
                echo "📥 下载自定义模型: $custom_model"
                ollama pull "$custom_model"
                ;;
            5)
                echo "✅ 本地 Claude 4 已创建完成！"
                echo "使用命令: ollama run claude4"
                ;;
            *)
                echo "❌ 无效选择"
                exit 1
                ;;
        esac
        ;;
    6)
        echo "🧪 测试本地 Claude 4..."
        if ! command -v ollama &> /dev/null; then
            echo "❌ Ollama 未安装"
            exit 1
        fi
        
        # 检查 claude4 模型是否存在
        if ollama list | grep -q "claude4"; then
            echo "✅ 本地 Claude 4 模型已找到"
            echo "🤖 开始测试对话..."
            echo "输入 'quit' 退出测试"
            echo ""
            
            # 启动交互式测试
            ollama run claude4
        else
            echo "❌ 本地 Claude 4 模型未找到"
            echo "请先运行选项 5 创建模型"
        fi
        ;;
    7)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac 