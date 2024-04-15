import winston, { format } from "winston"
import fs = require("fs")
const timestamp = new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, ".")
const filename = `./logs/log-marble-${timestamp}.txt`
fs.writeFileSync(filename, "--begin-- \n")

const logger = winston.createLogger({
	level: "info",
	format: format.combine(
		format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss",
		}),
    format.json()
	),

	//   defaultMeta: { service: 'user-service' },
	transports: [
		//
		// - Write all logs with importance level of `error` or less to `error.log`
		// - Write all logs with importance level of `info` or less to `combined.log`
		//
		// new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: filename }),
	],
})

const logFormat = winston.format.printf(function(info) {
  return `${info.level}: ${info.message}\n`;
});


// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(),logFormat),
		})
	)
}
export namespace Logger {
	export function log(...msg: string[]) {
    try{
      logger.info(msg.join(" "))
    }
    catch(e){
      
    }
	}
	export function warn(...msg: string[]) {
    try{
      logger.warn(msg.join(" "))
    }
    catch(e){

    }
	}
	export function error(msg: string,err:any) {
    try{

      logger.error(msg+" "+String(err))
    }
    catch(e){

    }
	}
  export function err(...msg: string[]) {
    try{

      logger.error(msg.join(" "))
    }
    catch(e){

    }
	}
}
