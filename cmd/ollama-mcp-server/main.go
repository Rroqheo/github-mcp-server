package main

import (
	"fmt"
	"os"

	"github.com/github/github-mcp-server/pkg/ollama"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// 这些变量由构建过程使用 ldflags 设置
var version = "version"
var commit = "commit"
var date = "date"

var (
	rootCmd = &cobra.Command{
		Use:     "ollama-server",
		Short:   "Ollama MCP Server",
		Long:    `一个 Ollama MCP 服务器，处理各种 AI 模型工具和资源。`,
		Version: fmt.Sprintf("Version: %s\nCommit: %s\nBuild Date: %s", version, commit, date),
	}

	stdioCmd = &cobra.Command{
		Use:   "stdio",
		Short: "启动 stdio 服务器",
		Long:  `启动一个通过标准输入/输出流使用 JSON-RPC 消息进行通信的服务器。`,
		RunE: func(_ *cobra.Command, _ []string) error {
			baseURL := viper.GetString("ollama_url")
			if baseURL == "" {
				baseURL = "http://localhost:11434"
			}

			stdioServerConfig := ollama.StdioServerConfig{
				Version:  version,
				BaseURL:  baseURL,
				LogFile:  viper.GetString("log-file"),
				LogLevel: viper.GetString("log-level"),
			}

			return ollama.RunStdioServer(stdioServerConfig)
		},
	}
)

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.SetVersionTemplate("{{.Short}}\n{{.Version}}\n")

	// 添加全局标志
	rootCmd.PersistentFlags().String("ollama-url", "http://localhost:11434", "Ollama 服务器 URL")
	rootCmd.PersistentFlags().String("log-file", "", "日志文件路径")
	rootCmd.PersistentFlags().String("log-level", "info", "日志级别 (debug, info, warn, error)")

	// 绑定标志到 viper
	_ = viper.BindPFlag("ollama_url", rootCmd.PersistentFlags().Lookup("ollama-url"))
	_ = viper.BindPFlag("log-file", rootCmd.PersistentFlags().Lookup("log-file"))
	_ = viper.BindPFlag("log-level", rootCmd.PersistentFlags().Lookup("log-level"))

	// 添加子命令
	rootCmd.AddCommand(stdioCmd)
}

func initConfig() {
	// 初始化 Viper 配置
	viper.SetEnvPrefix("OLLAMA_MCP")
	viper.AutomaticEnv()
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
}
