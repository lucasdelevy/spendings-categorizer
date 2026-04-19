import { build } from "esbuild";

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: true,
  minify: true,
  external: ["@aws-sdk/*"],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ["src/handlers/auth.ts"],
    outfile: "dist/handlers/auth.mjs",
  }),
  build({
    ...shared,
    entryPoints: ["src/handlers/statements.ts"],
    outfile: "dist/handlers/statements.mjs",
  }),
]);

console.log("Build complete");
