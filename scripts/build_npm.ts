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
const REPO_URL = "https://github.com/Roucoule-dev/roucoule-send";

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
  typeCheck: false,
  declaration: "inline",
  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");

    // dnt doesn't handle shebangs cleanly: the original shebang from cli.ts
    // (#!/usr/bin/env -S deno run -A) ends up parsed as JS expression lines
    // in the output. Strip all generated shebang artifact lines and ensure
    // the correct #!/usr/bin/env node shebang is at line 1.
    const cliPath = "npm/esm/cli.js";
    let cliContent = Deno.readTextFileSync(cliPath);
    const shebangsArtifacts = /^(#!.*|!\/usr\/bin.*|deno;|run - A;)\n/gm;
    cliContent = cliContent.replace(shebangsArtifacts, "");
    // Ensure #!/usr/bin/env node is the first line
    if (!cliContent.startsWith("#!/usr/bin/env node")) {
      cliContent = "#!/usr/bin/env node\n" + cliContent;
    }
    Deno.writeTextFileSync(cliPath, cliContent);
    Deno.chmodSync(cliPath, 0o755);
  },
  scriptModule: false,
  test: false,
  packageManager: "npm",
  filterDiagnostic(diagnostic) {
    // Skip diagnostics from shim files and missing @types for nodemailer/prompts
    const file = diagnostic.file?.fileName ?? "";
    if (file.includes("dntShim") || file.includes("/deps/")) return false;
    return true;
  },
});

console.log(`✓ npm package built in ./npm (version ${version})`);
