import React, { useState, useEffect } from 'react'
import { mcpManager } from '../mcp-integration.js'

interface ServerStatus {
  name: string
  status: string
  uptime: number
  pid: number
  restartCount?: number
  lastHealthCheck?: number
}

interface HealthData {
  name: string
  status: string
  alive: boolean
  uptime: number
  restartCount?: number
  lastHealthCheck?: number
}

const MCPServerPanel: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<Record<string, ServerStatus>>({})
  const [healthData, setHealthData] = useState<Record<string, HealthData> | null>(null)
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    refreshStatus()
    startStatusPolling()

    return () => {
      stopStatusPolling()
    }
  }, [])

  const refreshStatus = async () => {
    try {
      setServerStatus(mcpManager.getServerStatus())
      const health = await mcpManager.healthCheck()
      setHealthData(health)
    } catch (error) {
      console.error('获取服务器状态失败:', error)
    }
  }

  const startAllServers = async () => {
    try {
      await mcpManager.startAllServers()
      await refreshStatus()
    } catch (error) {
      console.error('启动所有服务器失败:', error)
    }
  }

  const stopAllServers = async () => {
    try {
      await mcpManager.stopAllServers()
      await refreshStatus()
    } catch (error) {
      console.error('停止所有服务器失败:', error)
    }
  }

  const toggleServer = async (serverId: string) => {
    try {
      const server = mcpManager.servers.get(serverId)
      if (server && server.status === 'running') {
        server.process.kill('SIGTERM')
      } else {
        // 重新启动服务器
        if (serverId === 'filesystem') {
          await mcpManager.startFilesystemServer()
        } else if (serverId === 'memory') {
          await mcpManager.startMemoryServer()
        }
      }
      await refreshStatus()
    } catch (error) {
      console.error(`切换服务器状态失败 (${serverId}):`, error)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'running': '运行中',
      'stopped': '已停止',
      'stopping': '停止中',
      'starting': '启动中'
    }
    return statusMap[status] || status
  }

  const formatUptime = (ms: number) => {
    if (!ms) return '0秒'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  const startStatusPolling = () => {
    const interval = setInterval(() => {
      refreshStatus()
    }, 5000) // 每5秒更新一次状态
    setStatusInterval(interval)
  }

  const stopStatusPolling = () => {
    if (statusInterval) {
      clearInterval(statusInterval)
      setStatusInterval(null)
    }
  }

  return (
    <div className="mcp-panel">
      <h3>🔧 MCP 服务器管理</h3>
      
      <div className="server-status">
        {Object.entries(serverStatus).map(([id, server]) => (
          <div key={id} className="server-item">
            <div className="server-info">
              <span className="server-name">{server.name}</span>
              <span className={`server-status ${server.status}`}>
                {getStatusText(server.status)}
              </span>
            </div>
            <div className="server-actions">
              <button 
                onClick={() => toggleServer(id)} 
                className={`btn-toggle ${server.status === 'running' ? 'btn-stop' : 'btn-start'}`}
              >
                {server.status === 'running' ? '停止' : '启动'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button onClick={startAllServers} className="btn-action btn-start-all">
          启动所有服务器
        </button>
        <button onClick={stopAllServers} className="btn-action btn-stop-all">
          停止所有服务器
        </button>
        <button onClick={refreshStatus} className="btn-action btn-refresh">
          刷新状态
        </button>
      </div>

      {healthData && (
        <div className="health-status">
          <h4>🏥 健康检查</h4>
          <div className="health-items">
            {Object.entries(healthData).map(([id, health]) => (
              <div 
                key={id} 
                className={`health-item ${health.alive ? 'healthy' : 'unhealthy'}`}
              >
                <span className="health-name">{health.name}</span>
                <span className="health-status">{health.alive ? '正常' : '异常'}</span>
                <span className="health-uptime">{formatUptime(health.uptime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MCPServerPanel 