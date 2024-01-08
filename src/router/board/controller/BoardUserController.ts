import type { Request, Response } from "express"
import type { ISession } from "../../../session/inMemorySession"
import { COUNT_PER_PAGE, CommentSummary, filterPostSummary, renderEjs, timestampToNumber } from "../helpers"
import { SchemaTypes } from "../../../mongodb/SchemaTypes"
import { PostSchema } from "../../../mongodb/schemaController/Post"
import { UserBoardDataSchema } from "../../../mongodb/schemaController/UserData"
import { CommentSchema } from "../../../mongodb/schemaController/Comment"
import { ReplySchema } from "../../../mongodb/schemaController/Reply"
import { UserSchema } from "../../../mongodb/schemaController/User"
import mongoose from "mongoose"

export namespace BoardUserController {
	export async function allPost(req: Request, res: Response, session: ISession) {
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0, Number(req.query.start))
		}

		let userId = await UserSchema.findIdByUsername(req.params.username)
		if(!userId) throw Error("invalid username")

		let total = await PostSchema.countDocuments({ author: userId })
		let postlist: SchemaTypes.Article[] = await PostSchema.findSummaryOfUserByRange(start, count, userId)
		postlist = await filterPostSummary(session, postlist, false)
		renderEjs(res, "postlist", {
			displayType: "user",
			posts: postlist,
			logined: session.isLogined,
			user: req.params.username,
			start: start,
			count: count,
			isEnd: start + count > total,
		})
	}

	export async function likes(req: Request, res: Response, session: ISession) {
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0, Number(req.query.start))
		}

		let boarddata = await UserSchema.getBoardDataByUsername(req.params.username)
		if (!boarddata) throw Error("invalid username")
		
		let likes = await UserBoardDataSchema.getLikedPosts(boarddata)
		if (!likes) throw Error("invalid user data")

		let total = likes.upvotedArticles.length
		let likesId = likes.upvotedArticles.slice(start, start + count)

		let postlist: SchemaTypes.Article[] = await PostSchema.findMultipleByIdList(likesId)
		postlist = await filterPostSummary(session, postlist, false)
		renderEjs(res, "postlist", {
			displayType: "userlikes",
			posts: postlist,
			logined: session.isLogined,
			user: req.params.username,
			start: start,
			count: count,
			isEnd: start + count >= total,
		})
	}
	export async function bookmarks(req: Request, res: Response, session: ISession) {
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0, Number(req.query.start))
		}
		if (req.params.username !== session.username) {
			res.status(401).end()
			return
		}

		let boarddata = await UserSchema.getBoardDataByUsername(req.params.username)
		if (!boarddata) throw Error("invalid username")
		let bookmarks = await UserBoardDataSchema.getBookmarks(boarddata as mongoose.Types.ObjectId)
		if (!bookmarks) throw Error("invalid user data")
		let total = bookmarks.bookmarks.length

		let bookmarksId = bookmarks.bookmarks.slice(start, start + count)

		let postlist: SchemaTypes.Article[] = await PostSchema.findMultipleByIdList(bookmarksId)
		postlist = await filterPostSummary(session, postlist, true)
		renderEjs(res, "postlist", {
			displayType: "bookmarks",
			posts: postlist,
			logined: session.isLogined,
			user: req.params.username,
			start: start,
			count: count,
			isEnd: start + count >= total,
		})
	}

	export async function comments(req: Request, res: Response, session: ISession) {
		let start = 0
		let count = COUNT_PER_PAGE
		let sortby = "new" ///new,old,upvote
        
		if (req.query.start) {
			start = Math.max(0, Number(req.query.start))
			// count = Number(req.query.count)
		}
		if (req.query.sortby) {
			sortby = String(req.query.sortby)
			// count = Number(req.query.count)
		}
		const user = await UserSchema.findIdByUsername(req.params.username)
		if(!user) throw Error("invalid username")
		let comments = await CommentSchema.findOfUserByRange(start, count, user._id, sortby)
		let replys = await ReplySchema.findOfUserByRange(start, count, user._id, sortby)
		if (!comments || !replys) throw Error("invalid user data")

		// console.log(comments)
		// console.log(replys)
		let c = 0
		let r = 0
		let list: CommentSummary[] = []
		for (let i = 0; i < comments.length + replys.length; ++i) {
			let commentFirst = true
			if (r >= replys.length) {
				commentFirst = true
			} else if (c >= comments.length) {
				commentFirst = false
			} else {
				if (sortby === "old") {
					commentFirst = timestampToNumber(comments[c].createdAt) < timestampToNumber(replys[r].createdAt)
				} else if (sortby === "upvote") {
					commentFirst = comments[c].upvote > replys[r].upvote
					if (comments[c].upvote === replys[r].upvote) {
						commentFirst = timestampToNumber(comments[c].createdAt) > timestampToNumber(replys[r].createdAt)
					}
				} else {
					//최근거 먼저
					commentFirst = timestampToNumber(comments[c].createdAt) > timestampToNumber(replys[r].createdAt)
				}
			}

			if (commentFirst) {
				if (comments[c].deleted) {
					c++
					continue
				}
				let articleUrl = 0
				let post = await PostSchema.getUrlById(comments[c].article)
				if (post != null) articleUrl = post.articleId

				list.push({
					type: "comment",
					id: String(comments[c]._id),
					imagedir: comments[c].imagedir,
					createdAt: comments[c].createdAt.toString(),
					content: comments[c].content,
					upvote: comments[c].upvote,
					downvote: comments[c].downvote,
					articleUrl: articleUrl,
					replyCount: comments[c].replyCount,
				})
				c++
			} else {
				if (replys[r].deleted) {
					r++
					continue
				}
				list.push({
					type: "reply",
					id: String(replys[r]._id),
					imagedir: replys[r].imagedir,
					createdAt: replys[r].createdAt.toString(),
					content: replys[r].content,
					upvote: replys[r].upvote,
					downvote: replys[r].downvote,
					commentId: String(replys[r].comment),
				})
				r++
			}
		}

		//	console.log(list)
		renderEjs(res, "comments", {
			canModify: String(user._id) === session.userId && session.isLogined,
			user: req.params.username,
			comments: list,
			start: start,
			count: count,
			isEnd: comments.length < count && replys.length < count,
			sortby: sortby,
		})
	}
}
