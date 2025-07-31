package ollama

import (
	"testing"

	"github.com/mark3labs/mcp-go/mcp"
)

func TestNewOllamaServer(t *testing.T) {
	// 创建 Ollama MCP 服务器
	ollamaServer := NewOllamaServer("test-version", "http://localhost:11434")

	if ollamaServer == nil {
		t.Fatal("NewOllamaServer 返回了 nil")
	}

	// 获取 MCP 服务器实例
	s := ollamaServer.GetServer()
	if s == nil {
		t.Fatal("GetServer 返回了 nil")
	}
}

func TestNewOllamaClient(t *testing.T) {
	// 测试默认 URL
	client := NewOllamaClient("")
	if client.baseURL != "http://localhost:11434" {
		t.Errorf("期望默认 URL 为 http://localhost:11434，实际为 %s", client.baseURL)
	}

	// 测试自定义 URL
	customURL := "http://custom-ollama:11434"
	client = NewOllamaClient(customURL)
	if client.baseURL != customURL {
		t.Errorf("期望 URL 为 %s，实际为 %s", customURL, client.baseURL)
	}
}

func TestRequiredParam(t *testing.T) {
	// 创建测试请求
	req := mcp.CallToolRequest{}
	req.Params.Arguments = map[string]interface{}{
		"string_param": "test_value",
		"int_param":    42,
	}

	// 测试字符串参数
	strVal, err := requiredParam[string](req, "string_param")
	if err != nil {
		t.Errorf("获取字符串参数失败: %v", err)
	}
	if strVal != "test_value" {
		t.Errorf("期望字符串值为 test_value，实际为 %s", strVal)
	}

	// 测试整数参数
	intVal, err := requiredParam[int](req, "int_param")
	if err != nil {
		t.Errorf("获取整数参数失败: %v", err)
	}
	if intVal != 42 {
		t.Errorf("期望整数值为 42，实际为 %d", intVal)
	}

	// 测试缺失参数
	_, err = requiredParam[string](req, "missing_param")
	if err == nil {
		t.Error("期望缺失参数返回错误，但没有")
	}
}

func TestOptionalParam(t *testing.T) {
	// 创建测试请求
	req := mcp.CallToolRequest{}
	req.Params.Arguments = map[string]interface{}{
		"string_param": "test_value",
		"int_param":    42,
	}

	// 测试存在的字符串参数
	strVal, err := OptionalParam[string](req, "string_param")
	if err != nil {
		t.Errorf("获取字符串参数失败: %v", err)
	}
	if strVal != "test_value" {
		t.Errorf("期望字符串值为 test_value，实际为 %s", strVal)
	}

	// 测试存在的整数参数
	intVal, err := OptionalParam[int](req, "int_param")
	if err != nil {
		t.Errorf("获取整数参数失败: %v", err)
	}
	if intVal != 42 {
		t.Errorf("期望整数值为 42，实际为 %d", intVal)
	}

	// 测试缺失参数（应该返回零值）
	strVal, err = OptionalParam[string](req, "missing_param")
	if err != nil {
		t.Errorf("获取缺失参数时不应该返回错误: %v", err)
	}
	if strVal != "" {
		t.Errorf("期望缺失参数返回空字符串，实际为 %s", strVal)
	}
}

func TestToBoolPtr(t *testing.T) {
	// 测试 true
	truePtr := toBoolPtr(true)
	if *truePtr != true {
		t.Error("toBoolPtr(true) 应该返回指向 true 的指针")
	}

	// 测试 false
	falsePtr := toBoolPtr(false)
	if *falsePtr != false {
		t.Error("toBoolPtr(false) 应该返回指向 false 的指针")
	}
}

func TestOllamaMessage(t *testing.T) {
	msg := OllamaMessage{
		Role:    "user",
		Content: "Hello, world!",
	}

	if msg.Role != "user" {
		t.Errorf("期望角色为 user，实际为 %s", msg.Role)
	}

	if msg.Content != "Hello, world!" {
		t.Errorf("期望内容为 Hello, world!，实际为 %s", msg.Content)
	}
}

func TestOllamaRequest(t *testing.T) {
	req := OllamaRequest{
		Model:  "llama2",
		Prompt: "Test prompt",
		Stream: false,
	}

	if req.Model != "llama2" {
		t.Errorf("期望模型为 llama2，实际为 %s", req.Model)
	}

	if req.Prompt != "Test prompt" {
		t.Errorf("期望提示为 Test prompt，实际为 %s", req.Prompt)
	}

	if req.Stream != false {
		t.Errorf("期望流式为 false，实际为 %t", req.Stream)
	}
}

func TestOllamaResponse(t *testing.T) {
	resp := OllamaResponse{
		Model:     "llama2",
		Response:  "Test response",
		Done:      true,
		CreatedAt: "2024-01-01T00:00:00Z",
	}

	if resp.Model != "llama2" {
		t.Errorf("期望模型为 llama2，实际为 %s", resp.Model)
	}

	if resp.Response != "Test response" {
		t.Errorf("期望响应为 Test response，实际为 %s", resp.Response)
	}

	if resp.Done != true {
		t.Errorf("期望完成状态为 true，实际为 %t", resp.Done)
	}

	if resp.CreatedAt != "2024-01-01T00:00:00Z" {
		t.Errorf("期望创建时间为 2024-01-01T00:00:00Z，实际为 %s", resp.CreatedAt)
	}
}

func TestOllamaModel(t *testing.T) {
	model := OllamaModel{
		Name:       "llama2",
		ModifiedAt: "2024-01-01T00:00:00Z",
		Size:       4096,
	}

	if model.Name != "llama2" {
		t.Errorf("期望名称为 llama2，实际为 %s", model.Name)
	}

	if model.ModifiedAt != "2024-01-01T00:00:00Z" {
		t.Errorf("期望修改时间为 2024-01-01T00:00:00Z，实际为 %s", model.ModifiedAt)
	}

	if model.Size != 4096 {
		t.Errorf("期望大小为 4096，实际为 %d", model.Size)
	}
}
