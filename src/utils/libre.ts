import { spawn } from "node:child_process";

import { translate } from "@triforce-heroes/triforce-core/Translator";

export async function translationService(
  languages: string[],
  target: string,
): Promise<number> {
  return new Promise((resolve) => {
    const port = Math.floor(Math.random() * 50_000 + 5000);

    spawn("cmd.exe", [
      "/c",
      "start",
      "/B",
      "/LOW",
      `/affinity`,
      Math.floor(Math.random() * 2 ** 16)
        .toString(16)
        .toUpperCase(),
      "libretranslate",
      "--load-only",
      [...languages, target].join(","),
      "--port",
      String(port),
      "--threads",
      "1",
    ]);

    function retry() {
      void translate(
        `http://127.0.0.1:${String(port)}`,
        languages.at(0)!,
        target,
        "Hello!",
      )
        .then(() => {
          resolve(port);
        })
        .catch(() => {
          setTimeout(retry, 1000);
        });
    }

    retry();
  });
}
