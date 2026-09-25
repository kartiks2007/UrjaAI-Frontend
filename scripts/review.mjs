import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const vite = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
// An explicit local-only review build avoids dependency pre-bundling on restricted Windows hosts.
const build = spawnSync(
  process.execPath,
  [
    vite,
    "build",
    "--configLoader",
    "native",
    "--outDir",
    "review-dist",
    "--mode",
    "review",
  ],
  {
    cwd: root,
    env: { ...process.env, NODE_ENV: "development" },
    stdio: "inherit",
  },
);
if (build.status !== 0) process.exit(build.status ?? 1);
const child = spawn(
  process.execPath,
  [
    vite,
    "preview",
    "--configLoader",
    "native",
    "--outDir",
    "review-dist",
    "--host",
    "127.0.0.1",
    "--port",
    "5173",
    "--strictPort",
  ],
  { cwd: root, stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
