import type { Request, Response } from "express"
const { ObjectID } = require("mongodb")
import type { ISession } from "../../../session/ISession"
import { CommentSchema } from "../../../mongodb/schemaController/Comment"
import { PostSchema } from "../../../mongodb/schemaController/Post"
import { ReplySchema } from "../../../mongodb/schemaController/Reply"
import { UserBoardDataSchema } from "../../../mongodb/schemaController/UserData"
import mongoose from "mongoose"
import { UserSchema } from "../../../mongodb/schemaController/User"
import { checkVoteRecord, isNumber, renderEjs } from "../helpers"
import { Logger } from "../../../logger"
import { UserCache } from "../../../cache"
import { ImageUploader } from "../../../mongodb/mutler"

export namespace BoardPostController {
	export async function getEditPost(req: Request, res: Response, session: Readonly<ISession>) {
		let url = req.params.postUrl
		if (!isNumber(url)) {
			res.status(400).end("url should be a number")
			return
		}
		try {
			let post = await PostSchema.findOneByArticleId(Number(url))
			if (!post) {
				res.status(404).end()
				return
			}
			if (post.author.toString() !== session.userId) {
				res.status(401).end()
				return
			}
			res.json({
				url: url,
				title: post.title,
				content: post.content,
				imagedir: post.imagedir,
				formattedContent: post.formattedContent,
				visibility:post.visibility
			})
		} catch (e) {
			Logger.error("get post edit", e)
			res.status(500).end()
		}
	}

	export async function uploadImage(req: Request, res: Response, session: Readonly<ISession>) {
		try {
			const imgfile = req.file.filename

			res.end(imgfile)
		} catch (e) {
			Logger.error("upload image", e)
			res.status(500).end()
		}
	}

	export async function editPost(req: Request, res: Response, session: Readonly<ISession>) {
		const url = req.body.url
		if (!isNumber(url)) {
			res.status(400).end("url should be a number")
			return
		}
		try {
			let post = await PostSchema.findOneByArticleId(url)
			if (!post) {
				res.status(404).end()
				return
			}
			if (post.author.toString() !== session.userId) {
				res.status(401).end()
				return
			}

			const removedImages = req.body.removedImages
			ImageUploader.deletePostImages(removedImages)
			const imagedir = req.body.thumbnail

			let title = req.body.title

			let content = req.body.content

			let formattedContent = req.body.formattedContent

			let visibility = req.body.visibility
			await PostSchema.updateWithFormat(
				Number(url),
				title,
				content,
				visibility,
				formattedContent ? formattedContent : null
			)

			if (imagedir !== "") {
				await PostSchema.updateImage(Number(url), imagedir)
			}
			Logger.log("post edited", url)
			res.status(201).json({ url: url })
		} catch (e) {
			Logger.error("post edit", e)
			res.status(500).end()
		}
	}
	export async function writePost(req: Request, res: Response, session: Readonly<ISession>) {
		const imgfile = req.body.thumbnail
		let postUrl = Date.now()
		let title = req.body.title

		let content = req.body.content
		let formattedContent = req.body.formattedContent

		const removedImages = req.body.removedImages
		ImageUploader.deletePostImages(removedImages)
		try {
			let user = await UserCache.getUser(session.userId)
			let post = await PostSchema.create({
				_id: new mongoose.Types.ObjectId(),
				title: title,
				content: content,
				author: session.userId,
				views: 0,
				imagedir: !imgfile ? "" : imgfile,
				uploaded: true,
				deleted: false,
				commentCount: 0,
				articleId: postUrl,
				upvote: 0,
				downvote: 0,
				authorName: user.username,
				visibility: req.body.visibility,
				formattedContent: formattedContent ? formattedContent : null,
			})
			await UserBoardDataSchema.addPost(user.boardData as mongoose.Types.ObjectId, post._id)
			Logger.log("post created", String(postUrl))
			res.status(201).json({ url: postUrl })
		} catch (e) {
			Logger.error("post write", e)
			res.status(500).end()
			return
		}
	}

