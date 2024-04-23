
import { Request,Response,NextFunction } from "express"
import CONFIG from "../../../config/config.json"
import { SessionManager } from "../../session"

/**
 * checks whether the user is logged in
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const loginauth = async (req: Request, res: Response, next: NextFunction) => {
	// next();
	// return
    const session =await SessionManager.getSession(req)
	try {
		if ( session && session.loggedin && session.userId) {
			next()
		} else {
			res.status(401).end("unauthorized")
		}
	} catch {
		res.status(401).end("unauthorized")
	}
}


/**
 * get session and store it to res.locals.session
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const sessionParser = async (req: Request, res: Response, next: NextFunction)=>{
	const session = await SessionManager.getSession(req)
	if(!session) return res.status(401).end("invalid session")
	res.locals.session = session
	next()
}