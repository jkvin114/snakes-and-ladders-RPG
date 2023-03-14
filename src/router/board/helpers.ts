import express from "express"
import CONFIG from "../../../config/config.json"
import { UserBoardDataSchema } from "../../mongodb/schemaController/UserData"
import session, { Session } from "express-session"
const { ObjectID } =require('mongodb') ;

import { PostSchema } from "../../mongodb/schemaController/Post"
import { CommentSchema } from "../../mongodb/schemaController/Comment"
import { ReplySchema } from "../../mongodb/schemaController/Reply"
const { User } = require("../../mongodb/DBHandler")
import mongoose from "mongoose"
import { SchemaTypes } from "../../mongodb/SchemaTypes"
import { Friend, friendSchema } from "../../mongodb/UserRelationDBSchema";
import { UserRelationSchema } from "../../mongodb/schemaController/UserRelation";
import crypto from "crypto";
export function encrypt(pw: string, salt: string) {
	return crypto
		.createHash("sha512")
		.update(pw + salt)
		.digest("hex")
}

export const availabilityCheck = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (!CONFIG.board) return res.status(403).redirect("/")
	else next()
}

export const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// next();
	// return
	try {
		if (!CONFIG.board) return res.status(403).redirect("/")

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
		if (!CONFIG.board) return res.status(403).redirect("/")

		if (req.session.isLogined) {
			next()
		} else {
			res.status(401).end("unauthorized")
		}
	} catch {
		res.status(401).end("unauthorized")
	}
}
export const adminauth = async(req: express.Request, res: express.Response, next: express.NextFunction) => {
	// next()
	// return
	try {
		if (!req.session.isLogined) {
			res.status(401).end("unauthorized")
		} else {
			const user = await User.findById(req.session.userId)
			if(user.role && user.role==="admin") next()
			else
				res.status(401).end("unauthorized")
		}
	} catch {
		res.status(401).end("unauthorized")
	}
}
export const postRoleChecker =  async (req: express.Request, res: express.Response, next: express.NextFunction)=>{
	const post=await PostSchema.findOneByArticleId(Number(req.params.postUrl))
	if(!post) {
		res.status(401).end("You are not allowed to view this post!")
		return
	}
	let isfriend=false
	let currentUser:mongoose.Types.ObjectId|null=null
	if(req.session.isLogined){
		isfriend=await UserRelationSchema.isFriendWith(req.session.userId,post.author)
	}
	if(isPostVisibleToUser(post.visibility,post.author,currentUser,isfriend)) next()
	else res.status(401).end("You are not allowed to view this post!")
}

