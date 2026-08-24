// Factory del servidor MCP: registra solo las tools que el rol del actor permite
// (tools/list). El chequeo real de seguridad vuelve a correr en cada tools/call,
// dentro del service via assertCan() — el filtrado de aca es UX, no es la garantia.
import { McpServer, CallToolResult } from "@modelcontextprotocol/server";
import { ActorContext, runWithActor } from "../core/context";
import { can } from "../auth/policy";
import { describeError } from "../core/errors";
import { studentTools, McpToolDef } from "./tools/students.tools";

const ALL_TOOLS: McpToolDef[] = [...studentTools];

async function invokeTool(
  actor: ActorContext,
  tool: McpToolDef,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const result = await runWithActor(actor, () => tool.handler(args));
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    const described = describeError(error);
    if (described) {
      return { content: [{ type: "text", text: described.message }], isError: true };
    }

    console.error(`[mcp] error inesperado en tool ${tool.name}:`, error);
    return { content: [{ type: "text", text: "Error interno" }], isError: true };
  }
}

export function createMcpServer(actor: ActorContext): McpServer {
  const server = new McpServer({ name: "daw-students", version: "1.0.0" });

  for (const tool of ALL_TOOLS) {
    if (!can(actor.role, tool.action)) continue;

    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations },
      (args: Record<string, unknown>) => invokeTool(actor, tool, args)
    );
  }

  return server;
}
