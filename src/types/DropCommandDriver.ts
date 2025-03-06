import { CommandDriver, toReplaceCommands } from "./CommandDriver.js";

export class DropCommandDriver extends CommandDriver {
  public constructor() {
    super(
      "drop",
      (message) => toReplaceCommands(message, () => " ").trim(),
      (message) => message,
    );
  }
}
