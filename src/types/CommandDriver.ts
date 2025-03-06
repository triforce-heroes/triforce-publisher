import { DropCommandDriver } from "./DropCommandDriver.js";

function fromReplaceCommands(_: string, match: string) {
  return `<${match}>`;
}

export class CommandDriver {
  public constructor(
    public name: string,
    public toTranslator: (message: string) => string,
    public fromTranslator: (message: string) => string,
  ) {}
}

export function toReplaceCommands(
  message: string,
  pattern: (index: number) => string,
) {
  return message.replaceAll(/<(?<command>\d+)>/g, (_, match: string) =>
    pattern(Number(match)),
  );
}

export const commandDrivers = [
  new CommandDriver(
    "default",
    (message) => toReplaceCommands(message, (index) => ` <${String(index)}> `),
    (message) =>
      message.replaceAll(/\s*<\s*(?<command>\d+)\s*>\s*/g, fromReplaceCommands),
  ),
  new CommandDriver(
    "hashtag",
    (message) => toReplaceCommands(message, (index) => ` #${String(index)} `),
    (message) =>
      message.replaceAll(
        /\s*(?:#|n\s*º)\s*(?<command>\d+)\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "percent",
    (message) => toReplaceCommands(message, (index) => ` (${String(index)}%) `),
    (message) =>
      message.replaceAll(
        /\s*\(\s*(?<command>\d+)\s*%\s*\)\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "brackets",
    (message) => toReplaceCommands(message, (index) => ` [${String(index)}] `),
    (message) =>
      message.replaceAll(
        /\s*\[\s*(?<command>\d+)\s*\]\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "double arrows",
    (message) =>
      toReplaceCommands(message, (index) => ` <<${String(index)}>> `),
    (message) =>
      message.replaceAll(
        /\s*<\s*<\s*(?<command>\d+)\s*>\s*>\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "quotes",
    (message) =>
      toReplaceCommands(message, (index) => ` ("${String(index)}") `),
    (message) =>
      message.replaceAll(
        /\s*\(\s*"\s*(?<command>\d+)\s*"\s*\)\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "hr id",
    (message) =>
      toReplaceCommands(message, (index) => ` <hr id="${String(index)}" /> `),
    (message) =>
      message.replaceAll(
        /\s*<hr\s*id\s*=\s*"\s*(?<command>\d+)\s*"\s*\/\s*>\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "ears",
    (message) =>
      toReplaceCommands(message, (index) => ` )<${String(index)}>( `),
    (message) =>
      message.replaceAll(
        /\s*\)\s*<\s*(?<command>\d+)\s*>\s*\(\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "eyes",
    (message) =>
      toReplaceCommands(message, (index) => ` (.)<${String(index)}>(.) `),
    (message) =>
      message.replaceAll(
        /\s*\(\s*\.\s*\)\s*<\s*(?<command>\d+)\s*>\s*\(\s*\.\s*\)\s*/g,
        fromReplaceCommands,
      ),
  ),
  new CommandDriver(
    "breaks",
    (message) =>
      toReplaceCommands(message, (index) => `\r\n<${String(index)}>\r\n`),
    (message) =>
      message.replaceAll(/\s*<\s*(?<command>\d+)\s*>\s*/g, fromReplaceCommands),
  ),
  new DropCommandDriver(),
] satisfies CommandDriver[];
