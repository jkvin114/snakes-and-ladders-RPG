import winston from "winston";
import fs = require("fs")
const timestamp=new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-")
const filename = `./logs/log-marble-${timestamp}.txt` 
fs.writeFileSync(filename,"--begin-- \n")

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
//   defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename:filename }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
export namespace Logger{
    export function log(msg:string){
        logger.info(msg)
    }
    export function warn(msg:string){
        logger.warn(msg)
    }
    export function err(msg:string){
        logger.error(msg)
    }
}
