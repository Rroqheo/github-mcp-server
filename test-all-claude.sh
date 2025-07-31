#!/bin/bash
# 测试所有 Claude 版本的脚本

echo "🤖 测试所有 Claude 版本"
echo "================================"

# 测试 Claude 4
echo "🧪 测试 Claude 4..."
echo "输入: '你好，请介绍一下你自己'"
echo "输出:"
echo "你好，请介绍一下你自己" | ollama run claude4 | head -10
echo ""

# 测试 Claude 3.5 Sonnet
echo "🧪 测试 Claude 3.5 Sonnet..."
echo "输入: '你好，请介绍一下你自己'"
echo "输出:"
echo "你好，请介绍一下你自己" | ollama run claude3.5 | head -10
echo ""

# 测试 Claude 3 Haiku
echo "🧪 测试 Claude 3 Haiku..."
echo "输入: '你好，请介绍一下你自己'"
echo "输出:"
echo "你好，请介绍一下你自己" | ollama run claude3 | head -10
echo ""

# 测试 Claude 3 Opus
echo "🧪 测试 Claude 3 Opus..."
echo "输入: '你好，请介绍一下你自己'"
echo "输出:"
echo "你好，请介绍一下你自己" | ollama run claude3-opus | head -10
echo ""

echo "✅ 所有 Claude 版本测试完成！"
echo ""
echo "📋 可用的 Claude 版本："
echo "  - claude4 (Claude 4)"
echo "  - claude3.5 (Claude 3.5 Sonnet)"
echo "  - claude3 (Claude 3 Haiku)"
echo "  - claude3-opus (Claude 3 Opus)"
echo ""
echo "🚀 使用方法："
echo "  ollama run claude4"
echo "  ollama run claude3.5"
echo "  ollama run claude3"
echo "  ollama run claude3-opus" 