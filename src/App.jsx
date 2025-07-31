import React from 'react'

function App() {
  return (
    <div id="app">
      <header className="app-header">
        <h1>🚀 Claudia Ultimate</h1>
        <p>智能桌面应用 - 集成 MCP 服务器</p>
      </header>

      <main className="app-main">
        <div className="container">
          {/* 欢迎面板 */}
          <div className="welcome-panel">
            <h2>🎉 欢迎使用 Claudia Ultimate!</h2>
            <p>您的智能桌面应用已成功启动</p>
          </div>
          
          {/* 功能面板 */}
          <div className="feature-panels">
            <div className="panel">
              <h3>📁 文件管理</h3>
              <p>通过 MCP 文件系统服务器管理本地文件</p>
              <button className="btn-feature">打开文件管理器</button>
            </div>
            
            <div className="panel">
              <h3>🧠 内存管理</h3>
              <p>使用 MCP 内存服务器进行数据存储</p>
              <button className="btn-feature">查看内存状态</button>
            </div>
            
            <div className="panel">
              <h3>📦 Git 仓库</h3>
              <p>通过 MCP Git 服务器管理代码仓库</p>
              <button className="btn-feature">Git 操作</button>
            </div>
            
            <div className="panel">
              <h3>🌐 网络请求</h3>
              <p>使用 MCP Fetch 服务器进行网络操作</p>
              <button className="btn-feature">网络工具</button>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 Claudia Ultimate - 基于 Model Context Protocol</p>
      </footer>
    </div>
  )
}

export default App 