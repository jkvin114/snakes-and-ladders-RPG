import express = require("express")
import { InferSchemaType } from "mongoose"
import { Article, UserBoardData } from "../../mongodb/BoardDBSchemas"
import { SchemaTypes } from "../../mongodb/SchemaTypes"
import { auth, availabilityCheck, CommentSummary, COUNT_PER_PAGE, filterPostSummary, PostTitle, timestampToNumber } from "./helpers"

import {CommentSchema} from "../../mongodb/schemaController/Comment"

import {PostSchema} from "../../mongodb/schemaController/Post"
import { ReplySchema } from "../../mongodb/schemaController/Reply"
import { UserBoardDataSchema } from "../../mongodb/schemaController/UserData"
const { User } = require("../../mongodb/UserDBSchema")
const router = express.Router()


router.get("/:username/posts", availabilityCheck,async (req: express.Request, res: express.Response) => {
	try{
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0,Number(req.query.start))
		}
	
		let user = await User.findIdByUsername(req.params.username)
	
		let total=await PostSchema.countDocuments({author:user._id});
		let postlist: SchemaTypes.Article[] = await PostSchema.findSummaryOfUserByRange(start, count, user._id)
		postlist=await filterPostSummary(req.session,postlist,false)
		res.render("postlist", {
			displayType:"user",
			posts: postlist,
			logined: req.session.isLogined,
			user: req.params.username,
			start:start,
			count:count,
			isEnd:(start+count  > total)
		})
	}
	catch(e){
		console.error(e)
		res.status(500).end("")
		return
	}
})
router.get("/:username/likes", availabilityCheck,async (req: express.Request, res: express.Response) => {
	try{
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0,Number(req.query.start))
		}
	
		let user = await User.findOneByUsername(req.params.username)
		if(!user){
			res.status(404).redirect("/notfound")
        	return
		}
		let likes=await UserBoardDataSchema.getLikedPosts(user.boardData)
		if(!likes){
			res.status(404).redirect("/notfound")
        	return
		}
		let total=likes.upvotedArticles.length
		let likesId=likes.upvotedArticles.slice(start,start+count)

		let postlist: SchemaTypes.Article[] = await PostSchema.findMultipleByIdList(likesId)
		postlist=await filterPostSummary(req.session,postlist,false)
		res.render("postlist", {
			displayType:"userlikes",
			posts: postlist,
			logined: req.session.isLogined,
			user: req.params.username,
			start:start,
			count:count,
			isEnd:(start+count >= total)
		})
	}
	catch(e){
		console.error(e)
		res.status(500).end("")
		return
	}
})

router.get("/:username/bookmarks", availabilityCheck,async (req: express.Request, res: express.Response) => {
	try{
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0,Number(req.query.start))
		}
		if(req.params.username!==req.session.username){
			res.status(401).end()
			return
		}
	
		let user = await User.findOneByUsername(req.params.username)
		if(!user){
			res.status(400).redirect("/notfound")
        	return
		}
		let bookmarks=await UserBoardDataSchema.getBookmarks(user.boardData)
		if(!bookmarks){
			res.status(404).redirect("/notfound")
        	return
		}
		let total=bookmarks.bookmarks.length

		let bookmarksId=bookmarks.bookmarks.slice(start,start+count)

		let postlist: SchemaTypes.Article[] = await PostSchema.findMultipleByIdList(bookmarksId)
		postlist=await filterPostSummary(req.session,postlist,true)
		res.render("postlist", {
			displayType:"bookmarks",
			posts: postlist,
			logined: req.session.isLogined,
			user: req.params.username,
			start:start,
			count:count,
			isEnd:(start+count >= total)
		})
	}
	catch(e){
		console.error(e)
		res.status(500).end("")
		return
	}
})

router.get("/:username/comments",availabilityCheck, async (req: express.Request, res: express.Response) => {
	let start = 0
	let count = COUNT_PER_PAGE
	let sortby="new"   ///new,old,upvote
	if (req.query.start) {
		start = Math.max(0,Number(req.query.start))
		// count = Number(req.query.count)
	}
	if (req.query.sortby) {
		sortby=String(req.query.sortby)
		// count = Number(req.query.count)
	}
	try {
		let user = await User.findIdByUsername(req.params.username)

		let comments = await CommentSchema.findOfUserByRange(start, count, user._id,sortby)
		let replys = await ReplySchema.findOfUserByRange(start, count, user._id,sortby)
		if(!comments || !replys){
			res.status(404).redirect("/notfound")
        	return
		} 
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
				
				if(sortby==='old'){
					commentFirst = timestampToNumber(comments[c].createdAt) < timestampToNumber(replys[r].createdAt)
				}
				else if(sortby==='upvote'){
					commentFirst = comments[c].upvote > replys[r].upvote
					if(comments[c].upvote === replys[r].upvote){
						commentFirst = timestampToNumber(comments[c].createdAt) > timestampToNumber(replys[r].createdAt)
					}
				}
				else{
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
					replyCount: comments[c].replyCount
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
					commentId: String(replys[r].comment)
				})
				r++
			}
		}

		//	console.log(list)
		res.status(200).render("comments", {
			canModify: String(user._id) === req.session.userId && req.session.isLogined,
			user: req.params.username,
			comments: list,
			start:start,
			count:count,
			isEnd:(comments.length < count && replys.length < count),
			sortby:sortby
		})
	} catch (e) {
		console.error(e)
		res.status(500).end("")
		return
	}
})

module.exports = router
