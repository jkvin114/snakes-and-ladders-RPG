
import { Request,Response,NextFunction } from "express"
import CONFIG from "../../../config/config.json"
import { SessionManager } from "../../inMemorySession"

/**
 * checks whether the user is logged in
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const loginauth = (req: Request, res: Response, next: NextFunction) => {
	// next();
	// return
    const session = SessionManager.getSession(req)
	try {
		if (!CONFIG.board) return res.status(403).redirect("/")

		if ( session && session.isLogined && session.userId) {
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
export const sessionParser = (req: Request, res: Response, next: NextFunction)=>{
	const session = SessionManager.getSession(req)
	if(!session) return res.status(401).end("unauthorized")
	res.locals.session = session
	next()
}