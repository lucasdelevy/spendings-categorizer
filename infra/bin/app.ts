import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import { SpendingsCategorizerStack } from "../lib/stack.js";

const infraDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function awsJson(args: string[]): unknown {
  const raw = execFileSync(
    "aws",
    [...args, "--region", "us-east-1", "--output", "json"],
    { encoding: "utf8" },
  );
  return JSON.parse(raw);
}

function envOf(functionName: string): Record<string, string> {
  const data = awsJson([
    "lambda",
    "get-function-configuration",
    "--function-name",
    functionName,
    "--query",
    "Environment.Variables",
  ]);
  if (!data || typeof data !== "object") {
    throw new Error(`${functionName} has no environment; aborting to avoid wiping config`);
  }
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function copyLiveLambdaEnv(): void {
  const merged = {
    ...envOf("spendings-categorizer-auth"),
    ...envOf("spendings-categorizer-pierre"),
  };
  const required = ["GOOGLE_CLIENT_ID", "JWT_SECRET", "ACCOUNT_KEY_SECRET"];
  const missing = required.filter((key) => !merged[key]);
  if (missing.length) {
    throw new Error(`live Lambda env missing ${missing.join(", ")}`);
  }
  for (const [key, value] of Object.entries(merged)) {
    if (value) process.env[key] = value;
  }
  console.log("Loaded Lambda env key names:", Object.keys(merged).sort().join(", "));
}

function ensureHttpApiRoutes(): void {
  execFileSync("python3", [path.join(infraDir, "scripts/ensure-http-api-routes.py")], {
    stdio: "inherit",
  });
}

const inCi = process.env.GITHUB_ACTIONS === "true";
try {
  copyLiveLambdaEnv();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (inCi) throw err;
  console.warn("Skipping live Lambda env copy:", message);
}

try {
  ensureHttpApiRoutes();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (inCi) throw err;
  console.warn("Skipping HTTP API route repair:", message);
}

const app = new cdk.App();

new SpendingsCategorizerStack(app, "SpendingsCategorizerStack", {
  env: {
    account: "905418115093",
    region: "us-east-1",
  },
});
