import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const RULES_DIR = path.join(PROJECT_ROOT, "rules");

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
  } catch (err) {
  }
  return results;
}

export async function getReviewGuidelines() {
  const allFiles = await findMarkdownFiles(RULES_DIR);

  if (allFiles.length === 0) {
    return "Warning: No rules found in ./rules directory. Please run 'npx project-rules' to sync guidelines.";
  }

  let mainInstructions = "";
  const mainFile = allFiles.find(f => f.includes("reviewer.md") || f.includes("codestyle.md"));

  if (mainFile) {
    try {
      const content = await fs.readFile(path.join(RULES_DIR, mainFile), "utf-8");
      mainInstructions = `=== MAIN GUIDELINES (${mainFile}) ===\n${content}\n`;
    } catch (e) {
      mainInstructions = "Note: Primary guideline file could not be read.\n";
    }
  }

  return `
${mainInstructions}
=== KNOWLEDGE BASE INDEX ===
The following additional rules and standards are available:
${allFiles.map(f => `- ${f}`).join("\n")}

Use 'read_kb_file' with the path from the list above to see specific requirements.`;
}

export async function readKbFile(kbFilePath: string) {
  const safePath = kbFilePath.replace(/\.\.\//g, "");
  const fullPath = path.join(RULES_DIR, safePath);

  try {
    return await fs.readFile(fullPath, "utf-8");
  } catch (error: any) {
    return `Error reading file ${kbFilePath}: ${error.message}`;
  }
}
