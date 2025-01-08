import { decode } from "html-entities";

const server = "https://translate.google.com/m";

export async function translate(
  source: string,
  target: string,
  message: string,
  cookieId?: string,
) {
  const fetchUrl = new URL(server);

  fetchUrl.searchParams.set("sl", source);
  fetchUrl.searchParams.set("tl", target);
  fetchUrl.searchParams.set("q", message);

  const headers = new Headers();

  if (cookieId !== undefined) {
    headers.set("cookie", `GOOGLE_ABUSE_EXEMPTION=${cookieId}`);
  }

  return fetch(fetchUrl, { headers })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.text();
    })
    .then((text) => {
      const textMatch = /"result-container">(.*?)<\/div>/s.exec(text);

      return textMatch![1]!;
    })
    .then((text) => decode(text).replaceAll("\u200B​", ""));
}
