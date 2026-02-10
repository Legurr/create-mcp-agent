import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getReviewGuidelines, readKbFile } from "./tools/guidelines.js";
import { getMrDiff, postMrDiscussion } from "./tools/gitlab.js";
import { getJiraTicket } from "./tools/jira.js";
import 'dotenv/config';import 'dotenv/config';

let lastCachedDiffRefs: any = null;

const server = new McpServer({
  name: "omn-reviewer",
  version: "1.0.0",
});

server.tool(
  "get_review_guidelines",
  "Retrieve global project rules and knowledge base index. Should be called first.",
  {},
  async () => {
    return {
      content: [{ type: "text", text: await getReviewGuidelines() }]
    };
  }
);

server.tool(
  "read_kb_file",
  "Read a specific file from the Knowledge Base.",
  {
    kbFilePath: z.string().describe("Path to the file from the index.")
  },
  async ({ kbFilePath }) => {
    return {
      content: [{ type: "text", text: await readKbFile(kbFilePath) }]
    };
  }
);

server.tool(
  "get_mr_diff",
  "Fetch changes (diff) from GitLab MR. Returns MR title, changes list and diff_refs.",
  {
    projectId: z.string().describe("GitLab Project ID"),
    mrIid: z.string().describe("Merge Request IID")
  },
  async ({ projectId, mrIid }) => {
    const mrData = await getMrDiff(projectId, mrIid);

    if (mrData && mrData.diff_refs) {
      lastCachedDiffRefs = mrData.diff_refs;
    }

    return {
      content: [{ type: "text", text: JSON.stringify(mrData) }]
    };
  }
);

server.tool(
  "post_mr_discussion",
  "Post a targeted discussion/comment on a specific line of code.",
  {
    projectId: z.string(),
    mrIid: z.string(),
    body: z.string().describe("The text of your review comment."),
    path: z.string().describe("The file path (new_path from the diff)."),
    newLine: z.number().describe("The line number in the NEW version of the file."),
    diffRefs: z.any().describe("The diff_refs object obtained from get_mr_diff response.")
  },
  async ({ projectId, mrIid, body, path, newLine, diffRefs }) => {
    let finalDiffRefs = diffRefs;

    if (!finalDiffRefs || typeof finalDiffRefs === 'string' || Object.keys(finalDiffRefs).length === 0) {
      if (lastCachedDiffRefs) {
        console.log(`🤖 AI sent invalid diffRefs. Using cached version for ${path}`);
        finalDiffRefs = lastCachedDiffRefs;
      }
    }

    await postMrDiscussion(projectId, mrIid, body, path, newLine, finalDiffRefs);
    return {
      content: [{ type: "text", text: "Discussion posted successfully" }]
    };
  }
);

server.tool(
  "get_jira_issue",
  "Fetch details (summary, description) of a Jira ticket. Use this if you see a ticket ID (e.g. PROJ-123) in the MR title.",
  {
    issueKey: z.string().describe("The Jira Ticket Key (e.g. OMN-512)")
  },
  async ({ issueKey }) => {
    const ticketInfo = await getJiraTicket(issueKey);
    return {
      content: [{ type: "text", text: ticketInfo }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
