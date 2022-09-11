import express = require("express")
import { ajaxauth, auth, availabilityCheck, CommentSummary, COUNT_PER_PAGE, PostTitle, timestampToNumber } from "./helpers"
const { upload } = require("../../mongodb/mutler")

const { UserBoardData, Article, Comment, CommentReply } = require("../../mongodb/BoardDBHandler")
const mongoose = require("mongoose")

const { User } = require("../../mongodb/DBHandler")


const router = express.Router()

// console.log(ajaxauth)
router.post("/vote", ajaxauth, async (req, res) => {
	const id = mongoose.Types.ObjectId(req.body.id)
	const voters = await Article.getVotersById(id)
	const voter = await User.findById(req.session.userId)
	let change = 0

	if (req.body.type === "up") {
		await Article.changeUpvote(id, 1, voter._id)
		change = 1
	} else if (req.body.type === "down") {
		await Article.changeDownvote(id, 1, voter._id)
		change = 1
	} else {
		res.status(500).end()
	}
	res.status(200).json({ change: change })
})




router.get("/write", auth, async (req, res) => {
	res.render("writepost", { url: "", title: "", content: "", imagedir: "", isEdit: false })
})

router.post("/write", auth, upload.single("img"), async (req, res) => {
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
		let post = await Article.create({
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
		await UserBoardData.addPost(user.boardData, post._id)
	} catch (e) {
		console.error(e)
		res.status(500).redirect("/")
		return
	}

	res.redirect("/board/post/" + postUrl)
})
router.get("/edit/:postUrl", auth, async (req, res) => {
	let url = req.params.postUrl
	let post = await Article.findOneByArticleId(url)
	console.log(post.author)
	console.log(req.session.userId)
	if (post.author.toString() !== req.session.userId) {
		res.status(401).redirect("/board/")
		return
	}
	res.render("writepost", { url: url, title: post.title, content: post.content, imagedir: post.imagedir, isEdit: true })
})
router.post("/edit", auth, upload.single("img"), async (req, res) => {
	const url = req.body.url
	let post = await Article.findOneByArticleId(url)
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

	await Article.update(url, title, content)
	if (imagedir !== "") {
		await Article.updateImage(url, imagedir)
	}

	res.redirect("/board/post/" + url)
})
router.post("/delete", ajaxauth, async (req, res) => {
	try {
		let id = mongoose.Types.ObjectId(req.body.id)
		const post = await Article.findById(id)
		if (post.author.toString() !== req.session.userId) {
			res.status(401).end("")
			return
		}
		if (post.comments != null) {
			for (const comm of post.comments) {
				await Comment.onPostRemoved(comm._id)
				if (!comm.reply) continue
				for (const reply of comm.reply) {
					await CommentReply.onPostRemoved(reply)
				}
			}
		}

		let user = await User.getBoardData(req.session.userId)
		await Article.delete(id)
		await UserBoardData.removePost(user.boardData, id)
		res.status(201).end()
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})
router.post("/comment", auth, async (req, res) => {
	const postId = mongoose.Types.ObjectId(req.body.postId) //objectid
	const content = req.body.content
	const userId = mongoose.Types.ObjectId(req.session.userId)
	let user = await User.getBoardData(userId)

	let comment = await Comment.create({
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
	await Article.addComment(postId, comment._id)
	await UserBoardData.addComment(user.boardData, comment._id)

	res.redirect("/board/post/" + req.body.postUrl)
})

router.post("/comment/delete", ajaxauth, async (req, res) => {
	try {
		let commid = mongoose.Types.ObjectId(req.body.commentId)
		const comment = await Comment.findOneById(commid)
		if (comment.author.toString() !== req.session.userId) {
			res.status(401).end("")
			return
		}
		await Article.removeComment(comment.article)
		let user = await User.getBoardData(comment.author)
		await UserBoardData.removeComment(user.boardData, commid)

		await Comment.delete(commid)
		res.status(200).end()
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})
router.post("/reply/delete", ajaxauth, async (req, res) => {
	try {
		console.log(req.body)
		let commid = mongoose.Types.ObjectId(req.body.commentId)
		const reply = await CommentReply.findOneById(commid)

		if (reply.author.toString() !== req.session.userId) {
			res.status(401).end("")
			return
		}

		let user = await User.getBoardData(reply.author)
		await Comment.removeReply(reply.comment, commid)
		await Article.removeReply(reply.article)
		await UserBoardData.removeReply(user.boardData, commid)
		await CommentReply.delete(commid)
		res.status(200).end("")
	} catch (e) {
		console.error(e)
		res.status(500).end("")
	}
})

router.get("/comment/:commentId/reply",availabilityCheck, async (req, res) => {
	try {
		const comment = await Comment.findOneById(mongoose.Types.ObjectId(req.params.commentId))
		const commentreply = await Comment.getReplyById(mongoose.Types.ObjectId(req.params.commentId))
		const postUrl = await Article.getUrlById(comment.article)

		let replys = []
		for (let reply of commentreply.reply) {
			replys.push({
				canModify: String(reply.author) === req.session.userId,
				content: reply.content,
				_id: String(reply._id),
				upvotes: reply.upvote,
				downvotes: reply.downvote,
				author: reply.authorName,
				createdAt: reply.createdAt
			})
		}
		replys=replys.reverse()

		res.status(200).render("commentReply", {
			comment: comment,
			reply: replys,
			postUrl: !postUrl ? "" : postUrl.articleId,
			logined: req.session.isLogined
		})
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})

router.post("/comment/reply", auth, async (req, res) => {
	const commentId = mongoose.Types.ObjectId(req.body.commentId) //objectid
	const content = req.body.content
	const userId = mongoose.Types.ObjectId(req.session.userId)
	let user = await User.getBoardData(userId)
	const comment = await Comment.findOneById(mongoose.Types.ObjectId(req.body.commentId))

	let reply = await CommentReply.create({
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

	await Comment.addReply(commentId, reply._id)
	await UserBoardData.addReply(user.boardData, reply._id)
	await Article.addReply(comment.article)
	res.redirect("/board/post/comment/" + req.body.commentId + "/reply")
})

router.get("/:postUrl",availabilityCheck, async (req, res) => {
	try {
		let post = await Article.findOneByArticleIdWithComment(req.params.postUrl)

		if (!post) {
			res.redirect("/")
		}

		await Article.incrementView(post.articleId)

		let comment = []
		for (let comm of post.comments) {
			if (comm.deleted && comm.replyCount === 0) continue
			comment.push({
				canModify: String(comm.author) === req.session.userId,
				content: comm.content,
				_id: String(comm._id),
				upvotes: comm.upvote,
				downvotes: comm.downvote,
				replyCount: comm.replyCount,
				deleted: comm.deleted,
				author: comm.authorName,
				createdAt: comm.createdAt
			})
		}
		res.status(200).render("post", {
			canModify: String(post.author) === req.session.userId,
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
			createdAt: post.createdAt
		})
	} catch (e) {
		console.error(e)
		res.status(500).end("")
	}
})

module.exports = router
