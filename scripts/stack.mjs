#!/usr/bin/env node
/**
 * Runs the managa server and dashboard together.
 *
 *   node scripts/stack.mjs dev    # nest --watch + next dev
 *   node scripts/stack.mjs start  # production builds
 */
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const mode = process.argv[2] === "start" ? "start" : "dev";
const root = path.resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const tasks = [
  {
    name: "server",
    color: "\x1b[35m",
    cwd: path.join(root, "managa-server"),
    args: ["run", mode === "dev" ? "start:dev" : "start:prod"],
  },
  {
    name: "client",
    color: "\x1b[36m",
    cwd: path.join(root, "managa-client"),
    args: ["run", mode === "dev" ? "dev" : "start"],
  },
];

const children = [];
let shuttingDown = false;
let exitCode = 0;

function prefix(task) {
  return `${task.color}[${task.name}]\x1b[0m `;
}

function pipeLines(task, stream, target) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) target.write(prefix(task) + line + "\n");
  });
  stream.on("end", () => {
    if (buffer) target.write(prefix(task) + buffer + "\n");
  });
}

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nStopping managa ${mode} stack…`);
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  const timer = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
    process.exit(exitCode || 1);
  }, 8000);
  timer.unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

for (const task of tasks) {
  const child = spawn(npm, task.args, {
    cwd: task.cwd,
    env: { ...process.env, FORCE_COLOR: "1" },
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.push(child);
  pipeLines(task, child.stdout, process.stdout);
  pipeLines(task, child.stderr, process.stderr);

  child.on("error", (error) => {
    console.error(prefix(task) + `failed to start: ${error.message}`);
    exitCode = 1;
    shutdown();
  });

  child.on("exit", (code) => {
    if (shuttingDown) return;
    const label = code === 0 ? "exited" : `exited with code ${code}`;
    console.error(prefix(task) + label);
    exitCode = code && code !== 0 ? code : 1;
    shutdown();
  });
}

console.log(`managa ${mode} stack starting…`);
console.log("  dashboard   http://localhost:3000");
console.log("  control API http://localhost:5100");
console.log("  API docs    http://localhost:5100/docs");
