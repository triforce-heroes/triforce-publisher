#!/usr/bin/env node
import{program as e}from"commander";import{CompileCommand as n}from"./commands/CompileCommand.js";import{PrepareCommand as i}from"./commands/PrepareCommand.js";import{PublishCommand as o}from"./commands/PublishCommand.js";e.command("prepare").description("prepare a single language source by generating entries.json files").argument("<engine driver>",'engine driver to be used (eg. "ZTFH")').argument("<source driver>",'source driver to be used (eg. "MSBT")').argument("<files>","glob-alike files to be included").option("-t, --translate <source:target>","enable translation engine").action(i),e.command("compile").description("compile all prepared entries to a single publishable file").argument("<languages>","language folders containing entries.json at root").action(n),e.command("publish").description("publish using a single publishable file").argument("<engine>","engine name to be published on DDB").action(o),e.parse();