export const voteController = async function (req: express.Request, res: express.Response, type: ContentType) {
	const id = new ObjectID(req.body.id) as mongoose.Types.ObjectId
	let voters: { upvoters: mongoose.Types.ObjectId[]; downvoters: mongoose.Types.ObjectId[] }|null=null
	console.log(type)
	if (type === ContentType.POST) {
		voters = await PostSchema.getVotersById(id)
	} else if (type === ContentType.COMMENT) {
		voters = await CommentSchema.getVotersById(id)
	} else if (type === ContentType.REPLY) {
		voters = await ReplySchema.getVotersById(id)
	}
	// console.log(voters)

	if (!voters) {
		res.status(500).end()
		return
	}

	const voter = await User.findById(req.session.userId)
	const user = await User.getBoardData(req.session.userId)
	const voterBoardData = user.boardData
	let change = 0

	if (req.body.type === "up") {
		//user already upvoted
		if (voters.upvoters.some((id) => String(id) === req.session.userId)) {
			change = -1
		} //user already downvoted
		else if (voters.downvoters.some((id) => String(id) === req.session.userId)) {
			change = 0
		} else {
			change = 1
		}

		if (change !== 0) {
			if (type == ContentType.POST) {
				await PostSchema.changeUpvote(id, change, voter._id)

				if (change === 1) {
					await UserBoardDataSchema.postUpvote(voterBoardData, id)
				} else if (change === -1) {
					await UserBoardDataSchema.cancelPostUpvote(voterBoardData, id)
				}
			} else if (type == ContentType.COMMENT) {
				await CommentSchema.changeUpvote(id, change, voter._id)
			} else if (type == ContentType.REPLY) {
				await ReplySchema.changeUpvote(id, change, voter._id)
			}

			if (change === 1) {
				await UserBoardDataSchema.addUpvoteRecord(voterBoardData, id)
			} else if (change === -1) {
				await UserBoardDataSchema.deleteUpvoteRecord(voterBoardData, id)
			}
		}
	} else if (req.body.type === "down") {
		//user already downvoted
		if (voters.downvoters.some((id) => String(id) === req.session.userId)) {
			change = -1
		} //user already downvoted
		else if (voters.upvoters.some((id) => String(id) === req.session.userId)) {
			change = 0
		} else {
			change = 1
		}

		if (change !== 0) {
			if (type == ContentType.POST) {
				await PostSchema.changeDownvote(id, change, voter._id)
			} else if (type == ContentType.COMMENT) {
				await CommentSchema.changeDownvote(id, change, voter._id)
			} else if (type == ContentType.REPLY) {
				await ReplySchema.changeDownvote(id, change, voter._id)
			}

			if (change === 1) {
				await UserBoardDataSchema.addDownvoteRecord(voterBoardData, id)
			} else if (change === -1) {
				await UserBoardDataSchema.deleteDownvoteRecord(voterBoardData, id)
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

export function checkVoteRecord(
	contentId: mongoose.Types.ObjectId,
	voteRecords: { upvotedContents: mongoose.Types.ObjectId[]; downvotedContents: mongoose.Types.ObjectId[] }
): string {
	// console.log(voteRecords)
	if (!voteRecords) return "none"
	if (voteRecords.upvotedContents.includes(contentId)) return "up"
	if (voteRecords.downvotedContents.includes(contentId)) return "down"
	return "none"
}
export function containsId(list: mongoose.Types.ObjectId[] | string[], id: mongoose.Types.ObjectId | string) {
	return list.some((_id: mongoose.Types.ObjectId | string) => String(_id) === String(id))
}
export function isPostSummaryVisibleToUser(
	visibility: string,
	poster: mongoose.Types.ObjectId,
	currentUser: mongoose.Types.ObjectId | null,
	isFriend: boolean,
	isLinkOnlyAllowed:boolean
) {
	if(visibility==="PUBLIC"||String(poster)===String(currentUser) || (isLinkOnlyAllowed && visibility==="LINK_ONLY")) return true
	if(!currentUser || visibility==="LINK_ONLY") return false
	if(visibility==="FRIENDS") return isFriend
	return false
}
export function isPostVisibleToUser(
	visibility: string,
	poster: mongoose.Types.ObjectId,
	currentUser: mongoose.Types.ObjectId | null,
	isFriend: boolean
) {
	if(visibility==="PUBLIC" || visibility==="LINK_ONLY" || String(poster)===String(currentUser)) return true
	if(!currentUser) return false
	if(visibility==="FRIENDS") return isFriend
	return false
}
/**
 * 
 * @param session express.session
 * @param posts list of post summary
 * @param isLinkOnlyAllowed true if link-only posts should be visible
 * @returns 
 */
export function filterPostSummary(session:any,posts:SchemaTypes.Article[],isLinkOnlyAllowed:boolean):Promise<SchemaTypes.Article[]>{
	return new Promise(async (resolve,reject)=>{
		let friends:any[]=[]
		let currentUser:mongoose.Types.ObjectId|null=null
		if(session.isLogined){
			currentUser=session.userId
			friends=await UserRelationSchema.findFriends(currentUser)
		}

		resolve(posts.filter((post:SchemaTypes.Article)=>
			isPostSummaryVisibleToUser(post.visibility,post.author,currentUser,friends.includes(post.author),isLinkOnlyAllowed)
		))
	})
}
export enum ContentType {
	POST,
	COMMENT,
	REPLY,
}
export const COUNT_PER_PAGE = 10
export function timestampToNumber(time: any) {
	return new Date(time).valueOf()
}
export interface PostTitle {
	imagedir?: string
	createdAt: Date
	title: string
	views?: number
	upvote?: number
	downvote?: number
	articleId?: number
	commentCount?: number
	authorName?: string
	visibility?:string
	author:mongoose.Types.ObjectId
}
export interface CommentSummary {
	type: string
	id: string
	imagedir?: string
	createdAt: string
	content: string
	upvote: number
	downvote: number
	articleUrl?: number
	articleId?: string
	commentId?: string
	replyCount?: number
}
function cleanUpComments() {
	CommentSchema.cleanUpDeletedAndNoReply().then(async (data: any[]) => {
		// console.log(data)
		for (const comm of data) {
			await CommentSchema.cleanUp(comm._id)
		}
	})
}
async function migrateFriendRelation(){
	const users=await User.find()
	for(const u of users){
		for(const f of u.friends){
			console.log("migrated friend of "+u._id+": "+f)
			let isfriend=false
			isfriend=await UserRelationSchema.isFriendWith(u._id,f)
			if(!isfriend)
				await UserRelationSchema.addFriend(u._id,f)
			isfriend=false
			isfriend=await UserRelationSchema.isFriendWith(f,u._id)
			if(!isfriend)
			 	await UserRelationSchema.addFriend(f,u._id)
		}
	}
}
async function migrateFollowRelation(){
	const users=await User.find()
	for(const u of users){
		for(const f of u.follows){
			console.log("migrated follow of "+u._id+": "+f)
			await UserRelationSchema.addFollow(u._id,f)
			//await UserRelationSchema.addFollow(f,u._id)
		}
	}
}
// migrateFriendRelation()
// migrateFollowRelation()