#!/usr/bin/env node
import { program } from "commander";

import { CompileCommand } from "./commands/CompileCommand.js";
import { PrepareCommand } from "./commands/PrepareCommand.js";
import { PublishCommand } from "./commands/PublishCommand.js";

program
  .command("prepare")
  .description(
    "prepare a single language source by generating entries.json files",
  )
  .argument("<engine driver>", 'engine driver to be used (eg. "ZTFH")')
  .argument("<source driver>", 'source driver to be used (eg. "MSBT")')
  .argument("<files>", "glob-alike files to be included")
  .action(PrepareCommand);

program
  .command("compile")
  .description("compile all prepared entries to a single publishable file")
  .argument("<engine driver>", 'engine driver to be used (eg. "ZTFH")')
  .argument("<languages>", "language folders containing entries.json at root")
  .option("-l, --letters", "extract all code points to letters.txt", false)
  .option("-u, --uniques", "extract all uniques strings to uniques.json", false)
  .option("-t, --translate <target>", "enable translation engine")
  .option("-i, --cookie-id <id>", "set Google Translate cookie ID")
  .option("-k, --concurrences <n>", "number of concurrences", Number, 1)
  .action(CompileCommand);

program
  .command("publish")
  .description("publish using a single publishable file")
  .argument("<engine>", "engine name to be published on DDB")
  .option("-d, --dry-run", "do not actually publish", false)
  .action(PublishCommand);

program.parse();
