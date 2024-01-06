
import type { Request, Response } from "express"
const {ObjectID} = require('mongodb');
import { ISession } from "../../../inMemorySession"
import { CommentSchema } from "../../../mongodb/schemaController/Comment"
import { PostSchema } from "../../../mongodb/schemaController/Post"
import { ReplySchema } from "../../../mongodb/schemaController/Reply"
import { UserBoardDataSchema } from "../../../mongodb/schemaController/UserData"
import mongoose from "mongoose"
import { UserSchema } from "../../../mongodb/schemaController/User";
import { checkVoteRecord, renderEjs } from "../helpers";

export namespace BoardPostController {
    export async function deletePost(req: Request, res: Response, session: ISession) {
        let id = new ObjectID(req.body.id)
		const post = await PostSchema.findOneById(id)
		
		if (post.author.toString() !== session.userId) {
			res.status(401).end("")
			return
		}
		if (post.comments != null) {
			for (const comm of post.comments) {
				await CommentSchema.onPostRemoved(comm._id)
				if (!comm.reply) continue
				for (const reply of comm.reply) {
					await ReplySchema.onPostRemoved(reply)
				}
			}
		}

		let boarddata = await UserSchema.getBoardData(session.userId)
		if(!boarddata) return
		await PostSchema.remove(id)
		await UserBoardDataSchema.removePost(boarddata, id)
    }

    export async function addComment(req: Request, res: Response, session: ISession) {
        const postId = new ObjectID(req.body.postId) //objectid
        const content = req.body.content
        const userId = new ObjectID(session.userId)
		const boarddata = await UserSchema.getBoardData(session.userId)
		if(!boarddata) return

        let comment = await CommentSchema.create({
            _id:new mongoose.Types.ObjectId(),
            content: content,
            article: postId,
            author: userId,
            reply: [],
            upvoters: [],
            downvoters: [],
            imagedir: "",
            upvote: 0,
            downvote: 0,
            deleted: false,
            replyCount: 0,
            authorName: session.username
        })
        await PostSchema.addComment(postId, comment._id)
        await UserBoardDataSchema.addComment(boarddata, comment._id)

    }
    
    export async function deleteComment(req: Request, res: Response, session: ISession) {
		let commid = new ObjectID(req.body.commentId)
		const comment = await CommentSchema.findOneById(commid)
		if (comment.author.toString() !== session.userId) {
			res.status(401).end("")
			return
		}
		await PostSchema.removeComment(comment.article)
		const boarddata = await UserSchema.getBoardData(session.userId)
		if(!boarddata) return
		await UserBoardDataSchema.removeComment(boarddata, commid)

		await CommentSchema.remove(commid)
    }

    export async function deleteReply(req: Request, res: Response, session: ISession) {
        let commid = new ObjectID(req.body.commentId)
		const reply = await ReplySchema.findOneById(commid)

		if (reply.author.toString() !== session.userId) {
			res.status(401).end("")
			return
		}

		const boarddata = await UserSchema.getBoardData(session.userId)
		if(!boarddata) return
		await CommentSchema.removeReply(reply.comment, commid)
		await PostSchema.removeReply(reply.article)
		await UserBoardDataSchema.removeReply(boarddata, commid)
		await ReplySchema.remove(commid)
    }


