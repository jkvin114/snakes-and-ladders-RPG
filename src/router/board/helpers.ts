import express from "express"
import CONFIG from "../../../config/config.json"
const {Comment } = require("../../mongodb/BoardDBHandler")

export const availabilityCheck = (req: express.Request, res: express.Response, next: express.NextFunction) => {

		
	if(!CONFIG.board) return res.status(403).redirect("/")
	else next()
}

export const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// next();
	// return
	try {
		
		if(!CONFIG.board) return res.status(403).redirect("/")

		
		if (req.session.isLogined) {
			next()
		} else {
			res.status(401).redirect("/")
		}
	} catch {
		res.status(401).redirect("/")
	}
}
export const ajaxauth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// next();
	// return
	try {
		if(!CONFIG.board) return res.status(403).redirect("/")

		if (req.session.isLogined) {
			next()
		} else {
			res.status(401).end("unauthorized")
		}
	} catch {
		res.status(401).end("unauthorized")
	}
}

export const COUNT_PER_PAGE=10
export function timestampToNumber(time: any) {
	return new Date(time).valueOf()
}
export interface PostTitle {
	imagedir: string
	createdAt: string
	title: string
	views: number
	upvote: number
	downvote: number
	articleId: string
	commentCount: number
	authorName: string
}
export interface CommentSummary {
	type: string
	id: string
	imagedir: string
	createdAt: string
	content: string
	upvote: number
	downvote: number
	articleUrl?: number
	articleId?: string
	commentId?: string
	replyCount?: number
}
function cleanUpComments(){
	Comment.cleanUpDeletedAndNoReply().then(async (data:any[])=>{
		// console.log(data)
		for(const comm of data){
			await Comment.cleanUp(comm._id)
		}
	})
}