	export async function deletePost(req: Request, res: Response, session: Readonly<ISession>) {
		try {
			let id = new ObjectID(req.body.id)
			const post = await PostSchema.findOneByIdPopulated(id)
			if(!post){
				res.status(404).end()
				return
			}

			if (post.author.toString() !== session.userId) {
				res.status(401).end("")
				return
			}

			let remove=req.body.removedImages
			ImageUploader.deletePostImages(remove)

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
			if (!boarddata) return
			await PostSchema.remove(id)
			await UserBoardDataSchema.removePost(boarddata, id)
		} catch (e) {
			Logger.error("post delete", e)
			res.status(500).end()
		}
	}

	export async function addComment(req: Request, res: Response, session: Readonly<ISession>) {
		try {
			const postId = new ObjectID(req.body.postId) //objectid
			const content = req.body.content
			const userId = new ObjectID(session.userId)
			const boarddata = await UserSchema.getBoardData(session.userId)
			if (!boarddata) return

			let comment = await CommentSchema.create({
				_id: new mongoose.Types.ObjectId(),
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
				authorName: session.username,
			})
			await PostSchema.addComment(postId, comment._id)
			await UserBoardDataSchema.addComment(boarddata, comment._id)
		} catch (e) {
			Logger.error("add comment", e)
			res.status(500).end()
		}
	}

	export async function deleteComment(req: Request, res: Response, session: Readonly<ISession>) {
		try {
			let commid = new ObjectID(req.body.commentId)
			const comment = await CommentSchema.findOneById(commid)
			if (comment.author.toString() !== session.userId) {
				res.status(401).end("")
				return
			}
			await PostSchema.removeComment(comment.article)
			const boarddata = await UserSchema.getBoardData(session.userId)
			if (!boarddata) return
			await UserBoardDataSchema.removeComment(boarddata, commid)

			await CommentSchema.remove(commid)
		} catch (e) {
			Logger.error("comment delete", e)
			res.status(500).end()
		}
	}

	export async function deleteReply(req: Request, res: Response, session: Readonly<ISession>) {
		try {
			let commid = new ObjectID(req.body.commentId)
			const reply = await ReplySchema.findOneById(commid)

			if (reply.author.toString() !== session.userId) {
				res.status(401).end("")
				return
			}

			const boarddata = await UserSchema.getBoardData(session.userId)
			if (!boarddata) return
			await CommentSchema.removeReply(reply.comment, commid)
			await PostSchema.removeReply(reply.article)
			await UserBoardDataSchema.removeReply(boarddata, commid)
			await ReplySchema.remove(commid)
		} catch (e) {
			Logger.error("reply delete", e)
			res.status(500).end()
		}
	}

	export async function getReply(req: Request, res: Response, session: Readonly<ISession>) {
		const comment = await CommentSchema.findOneById(new ObjectID(req.params.commentId))
		const commentreply = await CommentSchema.getReplyById(new ObjectID(req.params.commentId))
		const postUrl = await PostSchema.getUrlById(comment.article)
		let voteRecords = null
		if (session && session.loggedin) {
			const boarddata = await UserSchema.getBoardData(session.userId)
			if (boarddata) voteRecords = await UserBoardDataSchema.getVoteRecords(boarddata)
		}

		let replys = []
		for (let reply of commentreply.reply) {
			const authorProfile = await UserSchema.findProfileImageById(reply.author)
			replys.push({
				canModify: session.loggedin && String(reply.author) === session.userId,
				content: reply.content,
				authorProfileImage: authorProfile,
				_id: String(reply._id),
				upvotes: reply.upvote,
				downvotes: reply.downvote,
				author: reply.authorName,
				createdAt: reply.createdAt,
				myvote: checkVoteRecord(reply._id, voteRecords),
			})
		}
		replys = replys.reverse()
		const authorProfile = await UserSchema.findProfileImageById(comment.author)
		renderEjs(res, "commentReply", {
			comment: comment,
			authorProfileImage: authorProfile,
			reply: replys,
			postUrl: !postUrl ? "" : postUrl.articleId,
			logined: session.loggedin,
			myvote: checkVoteRecord(comment._id, voteRecords),
		})
	}

