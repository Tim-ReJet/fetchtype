import { describe, expect, it } from 'vitest';

import { createMcpServer } from './mcp.js';

describe('MCP server', () => {
  it('creates a server without errors', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
  });

  it('registers all 5 tools', async () => {
    const server = createMcpServer();

    // The McpServer stores tools in _registeredTools as a plain object
    const registeredTools = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools;
    const toolNames = Object.keys(registeredTools);

    expect(toolNames).toContain('fetchtype_validate');
    expect(toolNames).toContain('fetchtype_build');
    expect(toolNames).toContain('fetchtype_suggest');
    expect(toolNames).toContain('fetchtype_init');
    expect(toolNames).toContain('fetchtype_presets');
    expect(toolNames).toHaveLength(5);
  });
});
