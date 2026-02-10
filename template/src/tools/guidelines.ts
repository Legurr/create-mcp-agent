import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const RULES_DIR = path.join(PROJECT_ROOT, "rules");
const AGENTS_FILE = path.join(PROJECT_ROOT, "AGENT.md");

async function findMarkdownFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    try {
        const list = await fs.readdir(dir, { withFileTypes: true });
        for (const file of list) {
            const fullPath = path.join(dir, file.name);
            const relativePath = path.relative(RULES_DIR, fullPath).replace(/\\/g, "/");

            if (file.isDirectory()) {
                results = results.concat(await findMarkdownFiles(fullPath));
            } else if (file.name.endsWith(".md")) {
                results.push(relativePath);
            }
        }
    } catch {
    }
    return results;
}

export async function getReviewGuidelines() {
    let agentsContent = "";
    try {
        agentsContent = await fs.readFile(AGENTS_FILE, "utf-8");
    } catch {
        agentsContent = "WARNING: AGENTS.md not found. This file is mandatory.\n";
    }

    const allFiles = await findMarkdownFiles(RULES_DIR);

    return `
=== AGENTS (MANDATORY) ===
${agentsContent}

=== KNOWLEDGE BASE INDEX ===
${allFiles.length > 0 ? allFiles.map(f => `- ${f}`).join("\n") : "No rules found in ./rules directory."}

Use 'read_kb_file' with the exact path above to load specific rules.
`;
}

export async function readKbFile(kbFilePath: string) {
    if (!kbFilePath.endsWith(".md")) {
        return "Only .md files are allowed";
    }

    const safePath = kbFilePath.replace(/(\.\.(\/|\\))/g, "");
    const fullPath = path.join(RULES_DIR, safePath);

    try {
        return await fs.readFile(fullPath, "utf-8");
    } catch (error: any) {
        return `Error reading file ${kbFilePath}: ${error.message}`;
    }
}
