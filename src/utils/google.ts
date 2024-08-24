import { decode } from "html-entities";

const server = "https://translate.google.com/m";

export async function translate(
  source: string,
  target: string,
  message: string,
  cookieId?: string,
) {
  return fetch(
    `${server}?${new URLSearchParams({
      sl: source,
      tl: target,
      q: message,
    }).toString()}`,
    {
      headers: {
        cookie:
          cookieId === undefined ? "" : `GOOGLE_ABUSE_EXEMPTION=${cookieId}`,
      },
    },
  )
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.text();
    })
    .then((text) => {
      const textMatch = /"result-container">(.*?)<\/div>/.exec(text);

      return textMatch![1]!;
    })
    .then((text) => decode(text).replaceAll("\u200B​", ""));
}
