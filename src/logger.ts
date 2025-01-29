/**
 * A very simple logger including local time, level, message and object.
 * Can be easily customized to support more advanced loggers.
 * See: https://github.com/mazito/logger
 * 
 * Use:
 * ~~~
 *  import { logger, LogLevel } from './logger';
 * 
 *  // set up the level in startup code (hooks)
 *  logger.level(LogLevel.DEBUG);
 * 
 *  // simple log with message
 *  logger.debug("This is a debug message");
 * 
 *  // log with message and structured object
 *  logger.info("This is an info message with object", { ev: ev, data: data })
 * ~~~
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export {
  LogLevel,
  logger
}

enum LogLevel {
  DEBUG = 1, 
  INFO = 2, 
  WARN = 3, 
  ERROR = 4, 
  FATAL = 5 
}

const LogLevelCodes = {
  1: 'DBG',
  2: 'INF',
  3: 'WRN',
  4: 'ERR',
  5: 'FTL'
};

/**
 * The Logger class is NOT public.
 * We will export just one instance 'logger' of this class.
 */
class LoggerInstance {
  _level = LogLevel.INFO;
  _lastTs: any = null;
  _elapsed: any = null;

  level(v?: LogLevel): LogLevel {
    if (!v || (this._level === v)) return this._level;
    this._level = v;
    const lvlcode = LogLevelCodes[v];
    this.info(`Logger level set to '${lvlcode}'`)
    return this._level;
  }

  debug(message: string, obj?: any) {
    logIt(this, LogLevel.DEBUG, message, obj);
    return this;
  }  

  info(message: string, obj?: any) {
    logIt(this, LogLevel.INFO, message, obj);
    return this;
  }  

  warn(message: string, obj?: any) {
    logIt(this, LogLevel.WARN, message, obj);
    return this;
  }  

  error(message: string, obj?: any) {
    logIt(this, LogLevel.ERROR, message, obj);
    return this;
  }  

  fatal(message: string, obj?: any) {
    logIt(this, LogLevel.FATAL, message, obj);
    return this;
  }  

  /** Reset the logger timer to zero */
  timer(message: string, obj?: any) {
    this._lastTs = Date.now();
    this._elapsed = 0.0; // secs
    logIt(this, this._level, `(${this._elapsed.toFixed(3)}s) ${message}`, obj, true);
    return this;
  }

  /** Display the time elapsed since last call to this function */
  elapsed(message: string, obj?: any) {
    if (!this._lastTs) this._lastTs = Date.now();
    const ts = Date.now();
    this._elapsed = (ts - this._lastTs)/1000.0; // secs
    logIt(this, this._level, `(${this._elapsed.toFixed(3)}s) ${message}`, obj, true);
    return this;
  }
}

/**
 * The logger Singleton
 */ 
let logger = new LoggerInstance();

// HELPERS /////////////////////////////////////////////////////////////////////

function logIt(
  _this: LoggerInstance, 
  lvl: LogLevel, 
  message: string, 
  obj?: any, 
  isTiming?: boolean
) {
  let lvlcode = LogLevelCodes[lvl];
  if (lvl < _this._level) return; 
  if (isTiming) lvlcode = 'DTS';
  const smsg = `${getISOTimeString()} ${lvlcode} ${message || ''}`;
  if (!obj) console.log(smsg)
  else console.log(smsg, obj)
}

function getISOTimeString() {
  const now = new Date();
  const ye = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const dy = String(now.getDate()).padStart(2, '0');
  const hr = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const se = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  // Combine into ISO format
  return `${ye}-${mo}-${dy} ${hr}:${mi}:${se}.${ms}`;
}
