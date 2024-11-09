/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNode, isBrowser } from "./config.js";
import pino from 'pino';

export { logger };

let logger: any;

if (isNode) {
  logger = pino({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l' //'SYS:standard'
      }
    }
  });
}

if (isBrowser) {
  logger = pino({
    browser: {asObject: true},
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l' //'SYS:standard'
      }
    }
  });
}

