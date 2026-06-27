import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Publisher } from "#/features/Publisher";
import { cleanTmpDir, tmpDir } from "#tests/services/FileService";

describe("Publisher", () => {
  beforeEach(() => {
    cleanTmpDir();
  });

  afterEach(() => {
    cleanTmpDir();
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
      }).toThrowError('language "pt" is already registered');
    });

    it("throws for duplicate replacement", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("ja", "jp");

      expect(() => {
        publisher.addLanguage("cn", "jp");
      }).toThrowError('language "jp" is already registered');
    });

    it("throws when replacement conflicts with existing name", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("jp");

      expect(() => {
        publisher.addLanguage("ja", "jp");
      }).toThrowError('language "jp" is already registered');
    });
  });

  describe("resolveLanguage", () => {
    it("throws for unregistered language", () => {
      const publisher = new Publisher(1);

      expect(() => publisher.resolveLanguage("unknown")).toThrowError(
        'language "unknown" is not registered',
      );
    });
  });

  describe("createResource", () => {
    it("creates a resource", () => {
      const publisher = new Publisher(1);
      const resource = publisher.createResource("example.xml");

      expect(resource).toBeDefined();
    });

    it("throws for duplicate resource name", () => {
      const publisher = new Publisher(1);
      publisher.createResource("example.xml");

      expect(() => publisher.createResource("example.xml")).toThrowError(
        'resource "example.xml" already exists',
      );
    });
  });

  describe("addReference", () => {
    it("aggregates references with different texts", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const resource = publisher.createResource("example.xml");
      resource.addReference("pt", "fruit", "banana");
      resource.addReference("en", "fruit", "maçã");

      const output = publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: {
            banana: ["pt"],
            maçã: ["en"],
          },
        },
      ]);
    });

    it("merges languages with same text", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const resource = publisher.createResource("example.xml");
      resource.addReference("pt", "fruit", "banana");
      resource.addReference("en", "fruit", "banana");

      const output = publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: {
            banana: ["pt", "en"],
          },
        },
      ]);
    });

    it("resolves language alias", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("ja", "jp");

      const resource = publisher.createResource("example.xml");
      resource.addReference("ja", "fruit", "バナナ");

      const output = publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "example.xml",
          reference: "fruit",
          sources: {
            バナナ: ["jp"],
          },
        },
      ]);
    });

    it("throws for unregistered language", () => {
      const publisher = new Publisher(1);
      const resource = publisher.createResource("example.xml");

      expect(() => {
        resource.addReference("unknown", "fruit", "banana");
      }).toThrowError('language "unknown" is not registered');
    });

    it("throws for duplicate same language, reference and text", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      const resource = publisher.createResource("example.xml");
      resource.addReference("pt", "fruit", "banana");

      expect(() => {
        resource.addReference("pt", "fruit", "banana");
      }).toThrowError(
        'duplicate reference: language "pt" already has text "banana" for reference "fruit"',
      );
    });

    it("allows same text for different references", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      const resource = publisher.createResource("example.xml");
      resource.addReference("pt", "fruit", "banana");
      resource.addReference("pt", "other", "banana");

      const output = publisher.dryRun(tmpDir);
      expect(output.entries).toHaveLength(2);
    });
  });

  describe("dryRun", () => {
    it("returns correct letters as Set<number>", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      const resource = publisher.createResource("");
      resource.addReference("en", "test", "ab");

      const output = publisher.dryRun(tmpDir);

      expect(output.letters).toStrictEqual(new Set([97, 98]));
    });

    it("returns sorted letters", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      const resource = publisher.createResource("");
      resource.addReference("en", "test", "ba");

      const output = publisher.dryRun(tmpDir);

      expect([...output.letters]).toStrictEqual([97, 98]);
    });

    it("returns unique texts as Set<string>", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const resource = publisher.createResource("");
      resource.addReference("pt", "fruit", "banana");
      resource.addReference("en", "fruit", "banana");
      resource.addReference("pt", "animal", "gato");

      const output = publisher.dryRun(tmpDir);

      expect(output.uniques).toStrictEqual(new Set(["banana", "gato"]));
    });

    it("returns entries with empty resource name", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      const resource = publisher.createResource("");
      resource.addReference("en", "hello", "world");

      const output = publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "",
          reference: "hello",
          sources: { world: ["en"] },
        },
      ]);
    });

    it("version.needed is true with entries and SQL starts with INSERT", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      const resource = publisher.createResource("");
      resource.addReference("en", "hello", "world");

      const output = publisher.dryRun(tmpDir);

      expect(output.version.needed).toBe(true);
      expect(output.version.sql).toStrictEqual(expect.stringContaining("INSERT INTO"));
      expect(output.version.json).toBeTruthy();
    });

    it("version.needed is false with no entries", () => {
      const publisher = new Publisher(1);
      const output = publisher.dryRun(tmpDir);

      expect(output.version.needed).toBe(false);
      expect(output.version.sql).toBeNull();
      expect(output.version.json).toBeNull();
    });

    it("computes currentHashes for all entries", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      const resource = publisher.createResource("test.dat");
      resource.addReference("en", "hello", "world");

      const output = publisher.dryRun(tmpDir);

      expect(output.version.hashes).toStrictEqual({
        "test.dat": {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          hello: expect.stringMatching(/^[0-9a-f]{64}$/),
        },
      });
    });

    it("multiple resources", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const res1 = publisher.createResource("a.xml");
      res1.addReference("pt", "hello", "olá");

      const res2 = publisher.createResource("b.xml");
      res2.addReference("en", "hello", "hello");

      const output = publisher.dryRun(tmpDir);

      expect(output.entries).toStrictEqual([
        {
          resource: "a.xml",
          reference: "hello",
          sources: { olá: ["pt"] },
        },
        {
          resource: "b.xml",
          reference: "hello",
          sources: { hello: ["en"] },
        },
      ]);
    });

    it("SQL contains resource and reference values", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("en");

      const resource = publisher.createResource("data.dat");
      resource.addReference("en", "dialog.IDD_EDITBOX.caption", "Edit");

      const output = publisher.dryRun(tmpDir);

      expect(output.version.sql).toStrictEqual(expect.stringContaining("data.dat"));
      expect(output.version.sql).toStrictEqual(
        expect.stringContaining("dialog.IDD_EDITBOX.caption"),
      );
    });
  });

  describe("versioning", () => {
    it("detects no changes on second dryRun with same data", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const resource = publisher.createResource("example.xml");
      resource.addReference("pt", "fruit", "banana");
      resource.addReference("en", "fruit", "banana");

      const first = publisher.dryRun(tmpDir);

      if (first.version.needed && first.version.json) {
        writeFileSync(
          join(tmpDir, "query_v1.json"),
          JSON.stringify(first.version.json, null, "\t"),
        );
      }

      const second = publisher.dryRun(tmpDir);

      expect(second.version.needed).toBe(false);
    });

    it("detects changes on second dryRun with new entry", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const resource = publisher.createResource("example.xml");
      resource.addReference("pt", "fruit", "banana");

      const first = publisher.dryRun(tmpDir);

      if (first.version.needed && first.version.json) {
        writeFileSync(
          join(tmpDir, "query_v1.json"),
          JSON.stringify(first.version.json, null, "\t"),
        );
      }

      resource.addReference("en", "fruit", "banana");

      const second = publisher.dryRun(tmpDir);

      expect(second.version.needed).toBe(true);
    });

    it("merges multiple version files", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");

      const resource = publisher.createResource("data.dat");
      resource.addReference("pt", "ref_a", "alpha");

      const v1 = publisher.dryRun(tmpDir);

      writeFileSync(join(tmpDir, "query_v1.json"), JSON.stringify(v1.version.json, null, "\t"));

      resource.addReference("pt", "ref_b", "beta");

      const v2Hashes = {
        "data.dat": {
          ref_a: v1.version.hashes["data.dat"]!["ref_a"]!,
          ref_b: "newhash",
        },
      };

      writeFileSync(join(tmpDir, "query_v2.json"), JSON.stringify(v2Hashes, null, "\t"));

      resource.addReference("pt", "ref_c", "gamma");

      const v3 = publisher.dryRun(tmpDir);

      expect(v3.version.needed).toBe(true);
      expect(v3.version.hashes["data.dat"]).toHaveProperty("ref_a");
      expect(v3.version.hashes["data.dat"]).toHaveProperty("ref_b");
      expect(v3.version.hashes["data.dat"]).toHaveProperty("ref_c");
    });

    it("SQL output matches expected structure", () => {
      const publisher = new Publisher(1);
      publisher.addLanguage("pt");
      publisher.addLanguage("en");

      const resource = publisher.createResource("test.xml");
      resource.addReference("pt", "hello", "olá");
      resource.addReference("en", "hello", "hello");

      const output = publisher.dryRun(tmpDir);

      expect(output.version.sql).toStrictEqual(
        expect.stringMatching(/^INSERT INTO `projectEntries`/),
      );
      expect(output.version.sql).toStrictEqual(expect.stringMatching(/ON CONFLICT/));
      expect(output.version.sql).toStrictEqual(expect.stringMatching(/DO UPDATE SET/));
    });
  });

  describe("seed test", () => {
    it("handles 1000 items, +200 new, +100 modified", () => {
      const publisher = new Publisher(9);
      publisher.addLanguage("en");
      publisher.addLanguage("pt");
      publisher.addLanguage("ja", "jp");

      const res1 = publisher.createResource("resource-a.dat");
      const res2 = publisher.createResource("resource-b.dat");

      for (let i = 0; i < 500; i++) {
        res1.addReference("en", `ref_${i}`, `text_en_${i}`);
        res1.addReference("pt", `ref_${i}`, `text_pt_${i}`);
      }

      for (let i = 0; i < 500; i++) {
        res2.addReference("en", `ref_${i}`, `text_en_${i}`);
        res2.addReference("ja", `ref_${i}`, `text_jp_${i}`);
      }

      const v1 = publisher.dryRun(tmpDir);

      expect(v1.entries).toHaveLength(1000);
      expect(v1.version.needed).toBe(true);
      expect(v1.version.sql).toStrictEqual(expect.stringContaining("INSERT INTO"));
      expect(v1.version.sql).toStrictEqual(expect.stringContaining("resource-a.dat"));
      expect(v1.version.sql).toStrictEqual(expect.stringContaining("resource-b.dat"));

      writeFileSync(join(tmpDir, "query_v1.json"), JSON.stringify(v1.version.json, null, "\t"));

      const res3 = publisher.createResource("resource-c.dat");

      for (let i = 0; i < 200; i++) {
        res3.addReference("en", `new_${i}`, `new_text_${i}`);
      }

      const v2 = publisher.dryRun(tmpDir);

      expect(v2.entries).toHaveLength(1200);
      expect(v2.version.needed).toBe(true);
      expect(v2.version.sql).toStrictEqual(expect.stringContaining("resource-c.dat"));
      expect(v2.version.sql).not.toStrictEqual(expect.stringContaining("resource-a.dat"));

      writeFileSync(join(tmpDir, "query_v2.json"), JSON.stringify(v2.version.json, null, "\t"));

      for (let i = 0; i < 100; i++) {
        res1.addReference("en", `ref_${i}`, `modified_en_${i}`);
      }

      const v3 = publisher.dryRun(tmpDir);

      expect(v3.version.needed).toBe(true);
      expect(v3.version.sql).toStrictEqual(expect.stringContaining("resource-a.dat"));
      expect(v3.version.sql).not.toStrictEqual(expect.stringContaining("resource-c.dat"));
    });
  });
});
