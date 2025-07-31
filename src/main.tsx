import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './style.css'
import { initializeMCPServers, cleanupMCPServers } from './mcp-integration.js'

// 创建React应用
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 初始化 MCP 服务器
console.log('🚀 Claudia Ultimate 应用已启动')
initializeMCPServers().then(success => {
  if (success) {
    console.log('✅ MCP 服务器初始化成功')
  } else {
    console.warn('⚠️ MCP 服务器初始化失败')
  }
})

// 应用关闭时清理
window.addEventListener('beforeunload', () => {
  cleanupMCPServers()
}) 