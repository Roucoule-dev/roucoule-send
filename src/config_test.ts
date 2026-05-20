import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { configExists, loadConfig, saveConfig } from "./config.ts";
import type { RoucouleConfig } from "./types.ts";

const VALID_CONFIG: RoucouleConfig = {
  baseUrl: "https://app.roucoule.com",
  apiToken: "rcl_test_token",
  smtp: {
    host: "smtp.example.com",
    port: 587,
    username: "user@example.com",
    password: "s3cr3t",
  },
};

// ---------------------------------------------------------------------------
// Test A — save→load roundtrip returns deep-equal object
// ---------------------------------------------------------------------------
Deno.test("config: save→load roundtrip", async () => {
  const tmpDir = await Deno.makeTempDir();
  const path = join(tmpDir, "roucoule", "config.json");
  try {
    await saveConfig(VALID_CONFIG, path);
    const loaded = await loadConfig(path);
    assertEquals(loaded, VALID_CONFIG);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// Test B — loadConfig returns null when file is absent
// ---------------------------------------------------------------------------
Deno.test("config: loadConfig returns null for missing file", async () => {
  const tmpDir = await Deno.makeTempDir();
  const path = join(tmpDir, "does-not-exist", "config.json");
  try {
    const result = await loadConfig(path);
    assertEquals(result, null);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// Test C — configExists reflects file presence
// ---------------------------------------------------------------------------
Deno.test("config: configExists false before save, true after", async () => {
  const tmpDir = await Deno.makeTempDir();
  const path = join(tmpDir, "roucoule", "config.json");
  try {
    assertEquals(await configExists(path), false);
    await saveConfig(VALID_CONFIG, path);
    assertEquals(await configExists(path), true);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// Test D — saved file has mode 0600 (non-Windows only)
// ---------------------------------------------------------------------------
Deno.test("config: saved file has mode 0600", async () => {
  if (Deno.build.os === "windows") return;

  const tmpDir = await Deno.makeTempDir();
  const path = join(tmpDir, "roucoule", "config.json");
  try {
    await saveConfig(VALID_CONFIG, path);
    const info = await Deno.stat(path);
    // info.mode is nullable; on Unix it is always set for local files
    const mode = (info.mode ?? 0) & 0o777;
    assertEquals(mode, 0o600);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});
