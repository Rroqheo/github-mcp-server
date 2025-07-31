package ollama

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/mark3labs/mcp-go/server"
	"github.com/sirupsen/logrus"
)

// StdioServerConfig 表示 stdio 服务器配置
type StdioServerConfig struct {
	// 服务器版本
	Version string

	// Ollama 服务器基础 URL
	BaseURL string

	// 日志文件路径
	LogFile string

	// 日志级别
	LogLevel string
}

// RunStdioServer 运行 stdio 服务器
func RunStdioServer(cfg StdioServerConfig) error {
	// 设置日志
	if err := setupLogging(cfg.LogFile, cfg.LogLevel); err != nil {
		return fmt.Errorf("设置日志失败: %w", err)
	}

	// 创建 Ollama MCP 服务器
	ollamaServer := NewOllamaServer(cfg.Version, cfg.BaseURL, server.WithLogging())

	// 获取 MCP 服务器实例
	s := ollamaServer.GetServer()

	// 创建 stdio 服务器
	stdioServer := server.NewStdioServer(s)

	// 设置信号处理
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// 设置错误日志
	logrusLogger := logrus.New()
	if cfg.LogFile != "" {
		file, err := os.OpenFile(cfg.LogFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
		if err != nil {
			return fmt.Errorf("打开日志文件失败: %w", err)
		}
		logrusLogger.SetOutput(file)
	}
	stdLogger := log.New(logrusLogger.Writer(), "ollama-mcp-server", 0)
	stdioServer.SetErrorLogger(stdLogger)

	// 启动监听消息
	errC := make(chan error, 1)
	go func() {
		in, out := io.Reader(os.Stdin), io.Writer(os.Stdout)
		errC <- stdioServer.Listen(ctx, in, out)
	}()

	// 输出服务器信息
	_, _ = fmt.Fprintf(os.Stderr, "Ollama MCP Server running on stdio\n")
	_, _ = fmt.Fprintf(os.Stderr, "连接到 Ollama 服务器: %s\n", cfg.BaseURL)

	// 等待关闭信号
	select {
	case <-ctx.Done():
		logrusLogger.Infof("正在关闭服务器...")
	case err := <-errC:
		if err != nil {
			return fmt.Errorf("运行服务器时出错: %w", err)
		}
	}

	return nil
}

// setupLogging 设置日志配置
func setupLogging(logFile, logLevel string) error {
	// 设置日志级别
	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		return fmt.Errorf("解析日志级别失败: %w", err)
	}
	logrus.SetLevel(level)

	// 设置日志格式
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	// 如果指定了日志文件，则写入文件
	if logFile != "" {
		file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			return fmt.Errorf("打开日志文件失败: %w", err)
		}
		logrus.SetOutput(file)
	}

	return nil
}
