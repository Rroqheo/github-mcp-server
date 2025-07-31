package ollama

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// OllamaClient 表示与 Ollama 服务器的连接
type OllamaClient struct {
	baseURL    string
	httpClient *http.Client
}

// OllamaRequest 表示发送给 Ollama 的请求
type OllamaRequest struct {
	Model    string                 `json:"model"`
	Prompt   string                 `json:"prompt,omitempty"`
	Messages []OllamaMessage        `json:"messages,omitempty"`
	Stream   bool                   `json:"stream,omitempty"`
	Options  map[string]interface{} `json:"options,omitempty"`
}

// OllamaMessage 表示聊天消息
type OllamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OllamaResponse 表示 Ollama 的响应
type OllamaResponse struct {
	Model     string `json:"model"`
	Response  string `json:"response"`
	Done      bool   `json:"done"`
	CreatedAt string `json:"created_at"`
}

// OllamaModel 表示模型信息
type OllamaModel struct {
	Name       string `json:"name"`
	ModifiedAt string `json:"modified_at"`
	Size       int64  `json:"size"`
}

// OllamaServer 表示 Ollama MCP 服务器
type OllamaServer struct {
	client *OllamaClient
	server *server.MCPServer
}

// NewOllamaClient 创建新的 Ollama 客户端
func NewOllamaClient(baseURL string) *OllamaClient {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}

	return &OllamaClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewOllamaServer 创建新的 Ollama MCP 服务器
func NewOllamaServer(version string, baseURL string, opts ...server.ServerOption) *OllamaServer {
	// 添加默认选项
	defaultOpts := []server.ServerOption{
		server.WithToolCapabilities(true),
		server.WithResourceCapabilities(true, true),
		server.WithLogging(),
	}
	opts = append(defaultOpts, opts...)

	// 创建新的 MCP 服务器
	s := server.NewMCPServer(
		"ollama-mcp-server",
		version,
		opts...,
	)

	client := NewOllamaClient(baseURL)

	ollamaServer := &OllamaServer{
		client: client,
		server: s,
	}

	// 注册工具
	ollamaServer.registerTools()

	return ollamaServer
}

// registerTools 注册所有 Ollama 相关的工具
func (os *OllamaServer) registerTools() {
	// 生成文本工具
	generateTool, generateHandler := os.createGenerateTextTool()
	os.server.AddTool(generateTool, generateHandler)

	// 聊天工具
	chatTool, chatHandler := os.createChatTool()
	os.server.AddTool(chatTool, chatHandler)

	// 列出模型工具
	listModelsTool, listModelsHandler := os.createListModelsTool()
	os.server.AddTool(listModelsTool, listModelsHandler)

	// 拉取模型工具
	pullModelTool, pullModelHandler := os.createPullModelTool()
	os.server.AddTool(pullModelTool, pullModelHandler)

	// 删除模型工具
	deleteModelTool, deleteModelHandler := os.createDeleteModelTool()
	os.server.AddTool(deleteModelTool, deleteModelHandler)
}

// createGenerateTextTool 创建文本生成工具
func (os *OllamaServer) createGenerateTextTool() (mcp.Tool, server.ToolHandlerFunc) {
	return mcp.NewTool("generate_text",
			mcp.WithDescription("使用指定的模型生成文本"),
			mcp.WithToolAnnotation(mcp.ToolAnnotation{
				Title:        "生成文本",
				ReadOnlyHint: toBoolPtr(false),
			}),
			mcp.WithString("model",
				mcp.Required(),
				mcp.Description("要使用的模型名称"),
			),
			mcp.WithString("prompt",
				mcp.Required(),
				mcp.Description("输入提示"),
			),
			mcp.WithBoolean("stream",
				mcp.Description("是否流式输出"),
			),
		),
		os.handleGenerateText
}

// createChatTool 创建聊天工具
func (os *OllamaServer) createChatTool() (mcp.Tool, server.ToolHandlerFunc) {
	return mcp.NewTool("chat",
			mcp.WithDescription("与模型进行对话"),
			mcp.WithToolAnnotation(mcp.ToolAnnotation{
				Title:        "聊天对话",
				ReadOnlyHint: toBoolPtr(false),
			}),
			mcp.WithString("model",
				mcp.Required(),
				mcp.Description("要使用的模型名称"),
			),
			mcp.WithArray("messages",
				mcp.Required(),
				mcp.Description("对话消息列表"),
				mcp.Items(
					map[string]any{
						"type": "object",
						"properties": map[string]any{
							"role": map[string]any{
								"type": "string",
							},
							"content": map[string]any{
								"type": "string",
							},
						},
					},
				),
			),
		),
		os.handleChat
}

// createListModelsTool 创建列出模型工具
func (os *OllamaServer) createListModelsTool() (mcp.Tool, server.ToolHandlerFunc) {
	return mcp.NewTool("list_models",
			mcp.WithDescription("列出可用的模型"),
			mcp.WithToolAnnotation(mcp.ToolAnnotation{
				Title:        "列出模型",
				ReadOnlyHint: toBoolPtr(true),
			}),
			mcp.WithBoolean("details",
				mcp.Description("是否包含详细信息"),
			),
		),
		os.handleListModels
}

