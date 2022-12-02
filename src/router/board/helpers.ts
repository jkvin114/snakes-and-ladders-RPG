import express from "express"
import CONFIG from "../../../config/config.json"
import {UserBoardDataSchema} from "./schemaController/UserData"
import {PostSchema} from "./schemaController/Post"
import {CommentSchema} from "./schemaController/Comment"
import {ReplySchema} from "./schemaController/Reply"
const { User } = require("../../mongodb/DBHandler")
import mongoose from "mongoose"


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
export const voteController = async function(req:express.Request,res:express.Response,type:ContentType){
	const id = new mongoose.Types.ObjectId(req.body.id)
	let voters:{upvoters:mongoose.Types.ObjectId[],downvoters:mongoose.Types.ObjectId[]}
	console.log(type)
	if(type === ContentType.POST){
		voters = await PostSchema.getVotersById(id)
	}
	else if(type === ContentType.COMMENT){
		voters = await CommentSchema.getVotersById(id)
	}
	else if(type === ContentType.REPLY){
		voters = await ReplySchema.getVotersById(id)
	}
	// console.log(voters)

	if(!voters){
		res.status(500).end()
		return
	}

	const voter = await User.findById(req.session.userId)
	const user = await User.getBoardData(req.session.userId)
	const voterBoardData=user.boardData
	let change = 0

	if (req.body.type === "up") {
		//user already upvoted
		if(voters.upvoters.some((id)=>String(id)===req.session.userId))
		{
			change = -1
		}//user already downvoted
		else if(voters.downvoters.some((id)=>String(id)===req.session.userId)){
			change = 0
		}
		else{
			change=1
		}

		if(change!==0){

			if(type == ContentType.POST){
				await PostSchema.changeUpvote(id, change, voter._id)

				if(change===1){
					await UserBoardDataSchema.postUpvote(voterBoardData,id)
				}
				else if(change===-1){
					await UserBoardDataSchema.cancelPostUpvote(voterBoardData,id)
				}

			}
			else if(type == ContentType.COMMENT){
				await CommentSchema.changeUpvote(id, change, voter._id)
			}
			else if(type == ContentType.REPLY){
				await ReplySchema.changeUpvote(id, change, voter._id)
			}

			if(change===1){
				await UserBoardDataSchema.addUpvoteRecord(voterBoardData,id)
			}
			else if(change===-1){
				await UserBoardDataSchema.deleteUpvoteRecord(voterBoardData,id)
			}
		}
		
	} else if (req.body.type === "down") {
		//user already downvoted
		if(voters.downvoters.some((id)=>String(id)===req.session.userId))
		{
			change = -1
		}//user already downvoted
		else if(voters.upvoters.some((id)=>String(id)===req.session.userId)){
			change = 0
		}
		else{
			change=1
		}

		if(change!==0){

			if(type == ContentType.POST){
				await PostSchema.changeDownvote(id, change, voter._id)
			}
			else if(type == ContentType.COMMENT){
				await CommentSchema.changeDownvote(id, change, voter._id)
			}
			else if(type == ContentType.REPLY){
				await ReplySchema.changeDownvote(id, change, voter._id)
			}

			if(change===1){
				await UserBoardDataSchema.addDownvoteRecord(voterBoardData,id)
			}
			else if(change===-1){
				await UserBoardDataSchema.deleteDownvoteRecord(voterBoardData,id)
			}
		}
	} else {
		res.status(500).end()
	}
	/**
	 * change -1: cancel vote
	 * 0: no change (already voted opposite)
	 * 1: voted
	 */
	res.status(200).json({ change: change })
}

export function checkVoteRecord(contentId:mongoose.Types.ObjectId,
	voteRecords:{upvotedContents:mongoose.Types.ObjectId[],downvotedContents:mongoose.Types.ObjectId[]}):string{
	// console.log(voteRecords)
	if(!voteRecords) return "none"
	if(voteRecords.upvotedContents.includes(contentId)) return "up"
	if(voteRecords.downvotedContents.includes(contentId)) return "down"
	return "none"
}
export function containsId(list:mongoose.Types.ObjectId[]|string[],id:mongoose.Types.ObjectId|string){
	return list.some((_id:mongoose.Types.ObjectId|string)=>String(_id)===String(id))
}

export enum ContentType{
	POST,COMMENT,REPLY
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
	CommentSchema.cleanUpDeletedAndNoReply().then(async (data:any[])=>{
		// console.log(data)
		for(const comm of data){
			await CommentSchema.cleanUp(comm._id)
		}
	})
}