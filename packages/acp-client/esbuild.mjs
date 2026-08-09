import * as esbuild from "esbuild";

// Single-file ESM bundle with @agentclientprotocol/sdk inlined so Electron
// portable/install does not need node_modules next to resources/packages.
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/bundle.mjs",
  sourcemap: false,
  // Keep Node built-ins external; bundle all npm deps (sdk, zod, …).
  packages: "bundle",
  logLevel: "info",
});

console.log("Wrote dist/bundle.mjs (sdk bundled)");
