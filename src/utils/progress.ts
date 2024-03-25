import chalk from "chalk";

import { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";

export function printProgress(
  current: number,
  total: number,
  lastCase?: DataEntryTranslationProgress,
) {
  const percentual = chalk.bold(`(${((100 / total) * current).toFixed(2)}%)`);
  const percentualMessage = `- ${percentual} ${String(current)} of ${String(total)}:\n`;

  process.stdout.write(percentualMessage);

  if (lastCase) {
    const messageIn = lastCase.from ?? chalk.italic("<empty>");
    const messageOut = lastCase.to ?? chalk.italic("<empty>");

    process.stdout.write(
      chalk.gray(`  * ${messageIn.slice(0, process.stdout.columns - 4)}\n`),
    );
    process.stdout.write(
      chalk.gray(`  * ${messageOut.slice(0, process.stdout.columns - 4)}\n`),
    );
  }

  process.stdout.write("\n");
}
