"use strict";

const { spawn } = require("child_process");
const { rmSync } = require("fs");
const path = require("path");

function removeStaleLock() {
  const lockPath = path.join(process.cwd(), ".next", "dev", "lock");
  try {
    rmSync(lockPath, { force: true });
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(
        `Warning: Unable to remove dev lock file at ${lockPath}:`,
        error,
      );
    }
  }
}

function resolvePort() {
  const [, , cliPort] = process.argv;
  return cliPort || process.env.PORT || process.env.NEXT_DEV_PORT || "3000";
}

function startNextDev(port) {
  const args = ["dev", "-p", port, ...process.argv.slice(3)];
  const child = spawn("next", args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

removeStaleLock();
const port = resolvePort();
console.log(`Starting Next.js dev server on port ${port}...`);
startNextDev(port);
