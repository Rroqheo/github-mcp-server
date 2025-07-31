package ollama

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Generate 使用指定的模型生成文本
func (oc *OllamaClient) Generate(ctx context.Context, req OllamaRequest) (*OllamaResponse, error) {
	reqJSON, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	resp, err := oc.makeRequest(ctx, "POST", "/api/generate", reqJSON)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var ollamaResp OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	return &ollamaResp, nil
}

// Chat 与模型进行对话
func (oc *OllamaClient) Chat(ctx context.Context, req OllamaRequest) (*OllamaResponse, error) {
	reqJSON, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	resp, err := oc.makeRequest(ctx, "POST", "/api/chat", reqJSON)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var ollamaResp OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	return &ollamaResp, nil
}

// ListModelsResponse 表示列出模型的响应
type ListModelsResponse struct {
	Models []OllamaModel `json:"models"`
}

// ListModels 列出可用的模型
func (oc *OllamaClient) ListModels(ctx context.Context, details bool) ([]OllamaModel, error) {
	url := "/api/tags"
	if details {
		url += "?details=true"
	}

	resp, err := oc.makeRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var listResp ListModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&listResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	return listResp.Models, nil
}

// PullModelRequest 表示拉取模型的请求
type PullModelRequest struct {
	Name string `json:"name"`
}

// PullModel 拉取指定的模型
func (oc *OllamaClient) PullModel(ctx context.Context, modelName string) error {
	req := PullModelRequest{
		Name: modelName,
	}

	reqJSON, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("序列化请求失败: %w", err)
	}

	resp, err := oc.makeRequest(ctx, "POST", "/api/pull", reqJSON)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("拉取模型失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	return nil
}

// DeleteModelRequest 表示删除模型的请求
type DeleteModelRequest struct {
	Name string `json:"name"`
}

// DeleteModel 删除指定的模型
func (oc *OllamaClient) DeleteModel(ctx context.Context, modelName string) error {
	req := DeleteModelRequest{
		Name: modelName,
	}

	reqJSON, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("序列化请求失败: %w", err)
	}

	resp, err := oc.makeRequest(ctx, "DELETE", "/api/delete", reqJSON)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("删除模型失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	return nil
}

// makeRequest 发送 HTTP 请求到 Ollama 服务器
func (oc *OllamaClient) makeRequest(ctx context.Context, method, path string, body []byte) (*http.Response, error) {
	url := oc.baseURL + path

	var req *http.Request
	var err error

	if body != nil {
		req, err = http.NewRequestWithContext(ctx, method, url, bytes.NewBuffer(body))
		if err != nil {
			return nil, fmt.Errorf("创建请求失败: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequestWithContext(ctx, method, url, nil)
		if err != nil {
			return nil, fmt.Errorf("创建请求失败: %w", err)
		}
	}

	resp, err := oc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送请求失败: %w", err)
	}

	return resp, nil
}
