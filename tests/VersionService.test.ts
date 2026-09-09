import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getLatestVersion, getVersionHashes } from "#/services/VersionService";
import { cleanTmpDir, tmpDir } from "#tests/services/FileService.js";

describe("VersionService", () => {
  beforeEach(async () => {
    await cleanTmpDir();
  });

  afterEach(async () => {
    await cleanTmpDir();
  });

  describe(getLatestVersion, () => {
    it("returns 0 when directory is empty", async () => {
      expect.assertions(1);

      await expect(getLatestVersion(tmpDir)).resolves.toBe(0);
    });

    it("returns 0 when directory does not exist", async () => {
      expect.assertions(1);

      await expect(getLatestVersion(join(tmpDir, "nonexistent"))).resolves.toBe(0);
    });

    it("returns the highest version number", async () => {
      expect.assertions(1);

      await writeFile(join(tmpDir, "query_v1.json"), "{}");
      await writeFile(join(tmpDir, "query_v3.json"), "{}");

      await expect(getLatestVersion(tmpDir)).resolves.toBe(3);
    });

    it("ignores non-matching files", async () => {
      expect.assertions(1);

      await writeFile(join(tmpDir, "query_v2.json"), "{}");
      await writeFile(join(tmpDir, "entries.json"), "[]");
      await writeFile(join(tmpDir, "letters.json"), "[]");

      await expect(getLatestVersion(tmpDir)).resolves.toBe(2);
    });
  });

  describe(getVersionHashes, () => {
    it("returns empty Map when no version files exist", async () => {
      expect.assertions(1);

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.size).toBe(0);
    });

    it("loads a single version file with one resource", async () => {
      expect.assertions(3);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify({ "res.dat": { ref_a: "hash_a", ref_b: "hash_b" } }),
      );

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.size).toBe(1);
      expect(hashes.get("res.dat")?.get("ref_a")).toBe("hash_a");
      expect(hashes.get("res.dat")?.get("ref_b")).toBe("hash_b");
    });

    it("loads a single version file with multiple resources", async () => {
      expect.assertions(3);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify({
          "a.dat": { ref: "hash_a" },
          "b.dat": { ref: "hash_b" },
        }),
      );

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.size).toBe(2);
      expect(hashes.get("a.dat")?.get("ref")).toBe("hash_a");
      expect(hashes.get("b.dat")?.get("ref")).toBe("hash_b");
    });

    it("merges different resources across two versions", async () => {
      expect.assertions(3);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify({ "a.dat": { ref: "hash_a" } }),
      );

      await writeFile(
        join(tmpDir, "query_v2.json"),
        JSON.stringify({ "b.dat": { ref: "hash_b" } }),
      );

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.size).toBe(2);
      expect(hashes.get("a.dat")?.get("ref")).toBe("hash_a");
      expect(hashes.get("b.dat")?.get("ref")).toBe("hash_b");
    });

    it("same resource in two versions — v2 must overwrite v1", async () => {
      expect.assertions(3);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify({ "res.dat": { ref_a: "hash_v1" } }),
      );

      await writeFile(
        join(tmpDir, "query_v2.json"),
        JSON.stringify({ "res.dat": { ref_a: "hash_v2", ref_b: "hash_new" } }),
      );

      const hashes = await getVersionHashes(tmpDir);
      const res = hashes.get("res.dat");

      expect(res).toBeDefined();
      expect(res!.get("ref_a")).toBe("hash_v2");
      expect(res!.get("ref_b")).toBe("hash_new");
    });

    it("same resource in three versions — v3 must win", async () => {
      expect.assertions(2);

      await writeFile(join(tmpDir, "query_v1.json"), JSON.stringify({ "res.dat": { ref: "v1" } }));

      await writeFile(
        join(tmpDir, "query_v2.json"),
        JSON.stringify({ "res.dat": { ref: "v2", extra: "new" } }),
      );

      await writeFile(
        join(tmpDir, "query_v3.json"),
        JSON.stringify({ "res.dat": { ref: "v3", extra: "updated" } }),
      );

      const hashes = await getVersionHashes(tmpDir);
      const res = hashes.get("res.dat");

      expect(res!.get("ref")).toBe("v3");
      expect(res!.get("extra")).toBe("updated");
    });

    it("handles gaps in version numbers (v1 and v3, no v2)", async () => {
      expect.assertions(1);

      await writeFile(join(tmpDir, "query_v1.json"), JSON.stringify({ "res.dat": { ref: "v1" } }));

      await writeFile(join(tmpDir, "query_v3.json"), JSON.stringify({ "res.dat": { ref: "v3" } }));

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.get("res.dat")?.get("ref")).toBe("v3");
    });

    it("resource added in v2 does not exist in v1 — must appear in result", async () => {
      expect.assertions(2);

      await writeFile(join(tmpDir, "query_v1.json"), JSON.stringify({ "a.dat": { ref: "hash" } }));

      await writeFile(
        join(tmpDir, "query_v2.json"),
        JSON.stringify({
          "a.dat": { ref: "hash" },
          "b.dat": { ref: "new" },
        }),
      );

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.has("b.dat")).toBe(true);
      expect(hashes.get("b.dat")?.get("ref")).toBe("new");
    });

    it("resource present in v1 but absent in v2 — v1 data remains", async () => {
      expect.assertions(2);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify({
          "a.dat": { ref: "hash_a" },
          "b.dat": { ref: "hash_b" },
        }),
      );

      await writeFile(
        join(tmpDir, "query_v2.json"),
        JSON.stringify({ "a.dat": { ref: "hash_a_v2" } }),
      );

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.get("a.dat")?.get("ref")).toBe("hash_a_v2");
      expect(hashes.get("b.dat")?.get("ref")).toBe("hash_b");
    });

    it("empty version file does not remove resources from previous versions", async () => {
      expect.assertions(1);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify({ "res.dat": { ref: "hash" } }),
      );

      await writeFile(join(tmpDir, "query_v2.json"), JSON.stringify({}));

      const hashes = await getVersionHashes(tmpDir);

      expect(hashes.get("res.dat")?.get("ref")).toBe("hash");
    });
  });
});