    export async function getReply(req: Request, res: Response, session: ISession) {
        const comment = await CommentSchema.findOneById(new ObjectID(req.params.commentId))
		const commentreply = await CommentSchema.getReplyById(new ObjectID(req.params.commentId))
		const postUrl = await PostSchema.getUrlById(comment.article)
		let voteRecords=null
		if(session && session.isLogined){
			const boarddata = await UserSchema.getBoardData(session.userId)
			if(boarddata) 
				voteRecords = await UserBoardDataSchema.getVoteRecords(boarddata)
		}

		let replys = []
		for (let reply of commentreply.reply) {
			const authorProfile=await UserSchema.findProfileImageById(reply.author)
			replys.push({
				canModify: session.isLogined && String(reply.author) === session.userId,
				content: reply.content,
				authorProfileImage:authorProfile,
				_id: String(reply._id),
				upvotes: reply.upvote,
				downvotes: reply.downvote,
				author: reply.authorName,
				createdAt: reply.createdAt,
				myvote:checkVoteRecord(reply._id,voteRecords)
			})
		}
		replys=replys.reverse()
		const authorProfile=await UserSchema.findProfileImageById(comment.author)
		renderEjs(res,"commentReply", {
			comment: comment,
			authorProfileImage:authorProfile,
			reply: replys,
			postUrl: !postUrl ? "" : postUrl.articleId,
			logined: session.isLogined,
			myvote:checkVoteRecord(comment._id,voteRecords)
		})

    }

    export async function addReply(req: Request, res: Response, session: ISession) {
        const commentId =new ObjectID(req.body.commentId) //objectid
        const content = req.body.content
        const userId = new ObjectID(session.userId)
        const boarddata = await UserSchema.getBoardData(session.userId)
		if(!boarddata) return
        const comment = await CommentSchema.findOneById(new ObjectID(req.body.commentId))

        let reply = await ReplySchema.create({
            _id:new mongoose.Types.ObjectId(),
            content: content,
            comment: commentId,
            article: comment.article,
            author: userId,
            upvoters: [],
            downvoters: [],
            imagedir: "",
            upvote: 0,
            downvote: 0,
            deleted: false,
            authorName: session.username
        })

        await CommentSchema.addReply(commentId, reply._id)
        await UserBoardDataSchema.addReply(boarddata, reply._id)
        await PostSchema.addReply(comment.article)
    }

    export async function getPost(req: Request, res: Response, session: ISession) {
        const post = await PostSchema.findOneByArticleIdWithComment(Number(req.params.postUrl))
		if (!post) {
			res.status(404).redirect("/notfound")
			return
		}

		let voteRecords=null
		let isBookmarked=false
		if(session && session.isLogined){
			const boarddata = await UserSchema.getBoardData(session.userId)
			if(!boarddata) return res.status(404).redirect("/notfound")

			voteRecords = await UserBoardDataSchema.getVoteRecords(boarddata)
			const bookmarks = await UserBoardDataSchema.getBookmarks(boarddata)
			//console.log(bookmarks)
			if(bookmarks.bookmarks.some((id:mongoose.Types.ObjectId)=>String(id)===String(post._id))){
				isBookmarked=true
			}
		}
		const authorProfile=await UserSchema.findProfileImageById(post.author)

		await PostSchema.incrementView(Number(req.params.postUrl))

		let comment = []
		for (let comm of post.comments) {
			if (comm.deleted && comm.replyCount === 0) continue
			let authorProfileImage=""
			authorProfileImage=await UserSchema.findProfileImageById(comm.author)
			comment.push({
				canModify: String(comm.author) === session.userId && session.isLogined,
				content: comm.content,
				_id: String(comm._id),
				upvotes: comm.upvote,
				downvotes: comm.downvote,
				replyCount: comm.replyCount,
				deleted: comm.deleted,
				author: comm.authorName,
				createdAt: comm.createdAt,
				myvote:checkVoteRecord(comm._id,voteRecords),
				authorProfileImage:authorProfileImage
			})
		}
		renderEjs(res,"post", {
			canModify: String(post.author) === session.userId && session.isLogined,
			comment: comment,
			url: req.params.postUrl,
			id: post._id,
			title: post.title,
			content: post.content,
			image: post.imagedir,
			views: post.views,
			author: post.authorName,
			logined: session.isLogined,
			upvotes: post.upvote,
			downvotes: post.downvote,
			createdAt: post.createdAt,
			myvote:checkVoteRecord(post._id,voteRecords),
			isBookmarked:isBookmarked,
			visibility:post.visibility,
			authorProfileImage:authorProfile
		})
        }
}