	export async function addReply(req: Request, res: Response, session: Readonly<ISession>) {
		const commentId = new ObjectID(req.body.commentId) //objectid
		const content = req.body.content
		const userId = new ObjectID(session.userId)
		const boarddata = await UserSchema.getBoardData(session.userId)
		if (!boarddata) return
		const comment = await CommentSchema.findOneById(new ObjectID(req.body.commentId))

		let reply = await ReplySchema.create({
			_id: new mongoose.Types.ObjectId(),
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
			authorName: session.username,
		})

		await CommentSchema.addReply(commentId, reply._id)
		await UserBoardDataSchema.addReply(boarddata, reply._id)
		await PostSchema.addReply(comment.article)
	}

	export async function getPostContent(req: Request, res: Response, session: Readonly<ISession>) {
		let url = Number(req.params.postUrl)
		if (!isNumber(req.params.postUrl)) {
			res.status(400).end("url should be a number")
			return
		}
		try {
			const post = await PostSchema.findOneByArticleId(url)
			if (!post) {
				res.status(404).end()
				return
			}
			let formatted = post.formattedContent != null
			res.json({
				formatted: formatted,
				content: formatted ? post.formattedContent : post.content,
			})
		} catch (e) {
			Logger.error("get post content ", e)
			res.status(500).end()
			return
		}
	}

	export async function getPost(req: Request, res: Response, session: Readonly<ISession>) {
		try {

			if (!isNumber(req.params.postUrl)) {
				res.status(400).end("url should be a number")
				return
			}

			const post = await PostSchema.findOneByArticleIdWithComment(Number(req.params.postUrl))
			if (!post) {
				res.status(404).end("")
				return
			}

			let voteRecords = null
			let isBookmarked = false
			if (session && session.loggedin) {
				const boarddata = await UserSchema.getBoardData(session.userId)
				if (!boarddata) {
					res.status(401).end("")
					return
				}

				voteRecords = await UserBoardDataSchema.getVoteRecords(boarddata)
				const bookmarks = await UserBoardDataSchema.getBookmarks(boarddata)
				//console.log(bookmarks)
				if (bookmarks.bookmarks.some((id: mongoose.Types.ObjectId) => String(id) === String(post._id))) {
					isBookmarked = true
				}
			}
			const authorProfile = await UserSchema.findProfileImageById(post.author)

			await PostSchema.incrementView(Number(req.params.postUrl))

			let comment = []
			for (let comm of post.comments) {
				if (comm.deleted && comm.replyCount === 0) continue
				let authorProfileImage = ""
				authorProfileImage = await UserSchema.findProfileImageById(comm.author)
				comment.push({
					canModify: String(comm.author) === session.userId && session.loggedin,
					content: comm.content,
					_id: String(comm._id),
					upvotes: comm.upvote,
					downvotes: comm.downvote,
					replyCount: comm.replyCount,
					deleted: comm.deleted,
					author: comm.authorName,
					createdAt: comm.createdAt,
					myvote: checkVoteRecord(comm._id, voteRecords),
					authorProfileImage: authorProfileImage,
				})
			}
			renderEjs(res, "post", {
				canModify: String(post.author) === session.userId && session.loggedin,
				comment: comment,
				url: req.params.postUrl,
				id: post._id,
				title: post.title,
				content: "",
				image: post.imagedir,
				views: post.views,
				author: post.authorName,
				logined: session.loggedin,
				upvotes: post.upvote,
				downvotes: post.downvote,
				createdAt: post.createdAt,
				myvote: checkVoteRecord(post._id, voteRecords),
				isBookmarked: isBookmarked,
				visibility: post.visibility,
				authorProfileImage: authorProfile,
			})
		} catch (e) {
			Logger.error("get post ", e)
			res.status(500).end()
			return
		}
	}
}
