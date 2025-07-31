// Filesystem MCP Server - Provides file system operations
const MCPServerInterface = require('./MCPServerInterface');
const fs = require('fs').promises;
const path = require('path');

class FilesystemMCPServer extends MCPServerInterface {
  constructor(config = {}) {
    super(config);
    this.serverId = 'filesystem';
    this.serverName = 'File System Server';
    this.version = '1.0.0';
    this.description = 'Provides file system operations like read, write, create, delete, and directory management';
    
    // Security: Define allowed base directories
    this.allowedPaths = config.allowedPaths || [process.cwd()];
    this.maxFileSize = config.maxFileSize || 50 * 1024 * 1024; // 50MB default
  }

  async handshake() {
    try {
      // Verify filesystem access
      await fs.access(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
      
      return {
        success: true,
        protocol: 'mcp',
        version: '1.0.0',
        serverInfo: {
          name: this.serverName,
          version: this.version,
          description: this.description,
          allowedPaths: this.allowedPaths
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Filesystem access check failed: ${error.message}`
      };
    }
  }

  async getCapabilities() {
    return {
      operations: [
        'read_file',
        'write_file', 
        'create_file',
        'delete_file',
        'create_directory',
        'delete_directory',
        'list_directory',
        'copy_file',
        'move_file',
        'get_file_stats',
        'search_files',
        'watch_file',
        'ping'
      ],
      schemas: {
        read_file: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
            encoding: { type: 'string', default: 'utf8', enum: ['utf8', 'base64', 'binary'] }
          },
          required: ['path']
        },
        write_file: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' },
            encoding: { type: 'string', default: 'utf8', enum: ['utf8', 'base64', 'binary'] },
            createDirectories: { type: 'boolean', default: true }
          },
          required: ['path', 'content']
        },
        create_directory: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to create' },
            recursive: { type: 'boolean', default: true }
          },
          required: ['path']
        },
        list_directory: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list' },
            recursive: { type: 'boolean', default: false },
            includeStats: { type: 'boolean', default: false }
          },
          required: ['path']
        }
      },
      timeout: 30000,
      maxConcurrency: 5,
      supportsBatching: true,
      metadata: {
        allowedPaths: this.allowedPaths,
        maxFileSize: this.maxFileSize
      }
    };
  }

  async execute(operation, params = {}) {
    // Validate parameters
    const validation = this.validateParams(operation, params);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.error}`);
    }

    // Security check for path access
    if (params.path) {
      this.validatePathAccess(params.path);
    }

    switch (operation) {
      case 'ping':
        return { pong: true, timestamp: Date.now(), server: this.serverId };

      case 'read_file':
        return await this.readFile(params);

      case 'write_file':
        return await this.writeFile(params);

      case 'create_file':
        return await this.createFile(params);

      case 'delete_file':
        return await this.deleteFile(params);

      case 'create_directory':
        return await this.createDirectory(params);

      case 'delete_directory':
        return await this.deleteDirectory(params);

      case 'list_directory':
        return await this.listDirectory(params);

      case 'copy_file':
        return await this.copyFile(params);

      case 'move_file':
        return await this.moveFile(params);

      case 'get_file_stats':
        return await this.getFileStats(params);

      case 'search_files':
        return await this.searchFiles(params);

      case 'watch_file':
        return await this.watchFile(params);

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async readFile(params) {
    const { path: filePath, encoding = 'utf8' } = params;
    
    try {
      const content = await fs.readFile(filePath, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        content,
        path: filePath,
        size: stats.size,
        encoding,
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  async writeFile(params) {
    const { path: filePath, content, encoding = 'utf8', createDirectories = true } = params;
    
    try {
      // Check file size
      const contentSize = Buffer.byteLength(content, encoding);
      if (contentSize > this.maxFileSize) {
        throw new Error(`File size ${contentSize} exceeds maximum ${this.maxFileSize} bytes`);
      }

      // Create directories if needed
      if (createDirectories) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(filePath, content, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        path: filePath,
        size: stats.size,
        encoding,
        created: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  async createFile(params) {
    const { path: filePath, content = '', encoding = 'utf8' } = params;
    
    try {
      // Check if file already exists
      try {
        await fs.access(filePath);
        throw new Error(`File already exists: ${filePath}`);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        // File doesn't exist, proceed with creation
      }

      return await this.writeFile({ path: filePath, content, encoding });
    } catch (error) {
      throw new Error(`Failed to create file ${filePath}: ${error.message}`);
    }
  }

  async deleteFile(params) {
    const { path: filePath } = params;
    
    try {
      await fs.unlink(filePath);
      return {
        success: true,
        path: filePath,
        deleted: true
      };
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  async createDirectory(params) {
    const { path: dirPath, recursive = true } = params;
    
    try {
      await fs.mkdir(dirPath, { recursive });
      return {
        success: true,
        path: dirPath,
        created: true
      };
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  async deleteDirectory(params) {
    const { path: dirPath, recursive = false } = params;
    
    try {
      if (recursive) {
        await fs.rmdir(dirPath, { recursive: true });
      } else {
        await fs.rmdir(dirPath);
      }
      
      return {
        success: true,
        path: dirPath,
        deleted: true
      };
    } catch (error) {
      throw new Error(`Failed to delete directory ${dirPath}: ${error.message}`);
    }
  }

  async listDirectory(params) {
    const { path: dirPath, recursive = false, includeStats = false } = params;
    
    try {
      if (recursive) {
        return await this.listDirectoryRecursive(dirPath, includeStats);
      } else {
        const items = await fs.readdir(dirPath);
        const results = [];
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const result = { name: item, path: itemPath };
          
          if (includeStats) {
            const stats = await fs.stat(itemPath);
            result.stats = {
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              size: stats.size,
              created: stats.birthtime.toISOString(),
              lastModified: stats.mtime.toISOString()
            };
          }
          
          results.push(result);
        }
        
        return {
          success: true,
          path: dirPath,
          items: results
        };
      }
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  async listDirectoryRecursive(dirPath, includeStats) {
    const results = [];
    
    async function traverse(currentPath) {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = await fs.stat(itemPath);
        
        const result = {
          name: item,
          path: itemPath,
          relativePath: path.relative(dirPath, itemPath)
        };
        
        if (includeStats) {
          result.stats = {
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            created: stats.birthtime.toISOString(),
            lastModified: stats.mtime.toISOString()
          };
        }
        
        results.push(result);
        
        if (stats.isDirectory()) {
          await traverse(itemPath);
        }
      }
    }
    
    await traverse(dirPath);
    
    return {
      success: true,
      path: dirPath,
      items: results
    };
  }

  async copyFile(params) {
    const { source, destination, overwrite = false } = params;
    
    try {
      this.validatePathAccess(source);
      this.validatePathAccess(destination);
      
      if (!overwrite) {
        try {
          await fs.access(destination);
          throw new Error(`Destination file already exists: ${destination}`);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      }
      
      await fs.copyFile(source, destination);
      const stats = await fs.stat(destination);
      
      return {
        success: true,
        source,
        destination,
        size: stats.size,
        copied: stats.mtime.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to copy file ${source} to ${destination}: ${error.message}`);
    }
  }

  async moveFile(params) {
    const { source, destination, overwrite = false } = params;
    
    try {
      await this.copyFile({ source, destination, overwrite });
      await this.deleteFile({ path: source });
      
      return {
        success: true,
        source,
        destination,
        moved: true
      };
    } catch (error) {
      throw new Error(`Failed to move file ${source} to ${destination}: ${error.message}`);
    }
  }

  async getFileStats(params) {
    const { path: filePath } = params;
    
    try {
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        path: filePath,
        stats: {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          isSymbolicLink: stats.isSymbolicLink(),
          size: stats.size,
          created: stats.birthtime.toISOString(),
          lastModified: stats.mtime.toISOString(),
          lastAccessed: stats.atime.toISOString(),
          permissions: stats.mode.toString(8)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${error.message}`);
    }
  }

  async searchFiles(params) {
    const { path: searchPath, pattern, recursive = true, contentSearch = false } = params;
    
    try {
      const results = [];
      
      async function search(currentPath) {
        const items = await fs.readdir(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stats = await fs.stat(itemPath);
          
          // Check filename match
          if (item.includes(pattern) || (pattern instanceof RegExp && pattern.test(item))) {
            results.push({
              name: item,
              path: itemPath,
              relativePath: path.relative(searchPath, itemPath),
              type: stats.isFile() ? 'file' : 'directory'
            });
          }
          
          // Content search for files
          if (contentSearch && stats.isFile() && (item.endsWith('.txt') || item.endsWith('.js') || item.endsWith('.json'))) {
            try {
              const content = await fs.readFile(itemPath, 'utf8');
              if (content.includes(pattern) || (pattern instanceof RegExp && pattern.test(content))) {
                results.push({
                  name: item,
                  path: itemPath,
                  relativePath: path.relative(searchPath, itemPath),
                  type: 'file',
                  matchType: 'content'
                });
              }
            } catch (error) {
              // Skip files that can't be read
            }
          }
          
          // Recurse into directories
          if (recursive && stats.isDirectory()) {
            await search(itemPath);
          }
        }
      }
      
      await search(searchPath);
      
      return {
        success: true,
        searchPath,
        pattern,
        results
      };
    } catch (error) {
      throw new Error(`Failed to search files in ${searchPath}: ${error.message}`);
    }
  }

  async watchFile(params) {
    const { path: filePath, events = ['change'] } = params;
    
    // Note: This is a simplified implementation
    // In a real system, you'd want to use fs.watch() and manage watchers
    try {
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        path: filePath,
        watching: true,
        events,
        currentStats: {
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Failed to watch file ${filePath}: ${error.message}`);
    }
  }

  validatePathAccess(filePath) {
    const absolutePath = path.resolve(filePath);
    
    // Check if path is within allowed directories
    const isAllowed = this.allowedPaths.some(allowedPath => {
      const absoluteAllowed = path.resolve(allowedPath);
      return absolutePath.startsWith(absoluteAllowed);
    });
    
    if (!isAllowed) {
      throw new Error(`Access denied: Path ${filePath} is outside allowed directories`);
    }
    
    return true;
  }

  validateParams(operation, params) {
    const schema = this.getOperationSchema(operation);
    if (!schema) {
      return { valid: true }; // No schema defined
    }
    
    // Basic validation - in production, use a proper JSON schema validator
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in params)) {
          return { valid: false, error: `Missing required parameter: ${required}` };
        }
      }
    }
    
    return { valid: true };
  }

  getOperationSchema(operation) {
    const capabilities = {
      operations: [
        'read_file', 'write_file', 'create_file', 'delete_file',
        'create_directory', 'delete_directory', 'list_directory',
        'copy_file', 'move_file', 'get_file_stats', 'search_files', 'watch_file', 'ping'
      ],
      schemas: {
        read_file: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
            encoding: { type: 'string', default: 'utf8', enum: ['utf8', 'base64', 'binary'] }
          },
          required: ['path']
        },
        write_file: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' },
            encoding: { type: 'string', default: 'utf8', enum: ['utf8', 'base64', 'binary'] },
            createDirectories: { type: 'boolean', default: true }
          },
          required: ['path', 'content']
        }
      }
    };
    
    return capabilities.schemas[operation] || null;
  }

  async healthCheck() {
    try {
      // Check if we can still access the current working directory
      await fs.access(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
      
      return {
        healthy: true,
        timestamp: Date.now(),
        allowedPaths: this.allowedPaths,
        workingDirectory: process.cwd()
      };
    } catch (error) {
      return {
        healthy: false,
        error: `Filesystem health check failed: ${error.message}`,
        timestamp: Date.now()
      };
    }
  }

  async shutdown() {
    // Filesystem server doesn't need special shutdown procedures
    // but we can clean up any watchers if implemented
    this.initialized = false;
    console.log('🗂️ Filesystem MCP Server shutdown complete');
  }
}

module.exports = FilesystemMCPServer; 