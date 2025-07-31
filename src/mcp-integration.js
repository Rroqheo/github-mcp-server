// 高级 MCP 服务器集成模块
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler } from './utils/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AdvancedMCPServerManager {
  constructor() {
    this.servers = new Map();
    this.basePath = join(__dirname, '../src-mcp');
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    };
    this.healthCheckInterval = 30000; // 30秒
    this.healthCheckTimer = null;
  }

  // 智能启动文件系统服务器
  async startFilesystemServer() {
    return this.startServerWithRetry('filesystem', async () => {
      try {
        const serverPath = join(this.basePath, 'FilesystemMCPServer.js');
        const server = spawn('node', [serverPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.basePath,
          env: { ...process.env, NODE_ENV: 'production' }
        });

        return this.setupServerProcess(server, 'File System Server', 'filesystem');
      } catch (error) {
        throw new Error(`启动文件系统服务器失败: ${error.message}`);
      }
    });
  }

  // 智能启动内存服务器
  async startMemoryServer() {
    return this.startServerWithRetry('memory', async () => {
      try {
        const serverPath = join(this.basePath, 'memory/index.ts');
        const server = spawn('npx', ['tsx', serverPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.basePath,
          env: { ...process.env, NODE_ENV: 'production' }
        });

        return this.setupServerProcess(server, 'Memory Server', 'memory');
      } catch (error) {
        throw new Error(`启动内存服务器失败: ${error.message}`);
      }
    });
  }

  // 带重试机制的服务器启动
  async startServerWithRetry(serverId, startFunction) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await startFunction();
        
        // 验证服务器是否真正启动
        await this.validateServerStartup(serverId);
        
        this.emitServerEvent(serverId, 'started', `服务器启动成功 (尝试 ${attempt})`);
        return result;
        
      } catch (error) {
        lastError = error;
        
        this.emitServerEvent(serverId, 'error', `启动失败 (尝试 ${attempt}/${this.retryConfig.maxRetries}): ${error.message}`);
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
          await this.sleep(delay);
        }
      }
    }
    
    // 所有重试都失败了
    const errorResult = errorHandler.handleMCPServerError(lastError, serverId, 'start');
    this.emitServerEvent(serverId, 'failed', `启动失败，已重试 ${this.retryConfig.maxRetries} 次`);
    
    throw new Error(`服务器启动失败: ${lastError.message}`);
  }

  // 设置服务器进程
  setupServerProcess(server, name, serverId) {
    server.stdout.on('data', (data) => {
      const message = data.toString().trim();
      console.log(`🗂️ ${name}:`, message);
      
      // 检测启动成功消息
      if (message.includes('initialized') || message.includes('ready')) {
        this.emitServerEvent(serverId, 'ready', '服务器已就绪');
      }
    });

    server.stderr.on('data', (data) => {
      const message = data.toString().trim();
      console.error(`🗂️ ${name} Error:`, message);
      
      // 处理错误
      if (message.includes('error') || message.includes('failed')) {
        this.emitServerEvent(serverId, 'error', message);
      }
    });

    server.on('close', (code) => {
      console.log(`🗂️ ${name} exited with code ${code}`);
      this.handleServerShutdown(serverId, code);
    });

    server.on('error', (error) => {
      console.error(`🗂️ ${name} process error:`, error);
      this.handleServerError(serverId, error);
    });

    this.servers.set(serverId, {
      process: server,
      name: name,
      status: 'starting',
      startTime: Date.now(),
      restartCount: 0,
      lastHealthCheck: Date.now()
    });

    console.log(`✅ ${name} 进程已创建`);
    return true;
  }

  // 验证服务器启动
  async validateServerStartup(serverId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('服务器启动超时'));
      }, 10000); // 10秒超时

      const checkInterval = setInterval(() => {
        const server = this.servers.get(serverId);
        if (server && server.status === 'running') {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 500);

      // 监听服务器就绪事件
      const handleReady = () => {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve(true);
      };

      window.addEventListener('mcp-server-ready', handleReady, { once: true });
    });
  }

  // 启动所有服务器
  async startAllServers() {
    console.log('🚀 启动所有 MCP 服务器...');
    
    const results = await Promise.allSettled([
      this.startFilesystemServer(),
      this.startMemoryServer()
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failedCount = results.length - successCount;
    
    console.log(`✅ 成功启动 ${successCount} 个服务器`);
    if (failedCount > 0) {
      console.warn(`⚠️ ${failedCount} 个服务器启动失败`);
    }
    
    // 启动健康检查
    this.startHealthCheck();
    
    return { successCount, failedCount, results };
  }

  // 停止所有服务器
  async stopAllServers() {
    console.log('🛑 停止所有 MCP 服务器...');
    
    // 停止健康检查
    this.stopHealthCheck();
    
    const stopPromises = Array.from(this.servers.values()).map(server => {
      return this.stopServerGracefully(server);
    });

    await Promise.all(stopPromises);
    this.servers.clear();
    console.log('✅ 所有服务器已停止');
  }

  // 优雅停止服务器
  async stopServerGracefully(server) {
    try {
      server.status = 'stopping';
      console.log(`🛑 正在停止 ${server.name}...`);
      
      // 发送SIGTERM信号
      server.process.kill('SIGTERM');
      
      // 等待进程结束
      await new Promise((resolve) => {
        server.process.on('close', () => {
          server.status = 'stopped';
          resolve();
        });
        
        // 如果5秒后还没结束，强制终止
        setTimeout(() => {
          if (server.status === 'stopping') {
            server.process.kill('SIGKILL');
          }
        }, 5000);
      });
      
      console.log(`✅ ${server.name} 已停止`);
    } catch (error) {
      console.error(`❌ 停止 ${server.name} 失败:`, error);
    }
  }

  // 处理服务器关闭
  handleServerShutdown(serverId, code) {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = 'stopped';
      this.emitServerEvent(serverId, 'stopped', `服务器已停止 (退出码: ${code})`);
      this.servers.delete(serverId);
    }
  }

  // 处理服务器错误
  handleServerError(serverId, error) {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = 'error';
      this.emitServerEvent(serverId, 'error', `服务器错误: ${error.message}`);
      
      // 自动重启逻辑
      if (server.restartCount < 3) {
        setTimeout(() => {
          this.autoRestartServer(serverId);
        }, 5000);
      }
    }
  }

  // 自动重启服务器
  async autoRestartServer(serverId) {
    const server = this.servers.get(serverId);
    if (server && server.status === 'error') {
      server.restartCount++;
      console.log(`🔄 自动重启 ${server.name} (第 ${server.restartCount} 次)`);
      
      try {
        if (serverId === 'filesystem') {
          await this.startFilesystemServer();
        } else if (serverId === 'memory') {
          await this.startMemoryServer();
        }
      } catch (error) {
        console.error(`❌ 自动重启 ${server.name} 失败:`, error);
      }
    }
  }

  // 启动健康检查
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  // 停止健康检查
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // 执行健康检查
  async performHealthCheck() {
    for (const [serverId, server] of this.servers) {
      try {
        const isAlive = !server.process.killed;
        server.lastHealthCheck = Date.now();
        
        if (!isAlive && server.status === 'running') {
          server.status = 'dead';
          this.emitServerEvent(serverId, 'dead', '服务器进程已死亡');
          
          // 尝试重启
          if (server.restartCount < 3) {
            this.autoRestartServer(serverId);
          }
        }
      } catch (error) {
        console.error(`健康检查失败 (${serverId}):`, error);
      }
    }
  }

  // 获取服务器状态
  getServerStatus() {
    const status = {};
    for (const [id, server] of this.servers) {
      status[id] = {
        name: server.name,
        status: server.status,
        uptime: Date.now() - server.startTime,
        pid: server.process.pid,
        restartCount: server.restartCount,
        lastHealthCheck: server.lastHealthCheck
      };
    }
    return status;
  }

  // 健康检查
  async healthCheck() {
    const results = {};
    for (const [id, server] of this.servers) {
      const isAlive = !server.process.killed;
      results[id] = {
        name: server.name,
        status: server.status,
        alive: isAlive,
        uptime: Date.now() - server.startTime,
        restartCount: server.restartCount,
        lastHealthCheck: server.lastHealthCheck
      };
    }
    return results;
  }

  // 发送服务器事件
  emitServerEvent(serverId, type, message) {
    const event = new CustomEvent('mcp-server-event', {
      detail: {
        serverId,
        type,
        message,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  // 工具函数：延时
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建高级MCP服务器管理器实例
export const mcpManager = new AdvancedMCPServerManager();

// 初始化 MCP 服务器
export async function initializeMCPServers() {
  try {
    console.log('🔧 初始化高级 MCP 服务器...');
    const result = await mcpManager.startAllServers();
    
    if (result.successCount > 0) {
      console.log(`✅ MCP 服务器初始化完成，${result.successCount} 个服务器运行中`);
      return true;
    } else {
      console.warn('⚠️ 没有服务器成功启动');
      return false;
    }
  } catch (error) {
    console.error('❌ MCP 服务器初始化失败:', error);
    return false;
  }
}

// 清理 MCP 服务器
export function cleanupMCPServers() {
  console.log('🧹 清理 MCP 服务器...');
  return mcpManager.stopAllServers();
}

// 导出服务器管理器实例
export default mcpManager; 