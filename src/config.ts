import { ensureDir } from "@std/fs";
import { dirname, join } from "@std/path";
import type { RoucouleConfig } from "./types.ts";

export function getConfigPath(): string {
  if (Deno.build.os === "windows") {
    const appData = Deno.env.get("APPDATA");
    if (!appData) throw new Error("APPDATA non défini");
    return join(appData, "roucoule", "config.json");
  }
  const xdg = Deno.env.get("XDG_CONFIG_HOME");
  const base = xdg && xdg.length > 0
    ? xdg
    : join(Deno.env.get("HOME") ?? "", ".config");
  return join(base, "roucoule", "config.json");
}

export async function loadConfig(
  path: string = getConfigPath(),
): Promise<RoucouleConfig | null> {
  try {
    const raw = await Deno.readTextFile(path);
    // JSON.parse returns `any`; cast to `unknown` before narrowing
    const parsed: unknown = JSON.parse(raw) as unknown;
    if (!isValidConfig(parsed)) {
      throw new Error(`Config invalide à ${path}`);
    }
    return parsed;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return null;
    throw err;
  }
}

export async function saveConfig(
  config: RoucouleConfig,
  path: string = getConfigPath(),
): Promise<void> {
  await ensureDir(dirname(path));
  const tmp = `${path}.tmp`;
  await Deno.writeTextFile(tmp, JSON.stringify(config, null, 2));
  if (Deno.build.os !== "windows") {
    await Deno.chmod(tmp, 0o600);
  }
  await Deno.rename(tmp, path);
}

export async function configExists(
  path: string = getConfigPath(),
): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

function isValidConfig(c: unknown): c is RoucouleConfig {
  if (typeof c !== "object" || c === null) return false;
  const o = c as Record<string, unknown>;
  if (typeof o.baseUrl !== "string" || typeof o.apiToken !== "string") {
    return false;
  }
  const s = o.smtp as Record<string, unknown> | undefined;
  if (!s || typeof s !== "object") return false;
  return typeof s.host === "string" && typeof s.port === "number" &&
    typeof s.username === "string" && typeof s.password === "string";
}
