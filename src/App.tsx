import React from 'react'
import MCPServerPanel from './components/MCPServerPanel'
import NotificationSystem from './components/NotificationSystem'
import { errorHandler } from './utils/error-handler.js'

const App: React.FC = () => {
  React.useEffect(() => {
    // 监听重试事件
    const handleRetryAction = (event: CustomEvent) => {
      const { notification } = event.detail;
      console.log('重试操作:', notification);
    };

    // 显示欢迎通知
    const showWelcomeNotification = () => {
      setTimeout(() => {
        const event = new CustomEvent('claudia-notification', {
          detail: {
            title: '欢迎使用 Claudia Ultimate',
            message: '智能桌面应用已启动，MCP 服务器正在初始化...',
            type: 'info'
          }
        });
        window.dispatchEvent(event);
      }, 1000);
    };

    window.addEventListener('claudia-retry-action', handleRetryAction as EventListener);
    showWelcomeNotification();

    return () => {
      window.removeEventListener('claudia-retry-action', handleRetryAction as EventListener);
    };
  }, []);

  // 打开文件管理器
  const openFileManager = () => {
    const event = new CustomEvent('claudia-notification', {
      detail: {
        title: '文件管理器',
        message: '文件管理器功能正在开发中...',
        type: 'info'
      }
    });
    window.dispatchEvent(event);
  };

  // 打开内存管理器
  const openMemoryManager = () => {
    const event = new CustomEvent('claudia-notification', {
      detail: {
        title: '内存管理器',
        message: '内存管理器功能正在开发中...',
        type: 'info'
      }
    });
    window.dispatchEvent(event);
  };

  // 打开系统监控
  const openSystemMonitor = () => {
    const stats = errorHandler.getErrorStats();
    const event = new CustomEvent('claudia-notification', {
      detail: {
        title: '系统监控',
        message: `错误统计: 总计 ${stats.total} 个错误，最近 ${stats.recent.length} 个`,
        type: 'info'
      }
    });
    window.dispatchEvent(event);
  };

  // 打开高级设置
  const openAdvancedSettings = () => {
    const event = new CustomEvent('claudia-notification', {
      detail: {
        title: '高级设置',
        message: '高级设置功能正在开发中...',
        type: 'info'
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div id="app">
      <header className="app-header">
        <h1>🚀 Claudia Ultimate</h1>
        <p>智能桌面应用 - 集成 MCP 服务器</p>
      </header>

      <main className="app-main">
        <div className="container">
          {/* MCP 服务器管理面板 */}
          <MCPServerPanel />
          
          {/* 其他功能面板 */}
          <div className="feature-panels">
            <div className="panel">
              <h3>📁 文件管理</h3>
              <p>通过 MCP 文件系统服务器管理本地文件</p>
              <button className="btn-feature" onClick={openFileManager}>
                打开文件管理器
              </button>
            </div>
            
            <div className="panel">
              <h3>🧠 内存管理</h3>
              <p>使用 MCP 内存服务器进行数据存储</p>
              <button className="btn-feature" onClick={openMemoryManager}>
                查看内存状态
              </button>
            </div>
            
            <div className="panel">
              <h3>📊 系统监控</h3>
              <p>实时监控系统状态和错误日志</p>
              <button className="btn-feature" onClick={openSystemMonitor}>
                系统监控
              </button>
            </div>
            
            <div className="panel">
              <h3>🔧 高级设置</h3>
              <p>配置服务器参数和错误处理</p>
              <button className="btn-feature" onClick={openAdvancedSettings}>
                高级设置
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 Claudia Ultimate - 基于 Model Context Protocol</p>
      </footer>

      {/* 通知系统 */}
      <NotificationSystem />
    </div>
  )
}

export default App 