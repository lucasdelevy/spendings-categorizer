#!/usr/bin/env node
/**
 * Applies native build patches for Xcode 26 (fmt, expo-localization).
 * Re-run after `expo prebuild --clean` or `npm install`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const iosRoot = path.join(root, "..");

function patchExpoLocalization() {
  const swift = path.join(
    iosRoot,
    "..",
    "node_modules",
    "expo-localization",
    "ios",
    "LocalizationModule.swift",
  );
  if (!fs.existsSync(swift)) return;

  const marker = "@unknown default:";
  let content = fs.readFileSync(swift, "utf8");
  if (content.includes(marker)) {
    console.log("expo-localization already patched for iOS 26 calendars.");
    return;
  }

  const needle = `    case .iso8601:
      return "iso8601"
    }`;
  const replacement = `    case .iso8601:
      return "iso8601"
    @unknown default:
      return "iso8601"
    }`;

  if (!content.includes(needle)) {
    console.error("Unexpected LocalizationModule.swift layout; patch manually.");
    process.exit(1);
  }

  fs.writeFileSync(swift, content.replace(needle, replacement));
  console.log("Patched expo-localization for iOS 26 calendar identifiers.");
}

patchExpoLocalization();

const podfilePatch = spawnSync("node", [path.join(root, "patch-podfile.mjs")], {
  stdio: "inherit",
});
process.exit(podfilePatch.status ?? 1);
