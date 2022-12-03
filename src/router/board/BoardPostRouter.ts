import express = require("express")
import { ajaxauth, auth, availabilityCheck, voteController ,ContentType, checkVoteRecord} from "./helpers"
import { ImageUploader } from "../../mongodb/mutler"
import {UserBoardDataSchema} from "./schemaController/UserData"
import {PostSchema} from "./schemaController/Post"
import {CommentSchema} from "./schemaController/Comment"
import {ReplySchema} from "./schemaController/Reply"


import mongoose from "mongoose"

const { User } = require("../../mongodb/DBHandler")


const router = express.Router()

// console.log(ajaxauth)
router.post("/vote", ajaxauth, async (req, res) => voteController(req,res,ContentType.POST))




router.get("/write", auth, async (req, res) => {
	res.render("writepost", { url: "", title: "", content: "", imagedir: "", isEdit: false })
})

router.post("/write", auth, ImageUploader.upload.single("img"), async (req, res) => {
	const imgfile = req.file
	let postUrl = Date.now()
	let title = req.body.title
		.replace(/\<div\>/g, " ")
		.replace(/\<\/div\>/g, "")
		.replace(/\<.+?\>/g, "")

	let content = req.body.content
		.replace(/\<br.*?\>/g, "[[]]")
		.replace(/\<\/div\>/g, "[[]]")
		.replace(/\<.+?\>/g, "")
		.replace(/\[\[\]\]/g, "<br>")

	try {
		let user = await User.findOneByUsername(req.session.username)
		let post = await PostSchema.create({
			title: title,
			content: content,
			author: user._id,
			views: 0,
			imagedir: !imgfile ? "" : imgfile.filename,
			uploaded: true,
			deleted: false,
			commentCount: 0,
			articleId: postUrl,
			upvote: 0,
			downvote: 0,
			authorName: req.session.username
		})
		await UserBoardDataSchema.addPost(user.boardData, post._id)
	} catch (e) {
		console.error(e)
		res.status(500).redirect("/")
		return
	}

	res.redirect("/board/post/" + postUrl)
})
router.get("/edit/:postUrl", auth, async (req, res) => {
	let url = req.params.postUrl
	let post = await PostSchema.findOneByArticleId(Number(url))
	console.log(post.author)
	console.log(req.session.userId)
	if (post.author.toString() !== req.session.userId) {
		res.status(401).redirect("/board/")
		return
	}
	res.render("writepost", { url: url, title: post.title, content: post.content, imagedir: post.imagedir, isEdit: true })
})
router.post("/edit", auth, ImageUploader.upload.single("img"), async (req, res) => {
	const url = req.body.url
	let post = await PostSchema.findOneByArticleId(url)
	if (post.author.toString() !== req.session.userId) {
		res.status(401).end("")
		return
	}
	const imagedir = !req.file ? "" : req.file.filename

	let title = req.body.title
		.replace(/\<div\>/g, " ")
		.replace(/\<\/div\>/g, "")
		.replace(/\<.+?\>/g, "")

	let content = req.body.content
		.replace(/\<br.*?\>/g, "[[]]")
		.replace(/\<\/div\>/g, "[[]]")
		.replace(/\<.+?\>/g, "")
		.replace(/\[\[\]\]/g, "<br>")

	await PostSchema.update(url, title, content)
	if (imagedir !== "") {
		await PostSchema.updateImage(url, imagedir)
	}

	res.redirect("/board/post/" + url)
})
router.post("/delete", ajaxauth, async (req, res) => {
	try {
		let id = new mongoose.Types.ObjectId(req.body.id)
		const post = await PostSchema.findOneById(id)
		if (post.author.toString() !== req.session.userId) {
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

		let user = await User.getBoardData(req.session.userId)
		await PostSchema.remove(id)
		await UserBoardDataSchema.removePost(user.boardData, id)
		res.status(201).end()
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})
router.post("/comment", auth, async (req, res) => {
	const postId = new mongoose.Types.ObjectId(req.body.postId) //objectid
	const content = req.body.content
	const userId = new mongoose.Types.ObjectId(req.session.userId)
	let user = await User.getBoardData(userId)

	let comment = await CommentSchema.create({
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
		authorName: req.session.username
	})
	await PostSchema.addComment(postId, comment._id)
	await UserBoardDataSchema.addComment(user.boardData, comment._id)

	res.redirect("/board/post/" + req.body.postUrl)
})

router.post("/comment/delete", ajaxauth, async (req, res) => {
	try {
		let commid = new mongoose.Types.ObjectId(req.body.commentId)
		const comment = await CommentSchema.findOneById(commid)
		if (comment.author.toString() !== req.session.userId) {
			res.status(401).end("")
			return
		}
		await PostSchema.removeComment(comment.article)
		let user = await User.getBoardData(comment.author)
		await UserBoardDataSchema.removeComment(user.boardData, commid)

		await CommentSchema.remove(commid)
		res.status(200).end()
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})
router.post("/reply/delete", ajaxauth, async (req, res) => {
	try {
		//console.log(req.body)
		let commid = new mongoose.Types.ObjectId(req.body.commentId)
		const reply = await ReplySchema.findOneById(commid)

		if (reply.author.toString() !== req.session.userId) {
			res.status(401).end("")
			return
		}

		let user = await User.getBoardData(reply.author)
		await CommentSchema.removeReply(reply.comment, commid)
		await PostSchema.removeReply(reply.article)
		await UserBoardDataSchema.removeReply(user.boardData, commid)
		await ReplySchema.remove(commid)
		res.status(200).end("")
	} catch (e) {
		console.error(e)
		res.status(500).end("")
	}
})

router.get("/comment/:commentId/reply",availabilityCheck, async (req, res) => {
	try {
		const comment = await CommentSchema.findOneById(new mongoose.Types.ObjectId(req.params.commentId))
		const commentreply = await CommentSchema.getReplyById(new mongoose.Types.ObjectId(req.params.commentId))
		const postUrl = await PostSchema.getUrlById(comment.article)
		let voteRecords=null
		if(req.session && req.session.isLogined){
			const user = await User.getBoardData(req.session.userId)
			voteRecords = await UserBoardDataSchema.getVoteRecords(user.boardData)
		}



		let replys = []
		for (let reply of commentreply.reply) {
			replys.push({
				canModify: String(reply.author) === req.session.userId,
				content: reply.content,
				_id: String(reply._id),
				upvotes: reply.upvote,
				downvotes: reply.downvote,
				author: reply.authorName,
				createdAt: reply.createdAt,
				myvote:checkVoteRecord(reply._id,voteRecords)
			})
		}
		replys=replys.reverse()

		res.status(200).render("commentReply", {
			comment: comment,
			reply: replys,
			postUrl: !postUrl ? "" : postUrl.articleId,
			logined: req.session.isLogined,
			myvote:checkVoteRecord(comment._id,voteRecords)
		})
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})

router.post("/comment/reply", auth, async (req, res) => {
	const commentId =new  mongoose.Types.ObjectId(req.body.commentId) //objectid
	const content = req.body.content
	const userId = new mongoose.Types.ObjectId(req.session.userId)
	let user = await User.getBoardData(userId)
	const comment = await CommentSchema.findOneById(new mongoose.Types.ObjectId(req.body.commentId))

	let reply = await ReplySchema.create({
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
		authorName: req.session.username
	})

	await CommentSchema.addReply(commentId, reply._id)
	await UserBoardDataSchema.addReply(user.boardData, reply._id)
	await PostSchema.addReply(comment.article)
	res.redirect("/board/post/comment/" + req.body.commentId + "/reply")
})

router.get("/:postUrl",availabilityCheck, async (req, res) => {
	try {

		let post = await PostSchema.findOneByArticleIdWithComment(Number(req.params.postUrl))
		if (!post) {
			res.status(404).redirect("/notfound")
			return
		}
		let voteRecords=null
		let isBookmarked=false
		if(req.session && req.session.isLogined){
			const user = await User.getBoardData(req.session.userId)
			voteRecords = await UserBoardDataSchema.getVoteRecords(user.boardData)
			const bookmarks = await UserBoardDataSchema.getBookmarks(user.boardData)
			//console.log(bookmarks)
			if(bookmarks.bookmarks.some((id:mongoose.Types.ObjectId)=>String(id)===String(post._id))){
				isBookmarked=true
			}
		}
		

		

		await PostSchema.incrementView(post.articleId)

		let comment = []
		for (let comm of post.comments) {
			if (comm.deleted && comm.replyCount === 0) continue
			comment.push({
				canModify: String(comm.author) === req.session.userId && req.session.isLogined,
				content: comm.content,
				_id: String(comm._id),
				upvotes: comm.upvote,
				downvotes: comm.downvote,
				replyCount: comm.replyCount,
				deleted: comm.deleted,
				author: comm.authorName,
				createdAt: comm.createdAt,
				myvote:checkVoteRecord(comm._id,voteRecords)
			})
		}
		res.status(200).render("post", {
			canModify: String(post.author) === req.session.userId && req.session.isLogined,
			comment: comment,
			url: req.params.postUrl,
			id: post._id,
			title: post.title,
			content: post.content,
			image: post.imagedir,
			views: post.views,
			author: post.authorName,
			logined: req.session.isLogined,
			upvotes: post.upvote,
			downvotes: post.downvote,
			createdAt: post.createdAt,
			myvote:checkVoteRecord(post._id,voteRecords),
			isBookmarked:isBookmarked
		})
	} catch (e) {
		console.error(e)
		res.status(500).end("")
	}
})

module.exports = router
