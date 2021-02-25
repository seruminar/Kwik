import type { SapperRequest, SapperResponse } from "@sapper/server";
import wretch from 'wretch';

export function post(
  request: SapperRequest,
  response: SapperResponse,
  next: () => void
) {
  response.setHeader("Content-Type", "application/json");

  let originalBody = "";

  request.on("data", (chunk) => {
    originalBody += chunk;
  });

  request.on("end", async () => {
    const answerResponse = await wretch(process.env.QNAMAKER_ENDPOINT)
      .polyfills({
        fetch: require("node-fetch"),
      })
      .auth(process.env.QNAMAKER_AUTH)
      .post(JSON.parse(originalBody))
      .text();

    response.end(answerResponse);
  });
}
