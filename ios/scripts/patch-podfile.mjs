#!/usr/bin/env node
/**
 * Patches ios/Podfile with the Xcode 26 fmt workaround if missing.
 * Re-run after `expo prebuild --clean` regenerates the native project.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const podfile = path.join(root, "..", "ios", "Podfile");
const marker = "Xcode 26 workaround";
const patch = `
    # Xcode 26+ workaround: Apple Clang rejects fmt 11.0.2 consteval (RN 0.76).
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('${marker}')
        patched = content.gsub(
          /^(#elif defined\\(__cpp_consteval\\)\\n#  define FMT_USE_CONSTEVAL) 1/,
          "// ${marker}: disable consteval\\n\\\\1 0"
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
    end`;

if (!fs.existsSync(podfile)) {
  console.error("Native Podfile not found. Run: npx expo prebuild --platform ios");
  process.exit(1);
}

let content = fs.readFileSync(podfile, "utf8");
if (!content.includes(marker)) {
  if (!content.includes("react_native_post_install")) {
    console.error("Unexpected Podfile layout; apply fmt patch manually.");
    process.exit(1);
  }
  content = content.replace(
    /(\n  end\nend\n)\s*$/,
    `${patch}\n  end\nend\n`,
  );
  if (!content.includes(marker)) {
    // Fallback: insert before final `end` of post_install
    content = content.replace(
      /(post_install do \|installer\|[\s\S]*?)(  end\nend)/,
      `$1${patch}$2`,
    );
  }
  fs.writeFileSync(podfile, content);
  console.log("Patched Podfile for Xcode 26 fmt fix.");
  execSync("pod install", { cwd: path.dirname(podfile), stdio: "inherit" });
} else {
  console.log("Podfile already includes Xcode 26 fmt fix.");
}
