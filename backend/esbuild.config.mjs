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
  build({
    ...shared,
    entryPoints: ["src/handlers/families.ts"],
    outfile: "dist/handlers/families.mjs",
  }),
  build({
    ...shared,
    entryPoints: ["src/handlers/categories.ts"],
    outfile: "dist/handlers/categories.mjs",
  }),
  build({
    ...shared,
    entryPoints: ["src/handlers/pierre.ts"],
    outfile: "dist/handlers/pierre.mjs",
  }),
  build({
    ...shared,
    entryPoints: ["src/handlers/accounts.ts"],
    outfile: "dist/handlers/accounts.mjs",
  }),
]);

console.log("Build complete");
