import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Publisher } from "#/features/Publisher";
import { cleanTmpDir, tmpDir } from "#tests/services/FileService";

describe(Publisher, () => {
  beforeEach(async () => {
    await cleanTmpDir();
  });

  afterEach(async () => {
    await cleanTmpDir();
  });

  describe("addLanguage", () => {
    it("registers a language without replacement", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      expect(publisher.resolveLanguage("pt")).toBe("pt");
      expect(publisher.resolveLanguage("en")).toBe("en");
    });

    it("registers a language with replacement", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("ja", "jp");

      expect(publisher.resolveLanguage("ja")).toBe("jp");
      expect(publisher.resolveLanguage("jp")).toBe("jp");
    });

    it("throws for duplicate language name", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      expect(() => {
        publisher.addLanguage("pt");
      }).toThrow('language "pt" is already registered');
    });

    it("throws for duplicate replacement", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("ja", "jp");

      expect(() => {
        publisher.addLanguage("cn", "jp");
      }).toThrow('language "jp" is already registered');
    });

    it("throws when replacement conflicts with existing name", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("jp");

      expect(() => {
        publisher.addLanguage("ja", "jp");
      }).toThrow('language "jp" is already registered');
    });
  });

  describe("resolveLanguage", () => {
    it("throws for unregistered language", () => {
      const publisher = new Publisher(1);

      expect(() => publisher.resolveLanguage("unknown")).toThrow(
        'language "unknown" is not registered',
      );
    });
  });

  describe("addReference", () => {
    it("aggregates references with different texts", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "example.xml", "fruit", "banana");
      publisher.addReference("en", "example.xml", "fruit", "maçã");

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: {
            banana: ["pt"],
            maçã: ["en"],
          },
          metadata: undefined,
        },
      ]);
    });

    it("merges languages with same text", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "example.xml", "fruit", "banana");
      publisher.addReference("en", "example.xml", "fruit", "banana");

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: {
            banana: ["pt", "en"],
          },
          metadata: undefined,
        },
      ]);
    });

    it("resolves language alias", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("ja", "jp");

      publisher.addReference("ja", "example.xml", "fruit", "バナナ");

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: {
            バナナ: ["jp"],
          },
          metadata: undefined,
        },
      ]);
    });

    it("throws for unregistered language", () => {
      const publisher = new Publisher(1);

      expect(() => {
        publisher.addReference("unknown", "example.xml", "fruit", "banana");
      }).toThrow('language "unknown" is not registered');
    });

    it("throws for duplicate same language, resource, reference and text", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      publisher.addReference("pt", "example.xml", "fruit", "banana");

      expect(() => {
        publisher.addReference("pt", "example.xml", "fruit", "banana");
      }).toThrow(
        'duplicate reference: language "pt" already has text "banana" for reference "fruit"',
      );
    });

    it("allows same text for different references", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      publisher.addReference("pt", "example.xml", "fruit", "banana");
      publisher.addReference("pt", "example.xml", "other", "banana");

      const output = await publisher.dryRun(tmpDir);
      expect(output.entries).toHaveLength(2);
    });
  });

  describe("metadata", () => {
    it("stores metadata in entries and SQL as JSON", async () => {
      expect.assertions(3);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "data.dat", "hello", "world", { level: 5 });

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "data.dat",
          reference: "hello",
          sources: { world: ["en"] },
          metadata: { level: 5 },
        },
      ]);
      expect(output.version.sql).toStrictEqual(expect.stringContaining("'{\"level\":5}'"));
      expect(output.version.sql).toStrictEqual(expect.stringContaining("JSON_PATCH"));
    });

    it("uses the last metadata value without merging", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "example.xml", "fruit", "banana", { a: 1 });
      publisher.addReference("en", "example.xml", "fruit", "banana", { b: 2 });

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: { banana: ["pt", "en"] },
          metadata: { b: 2 },
        },
      ]);
    });

    it("treats empty metadata as absent with NULL column", async () => {
      expect.assertions(2);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "", "hello", "world", {});

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "",
          reference: "hello",
          sources: { world: ["en"] },
          metadata: undefined,
        },
      ]);
      expect(output.version.sql).toStrictEqual(expect.stringContaining("', NULL,"));
    });

    it("throws for non-object metadata", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      expect(() => {
        publisher.addReference(
          "en",
          "",
          "hello",
          "world",
          [] as unknown as Record<string, unknown>,
        );
      }).toThrow("metadata must be an object");
    });

    it("detects metadata change as a new version", async () => {
      expect.assertions(3);

      const firstPublisher = new Publisher(1);
      firstPublisher.addLanguage("en");
      firstPublisher.addReference("en", "data.dat", "hello", "world");

      const first = await firstPublisher.dryRun(tmpDir);

      expect(first.version.needed).toBe(true);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify(first.version.json, null, "\t"),
      );

      const secondPublisher = new Publisher(1);
      secondPublisher.addLanguage("en");
      secondPublisher.addReference("en", "data.dat", "hello", "world", { level: 5 });

      const second = await secondPublisher.dryRun(tmpDir);

      expect(second.version.needed).toBe(true);
      expect(second.version.sql).toStrictEqual(expect.stringContaining("'{\"level\":5}'"));
    });
  });

  describe("dryRun", () => {
    it("returns correct letters as Set<number>", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "", "test", "ab");

      const output = await publisher.dryRun(tmpDir);

      expect(output.letters).toStrictEqual(new Set([97, 98]));
    });

    it("returns sorted letters", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "", "test", "ba");

      const output = await publisher.dryRun(tmpDir);

      expect([...output.letters]).toStrictEqual([97, 98]);
    });

    it("returns unique texts as Set<string>", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "", "fruit", "banana");
      publisher.addReference("en", "", "fruit", "banana");
      publisher.addReference("pt", "", "animal", "gato");

      const output = await publisher.dryRun(tmpDir);

      expect(output.uniques).toStrictEqual(new Set(["banana", "gato"]));
    });

    it("returns entries with empty resource name", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "", "hello", "world");

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "",
          reference: "hello",
          sources: { world: ["en"] },
          metadata: undefined,
        },
      ]);
    });

    it("version.needed is true with entries and SQL starts with INSERT", async () => {
      expect.assertions(3);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "", "hello", "world");

      const output = await publisher.dryRun(tmpDir);

      expect(output.version.needed).toBe(true);
      expect(output.version.sql).toStrictEqual(expect.stringContaining("INSERT INTO"));
      expect(output.version.json).not.toBeNull();
    });

    it("version.needed is false with no entries", async () => {
      expect.assertions(3);

      const publisher = new Publisher(1);
      const output = await publisher.dryRun(tmpDir);

      expect(output.version.needed).toBe(false);
      expect(output.version.sql).toBeNull();
      expect(output.version.json).toBeNull();
    });

    it("computes hashes for all entries", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "test.dat", "hello", "world");

      const output = await publisher.dryRun(tmpDir);

      expect(output.version.hashes).toStrictEqual({
        "test.dat": {
          // oxlint-disable-next-line typescript/no-unsafe-assignment
          hello: expect.stringMatching(/^[0-9a-f]{64}$/v),
        },
      });
    });

    it("multiple resources", async () => {
      expect.assertions(1);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "a.xml", "hello", "olá");
      publisher.addReference("en", "b.xml", "hello", "hello");

      const output = await publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "a.xml",
          reference: "hello",
          sources: { olá: ["pt"] },
          metadata: undefined,
        },
        {
          resource: "b.xml",
          reference: "hello",
          sources: { hello: ["en"] },
          metadata: undefined,
        },
      ]);
    });

    it("SQL contains resource and reference values", async () => {
      expect.assertions(2);

      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      publisher.addReference("en", "data.dat", "dialog.IDD_EDITBOX.caption", "Edit");

      const output = await publisher.dryRun(tmpDir);

      expect(output.version.sql).toStrictEqual(expect.stringContaining("data.dat"));
      expect(output.version.sql).toStrictEqual(
        expect.stringContaining("dialog.IDD_EDITBOX.caption"),
      );
    });
  });

  describe("versioning", () => {
    it("detects no changes on second dryRun with same data", async () => {
      expect.assertions(3);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "example.xml", "fruit", "banana");
      publisher.addReference("en", "example.xml", "fruit", "banana");

      const first = await publisher.dryRun(tmpDir);

      expect(first.version.needed).toBe(true);
      expect(first.version.json).not.toBeNull();

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify(first.version.json, null, "\t"),
      );

      const second = await publisher.dryRun(tmpDir);

      expect(second.version.needed).toBe(false);
    });

    it("detects changes on second dryRun with new entry", async () => {
      expect.assertions(3);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "example.xml", "fruit", "banana");

      const first = await publisher.dryRun(tmpDir);

      expect(first.version.needed).toBe(true);
      expect(first.version.json).not.toBeNull();

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify(first.version.json, null, "\t"),
      );

      publisher.addReference("en", "example.xml", "fruit", "banana");

      const second = await publisher.dryRun(tmpDir);

      expect(second.version.needed).toBe(true);
    });

    it("merges multiple version files", async () => {
      expect.assertions(4);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      publisher.addReference("pt", "data.dat", "ref_a", "alpha");

      const first = await publisher.dryRun(tmpDir);

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify(first.version.json, null, "\t"),
      );

      publisher.addReference("pt", "data.dat", "ref_b", "beta");

      const secondHashes = {
        "data.dat": {
          ref_a: first.version.hashes["data.dat"]!["ref_a"]!,
          ref_b: "newhash",
        },
      };

      await writeFile(join(tmpDir, "query_v2.json"), JSON.stringify(secondHashes, null, "\t"));

      publisher.addReference("pt", "data.dat", "ref_c", "gamma");

      const third = await publisher.dryRun(tmpDir);

      expect(third.version.needed).toBe(true);
      expect(third.version.hashes["data.dat"]).toHaveProperty("ref_a");
      expect(third.version.hashes["data.dat"]).toHaveProperty("ref_b");
      expect(third.version.hashes["data.dat"]).toHaveProperty("ref_c");
    });

    it("SQL output matches expected structure", async () => {
      expect.assertions(3);

      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      publisher.addReference("pt", "test.xml", "hello", "olá");
      publisher.addReference("en", "test.xml", "hello", "hello");

      const output = await publisher.dryRun(tmpDir);

      expect(output.version.sql).toStrictEqual(
        expect.stringMatching(/^INSERT INTO `projectEntries`/v),
      );
      expect(output.version.sql).toStrictEqual(expect.stringMatching(/ON CONFLICT/v));
      expect(output.version.sql).toStrictEqual(expect.stringMatching(/DO UPDATE SET/v));
    });
  });

  describe("seed test", () => {
    it("handles 1000 items, +200 new, +100 modified", async () => {
      expect.assertions(12);

      const publisher = new Publisher(9);
      publisher.addLanguage("en");
      publisher.addLanguage("pt");
      publisher.addLanguage("ja", "jp");

      for (let i = 0; i < 500; i++) {
        publisher.addReference("en", "resource-a.dat", `ref_${i}`, `text_en_${i}`);
        publisher.addReference("pt", "resource-a.dat", `ref_${i}`, `text_pt_${i}`);
      }

      for (let i = 0; i < 500; i++) {
        publisher.addReference("en", "resource-b.dat", `ref_${i}`, `text_en_${i}`);
        publisher.addReference("ja", "resource-b.dat", `ref_${i}`, `text_jp_${i}`);
      }

      const first = await publisher.dryRun(tmpDir);

      expect(first.entries).toHaveLength(1000);
      expect(first.version.needed).toBe(true);
      expect(first.version.sql).toStrictEqual(expect.stringContaining("INSERT INTO"));
      expect(first.version.sql).toStrictEqual(expect.stringContaining("resource-a.dat"));
      expect(first.version.sql).toStrictEqual(expect.stringContaining("resource-b.dat"));

      await writeFile(
        join(tmpDir, "query_v1.json"),
        JSON.stringify(first.version.json, null, "\t"),
      );

      for (let i = 0; i < 200; i++) {
        publisher.addReference("en", "resource-c.dat", `new_${i}`, `new_text_${i}`);
      }

      const second = await publisher.dryRun(tmpDir);

      expect(second.entries).toHaveLength(1200);
      expect(second.version.needed).toBe(true);
      expect(second.version.sql).toStrictEqual(expect.stringContaining("resource-c.dat"));
      expect(second.version.sql).not.toStrictEqual(expect.stringContaining("resource-a.dat"));

      await writeFile(
        join(tmpDir, "query_v2.json"),
        JSON.stringify(second.version.json, null, "\t"),
      );

      for (let i = 0; i < 100; i++) {
        publisher.addReference("en", "resource-a.dat", `ref_${i}`, `modified_en_${i}`);
      }

      const third = await publisher.dryRun(tmpDir);

      expect(third.version.needed).toBe(true);
      expect(third.version.sql).toStrictEqual(expect.stringContaining("resource-a.dat"));
      expect(third.version.sql).not.toStrictEqual(expect.stringContaining("resource-c.dat"));
    });
  });
});
