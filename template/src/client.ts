import { OpenAI } from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import process from "node:process";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is missing");
if (!OPENROUTER_MODEL) throw new Error("OPENROUTER_MODEL is missing");
if (!GITLAB_TOKEN) throw new Error("GITLAB_TOKEN is missing");

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "",
    "X-Title": "Reviewer AI",
  }
});

async function runReview(projectId: string, mrIid: string) {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }

  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "dist", "index.js")],
    env: env
  });

  const mcpClient = new Client({ name: "orchestrator", version: "1.0.0" }, { capabilities: {} });
  await mcpClient.connect(transport);

  const { tools } = await mcpClient.listTools();
  const openaiTools = tools.map(t => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description || "",
      parameters: t.inputSchema,
    }
  }));

  const messages: any[] = [
    {
      role: "system",
      content: `You are a Senior Reviewer. Your FINAL GOAL is to leave comments in GitLab ONLY for actual issues, bugs, or improvements.
    
    CRITICAL RULES:
    1. ONLY post a comment if you find a bug, technical debt, security risk, or violation of guidelines.
    2. NEVER post "good job", "looks fine", or "LGTM" comments. If the code is good, do not call 'post_mr_discussion' for that line.
    3. If the entire MR looks perfect and you have NO findings, simply finish by providing a brief summary in the chat content (not via tool).
    4. Use the 'newLine' parameter carefully: it must be the line number in the NEW version of the file.
    5. For 'body', use Markdown. Be concise, technical, and objective.

    PROCESS:
    1. Call 'get_review_guidelines' (Mandatory first step).
    2. Call 'get_mr_diff'. Extract 'diff_refs' and the MR Title.
    3. If MR Title has a Jira Key (e.g., ITX5OTHER-966), call 'get_jira_issue'. Compare code against Acceptance Criteria.
    4. Use 'post_mr_discussion' ONLY for specific issues found.
       - You MUST pass the 'diff_refs' object exactly as received from 'get_mr_diff'.
    
    Stop only after you have reviewed all changes and posted discussions for all identified issues.`
    },
    { role: "user", content: `Review project ${projectId}, MR ${mrIid}` }
  ];

  console.log("Starting Review Process via OpenRouter...");

  while (true) {
    const response = await openai.chat.completions.create({
      model: OPENROUTER_MODEL as string,
      messages: messages,
      tools: openaiTools,
      tool_choice: "auto",
      temperature: 0
    });

    const choice = response.choices?.[0];
    if (!choice) {
      console.log("No response from AI");
      break;
    }

    const message = choice.message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      if (message.content) console.log("Final AI Response:", message.content);
      break;
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type === "function") {
        const name = toolCall.function.name;
        let args = {};

        try {
          args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
        } catch (e) {
          console.warn(`Error parsing arguments for tool ${name}. Using empty object.`);
        }

        console.log(`Executing Tool: ${name}`);
        const toolResult = await mcpClient.callTool({ name, arguments: args });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    }
  }

  console.log("Review completed.");
  process.exit(0);
}

const [proj, mr] = process.argv.slice(2);
if (proj && mr) {
  runReview(proj, mr).catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
} else {
  console.log("Usage: npm run review -- <projectId> <mrIid>");
}