// createPullModelTool 创建拉取模型工具
func (os *OllamaServer) createPullModelTool() (mcp.Tool, server.ToolHandlerFunc) {
	return mcp.NewTool("pull_model",
			mcp.WithDescription("拉取指定的模型"),
			mcp.WithToolAnnotation(mcp.ToolAnnotation{
				Title:        "拉取模型",
				ReadOnlyHint: toBoolPtr(false),
			}),
			mcp.WithString("model",
				mcp.Required(),
				mcp.Description("要拉取的模型名称"),
			),
		),
		os.handlePullModel
}

// createDeleteModelTool 创建删除模型工具
func (os *OllamaServer) createDeleteModelTool() (mcp.Tool, server.ToolHandlerFunc) {
	return mcp.NewTool("delete_model",
			mcp.WithDescription("删除指定的模型"),
			mcp.WithToolAnnotation(mcp.ToolAnnotation{
				Title:        "删除模型",
				ReadOnlyHint: toBoolPtr(false),
			}),
			mcp.WithString("model",
				mcp.Required(),
				mcp.Description("要删除的模型名称"),
			),
		),
		os.handleDeleteModel
}

// toBoolPtr 辅助函数，将 bool 转换为指针
func toBoolPtr(b bool) *bool {
	return &b
}

// requiredParam 辅助函数，用于获取必需的参数
func requiredParam[T comparable](r mcp.CallToolRequest, p string) (T, error) {
	var zero T

	// 检查参数是否存在于请求中
	if _, ok := r.Params.Arguments[p]; !ok {
		return zero, fmt.Errorf("缺少必需参数: %s", p)
	}

	// 检查参数是否为预期类型
	if _, ok := r.Params.Arguments[p].(T); !ok {
		return zero, fmt.Errorf("参数 %s 不是类型 %T", p, zero)
	}

	if r.Params.Arguments[p].(T) == zero {
		return zero, fmt.Errorf("缺少必需参数: %s", p)
	}

	return r.Params.Arguments[p].(T), nil
}

// OptionalParam 辅助函数，用于获取可选参数
func OptionalParam[T any](r mcp.CallToolRequest, p string) (T, error) {
	var zero T

	// 检查参数是否存在于请求中
	if _, ok := r.Params.Arguments[p]; !ok {
		return zero, nil
	}

	// 检查参数是否为预期类型
	if _, ok := r.Params.Arguments[p].(T); !ok {
		return zero, fmt.Errorf("参数 %s 不是类型 %T，而是 %T", p, zero, r.Params.Arguments[p])
	}

	return r.Params.Arguments[p].(T), nil
}

// handleGenerateText 处理文本生成请求
func (os *OllamaServer) handleGenerateText(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	model, err := requiredParam[string](req, "model")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	prompt, err := requiredParam[string](req, "prompt")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	stream, _ := OptionalParam[bool](req, "stream")

	ollamaReq := OllamaRequest{
		Model:  model,
		Prompt: prompt,
		Stream: stream,
	}

	resp, err := os.client.Generate(ctx, ollamaReq)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("生成文本失败: %v", err)), nil
	}

	return mcp.NewToolResultText(resp.Response), nil
}

// handleChat 处理聊天请求
func (os *OllamaServer) handleChat(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	model, err := requiredParam[string](req, "model")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	messages, err := OptionalParam[[]any](req, "messages")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	if messages == nil || len(messages) == 0 {
		return mcp.NewToolResultError("消息列表不能为空"), nil
	}

	// 转换消息格式
	ollamaMessages := make([]OllamaMessage, len(messages))
	for i, msg := range messages {
		msgMap, ok := msg.(map[string]interface{})
		if !ok {
			return mcp.NewToolResultError("消息格式错误"), nil
		}

		role, ok := msgMap["role"].(string)
		if !ok {
			return mcp.NewToolResultError("消息角色格式错误"), nil
		}

		content, ok := msgMap["content"].(string)
		if !ok {
			return mcp.NewToolResultError("消息内容格式错误"), nil
		}

		ollamaMessages[i] = OllamaMessage{
			Role:    role,
			Content: content,
		}
	}

	ollamaReq := OllamaRequest{
		Model:    model,
		Messages: ollamaMessages,
	}

	resp, err := os.client.Chat(ctx, ollamaReq)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("聊天失败: %v", err)), nil
	}

	return mcp.NewToolResultText(resp.Response), nil
}

// handleListModels 处理列出模型请求
func (os *OllamaServer) handleListModels(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	details, _ := OptionalParam[bool](req, "details")

	models, err := os.client.ListModels(ctx, details)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("列出模型失败: %v", err)), nil
	}

	modelsJSON, err := json.Marshal(models)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("序列化模型列表失败: %v", err)), nil
	}

	return mcp.NewToolResultText(string(modelsJSON)), nil
}

// handlePullModel 处理拉取模型请求
func (os *OllamaServer) handlePullModel(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	model, err := requiredParam[string](req, "model")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	err = os.client.PullModel(ctx, model)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("拉取模型失败: %v", err)), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("模型 %s 拉取成功", model)), nil
}

// handleDeleteModel 处理删除模型请求
func (os *OllamaServer) handleDeleteModel(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	model, err := requiredParam[string](req, "model")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	err = os.client.DeleteModel(ctx, model)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("删除模型失败: %v", err)), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("模型 %s 删除成功", model)), nil
}

// GetServer 返回 MCP 服务器实例
func (os *OllamaServer) GetServer() *server.MCPServer {
	return os.server
}
