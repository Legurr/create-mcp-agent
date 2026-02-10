#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, "template");
const TARGET_DIR = path.join(process.cwd(), "mcp-agent");

function copyDirRecursive(src: string, dest: string) {
    fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (["node_modules", ".git", "dist", ".env.example"].includes(entry.name)) continue;

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function main() {
    console.log("\nInitializing MCP Agent...");

    if (!fs.existsSync(TEMPLATE_DIR)) {
        console.error(`Template directory not found at: ${TEMPLATE_DIR}`);
        process.exit(1);
    }

    if (fs.existsSync(TARGET_DIR)) {
        console.error(`Error: Directory "mcp-agent" already exists here.`);
        process.exit(1);
    }

    console.log(`Creating new agent in: ${TARGET_DIR}`);

    copyDirRecursive(TEMPLATE_DIR, TARGET_DIR);

    const envExample = path.join(TEMPLATE_DIR, ".env.example");
    const envTarget = path.join(TARGET_DIR, ".env");
    fs.copyFileSync(envExample, envTarget);

    console.log("Created .env file");
    console.log("\nDone! Your agent is ready.");
    console.log(`\nNext steps:\n  cd mcp-agent\n  npm install\n  npm run build\n`);
}

main();
