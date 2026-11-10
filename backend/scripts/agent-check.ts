// Prueba el loop del agente SIN Groq: un modelo falso "decide" que tools llamar.
// Sirve para verificar tools + permisos + Mongo sin gastar cuota. Correr: npm run agent:check
import "dotenv/config";
import assert from "node:assert/strict";
import { createAgent, FakeToolCallingModel } from "langchain";
import { connectMongoDB, disconnectMongoDB } from "../src/config/db.js";
import { tools } from "../src/agent/tools/index.js";
import { AgentContext, agentContextSchema } from "../src/agent/context.js";

// Corre el agente con un modelo falso que pide `toolCalls` y devuelve los textos de los ToolMessage.
async function runWithFakeModel(toolCalls: { name: string; args: Record<string, unknown> }[], context: AgentContext) {
  // Turno 1: pide las tools. Turno 2: sin tool calls → el agente termina.
  const model = new FakeToolCallingModel({ toolCalls: [toolCalls.map((c, i) => ({ ...c, id: `call_${i}` })), []] });
  const agent = createAgent({ model, tools, contextSchema: agentContextSchema });
  const { messages } = await agent.invoke({ messages: [{ role: "user", content: "check" }] }, { context });
  return messages.filter((m) => m.type === "tool").map((m) => m.text);
}

// 1. Permisos (no toca la base): un usuario comun NO puede crear ni eliminar.
const commonUser: AgentContext = { user: { id: "u1", email: "alumno@test.com", role: "user" } };
const denied = await runWithFakeModel(
  [
    { name: "create_student", args: { firstName: "Ana", lastName: "Test", email: "ana@test.com", career: "Sistemas" } },
    { name: "delete_student", args: { id: "665f1f77bcf86cd799439011" } },
  ],
  commonUser
);
assert.equal(denied.length, 2);
assert.ok(denied.every((r) => r.startsWith("Permiso denegado")), "un usuario comun no deberia poder escribir");
console.log("[agent-check] OK: un usuario comun no puede crear ni eliminar");

// 2. Lectura contra Mongo.
await connectMongoDB();
try {
  const [listResult] = await runWithFakeModel([{ name: "list_students", args: { active: true } }], commonUser);
  const payload = JSON.parse(listResult);
  assert.equal(typeof payload.total, "number");
  console.log(`[agent-check] OK: list_students devolvio ${payload.total} estudiantes activos`);

  // 3. Filtros en null: gpt-oss los manda asi cuando no los usa. Tienen que ignorarse, no romper.
  const [nullResult] = await runWithFakeModel(
    [{ name: "list_students", args: { active: null, career: null, search: null } }],
    commonUser
  );
  assert.equal(typeof JSON.parse(nullResult).total, "number", "filtros en null deberian ignorarse");
  console.log("[agent-check] OK: filtros en null se ignoran");
} finally {
  await disconnectMongoDB();
}
