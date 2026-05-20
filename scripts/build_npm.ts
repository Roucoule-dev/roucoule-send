/**
 * Build the npm package from Deno source via @deno/dnt.
 *
 * Usage:
 *   deno task build:npm [version]
 *
 * Default version: 0.0.0 (local builds). The CI publish workflow passes
 * the git tag (without the leading "v").
 */
import { build, emptyDir } from "@deno/dnt";

const version = (Deno.args[0] ?? "0.0.0").replace(/^v/, "");
const REPO_URL = "https://github.com/thomascarvalho/roucoule-send";

await emptyDir("./npm");

await build({
  entryPoints: [
    "./src/mod.ts",
    { kind: "bin", name: "roucoule-send", path: "./src/cli.ts" },
  ],
  outDir: "./npm",
  shims: { deno: true },
  package: {
    name: "@roucoule/send",
    version,
    description:
      "Open-source CLI and library to send Roucoule newsletters via your own SMTP server.",
    license: "MIT",
    repository: { type: "git", url: `git+${REPO_URL}.git` },
    bugs: { url: `${REPO_URL}/issues` },
    homepage: REPO_URL,
    keywords: ["roucoule", "newsletter", "smtp", "cli"],
    engines: { node: ">=20" },
  },
  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
  test: false,
});

console.log(`✓ npm package built in ./npm (version ${version})`);
