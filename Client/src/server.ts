import compression from 'compression';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { createServer } from 'https';
import polka from 'polka';
import sirv from 'sirv';

import * as sapper from '@sapper/server';

dotenv.config();

const {
  PORT,
  NODE_ENV,
  QNAMAKER_AUTH,
  QNAMAKER_ENDPOINT,
  QNAMAKER_TRAIN_ENDPOINT,
} = process.env;

const dev = NODE_ENV === "development";

const server = polka().use(
  compression({ threshold: 0 }),
  sirv("static", { dev }),
  sapper.middleware({
    session: () => ({
      qnaMaker: {
        auth: QNAMAKER_AUTH,
        endpoint: QNAMAKER_ENDPOINT,
        trainEndpoint: QNAMAKER_TRAIN_ENDPOINT,
      },
    }),
  })
);

if (dev) {
  createServer(
    {
      key: readFileSync("src/server.key"),
      cert: readFileSync("src/server.cert"),
    },
    server.handler
  ).listen(PORT);
}

module.exports = server;
