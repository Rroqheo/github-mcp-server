import React, { useState, useEffect } from 'react'
import { errorHandler } from '../utils/error-handler.js'

interface Notification {
  id: number
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'critical'
  action: string
  retryable: boolean
  progress: number
  timestamp: number
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [nextId, setNextId] = useState(1)

  useEffect(() => {
    // 监听错误处理器的通知
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail
      showNotification(notification)
    }

    // 监听MCP服务器事件
    const handleMCPServerEvent = (event: CustomEvent) => {
      const { type, server, message } = event.detail
      
      const notification = {
        title: `MCP 服务器: ${server}`,
        message: message,
        type: type === 'error' ? 'error' : 'info' as const,
        retryable: type === 'error'
      }
      
      showNotification(notification)
    }

    window.addEventListener('claudia-notification', handleNotification as EventListener)
    window.addEventListener('mcp-server-event', handleMCPServerEvent as EventListener)

    return () => {
      window.removeEventListener('claudia-notification', handleNotification as EventListener)
      window.removeEventListener('mcp-server-event', handleMCPServerEvent as EventListener)
    }
  }, [])

  const showNotification = (notification: Partial<Notification>) => {
    const id = nextId
    setNextId(prev => prev + 1)
    
    const fullNotification: Notification = {
      id,
      title: notification.title || '通知',
      message: notification.message || '',
      type: notification.type || 'info',
      action: notification.action || '',
      retryable: notification.retryable || false,
      progress: 100,
      timestamp: Date.now()
    }
    
    setNotifications(prev => [fullNotification, ...prev])
    
    // 自动消失
    startAutoDismiss(id)
    
    // 限制通知数量
    setNotifications(prev => prev.slice(0, 5))
  }

  const startAutoDismiss = (id: number) => {
    const duration = 5000 // 5秒
    const interval = 100 // 每100ms更新一次
    const steps = duration / interval
    const stepSize = 100 / steps
    
    const timer = setInterval(() => {
      setNotifications(prev => {
        const updated = prev.map(n => {
          if (n.id === id) {
            const newProgress = n.progress - stepSize
            if (newProgress <= 0) {
              return null
            }
            return { ...n, progress: newProgress }
          }
          return n
        }).filter(Boolean) as Notification[]
        
        if (updated.length !== prev.length) {
          clearInterval(timer)
        }
        
        return updated
      })
    }, interval)
  }

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const retryAction = (notification: Notification) => {
    // 发送重试事件
    const event = new CustomEvent('claudia-retry-action', {
      detail: {
        notification,
        timestamp: Date.now()
      }
    })
    window.dispatchEvent(event)
    
    // 更新通知
    setNotifications(prev => prev.map(n => {
      if (n.id === notification.id) {
        return {
          ...n,
          message: '正在重试...',
          type: 'info' as const,
          progress: 100
        }
      }
      return n
    }))
    
    // 重新开始自动消失
    startAutoDismiss(notification.id)
  }

  return (
    <div className="notification-container">
      <div className="notification-list">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            onClick={() => dismissNotification(notification.id)}
          >
            <div className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
              {notification.type === 'critical' && '🚨'}
            </div>
            
            <div className="notification-content">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              {notification.action && (
                <div className="notification-action">
                  {notification.action}
                </div>
              )}
            </div>
            
            <div className="notification-actions">
              {notification.retryable && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    retryAction(notification)
                  }}
                  className="btn-retry"
                >
                  重试
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  dismissNotification(notification.id)
                }}
                className="btn-dismiss"
              >
                ✕
              </button>
            </div>
            
            <div className="notification-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${notification.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationSystem 