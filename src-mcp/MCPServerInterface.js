// MCP Server Interface - Base class for all MCP servers
class MCPServerInterface {
  constructor(config = {}) {
    this.config = config;
    this.initialized = false;
    this.serverId = '';
    this.serverName = '';
    this.version = '1.0.0';
    this.description = '';
  }

  async initialize() {
    try {
      const handshake = await this.handshake();
      if (handshake.success) {
        this.initialized = true;
        console.log(`✅ ${this.serverName} initialized successfully`);
        return true;
      } else {
        throw new Error(handshake.error);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.serverName}:`, error.message);
      return false;
    }
  }

  async handshake() {
    throw new Error('handshake() method must be implemented by subclass');
  }

  async getCapabilities() {
    throw new Error('getCapabilities() method must be implemented by subclass');
  }

  async execute(operation, params = {}) {
    if (!this.initialized) {
      throw new Error('Server not initialized');
    }
    throw new Error('execute() method must be implemented by subclass');
  }

  async healthCheck() {
    return {
      healthy: this.initialized,
      timestamp: Date.now(),
      serverId: this.serverId,
      serverName: this.serverName
    };
  }

  async shutdown() {
    this.initialized = false;
    console.log(`🛑 ${this.serverName} shutdown complete`);
  }

  validateParams(operation, params) {
    // Basic validation - subclasses can override
    return { valid: true };
  }
}

module.exports = MCPServerInterface; 