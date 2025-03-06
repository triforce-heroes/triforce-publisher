import chalk from "chalk";

import type { DataEntryTranslationProgress } from "../types/DataEntryTranslationProgress.js";

export function printFailure(
  current: number,
  total: number,
  driver: string,
  input: string,
  output: string,
) {
  const driverMessage = chalk.red(`(DRIVER: ${driver})`);

  const percentual = chalk.bold(`(${((100 / total) * current).toFixed(2)}%)`);
  const percentualMessage = `- ${percentual} ${String(current)} of ${String(total)}: ${driverMessage}\n`;

  process.stdout.write(percentualMessage);

  process.stdout.write(
    chalk.gray(`  * ${input.slice(0, process.stdout.columns - 4)}\n`),
  );
  process.stdout.write(
    chalk.gray(`  * ${output.slice(0, process.stdout.columns - 4)}\n`),
  );

  process.stdout.write("\n");
}

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
