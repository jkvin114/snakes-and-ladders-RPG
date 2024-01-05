import express = require("express")
import { ajaxauth, auth, availabilityCheck, voteController ,ContentType, checkVoteRecord, postRoleChecker, renderEjs} from "./helpers"
import { ImageUploader } from "../../mongodb/mutler"
import {UserBoardDataSchema} from "../../mongodb/schemaController/UserData"
import {PostSchema} from "../../mongodb/schemaController/Post"
import {CommentSchema} from "../../mongodb/schemaController/Comment"
import {ReplySchema} from "../../mongodb/schemaController/Reply"
const {ObjectID} = require('mongodb');


import mongoose from "mongoose"
import { SchemaTypes } from "../../mongodb/SchemaTypes"
import { UserSchema } from "../../mongodb/schemaController/User"
import { loginauth, sessionParser } from "../jwt/auth"
import { ControllerWrapper } from "../ControllerWrapper"
import { BoardPostController } from "./controller/BoardPostController"

const { User } = require("../../mongodb/UserDBSchema")


const router = express.Router()

// console.log(ajaxauth)
router.post("/vote", loginauth,sessionParser, async (req: express.Request, res: express.Response) => voteController(req,res,ContentType.POST))




router.get("/write", auth, async (req: express.Request, res: express.Response) => {
	res.render("writepost", { url: "", title: "", content: "", imagedir: "", isEdit: false })
})

router.post("/write", loginauth,sessionParser, ImageUploader.upload.single("img"), async (req: express.Request, res: express.Response) => {
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
	const session=res.locals.session
	try {
		let user = await User.findOneByUsername(session.username)
		let post = await PostSchema.create({
			_id:new mongoose.Types.ObjectId(),
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
			authorName: session.username,
			visibility:req.body.visibility
		})
		await UserBoardDataSchema.addPost(user.boardData, post._id)
	} catch (e) {
		console.error(e)
		res.status(500).end("servererror")
		return
	}

	res.redirect("/board/post/" + postUrl)
})
router.get("/edit/:postUrl", loginauth,sessionParser, async (req: express.Request, res: express.Response) => {
	let url = req.params.postUrl
	const session=res.locals.session
	try{
		let post = await PostSchema.findOneByArticleId(Number(url))
		// console.log(post.author)
		// console.log(session.userId)
		if (post.author.toString() !== session.userId) {
			res.status(401).redirect("/board/")
			return
		}
		return renderEjs(res,"writepost", { url: url, title: post.title, content: post.content, imagedir: post.imagedir, isEdit: true })
		// res.render("writepost", { url: url, title: post.title, content: post.content, imagedir: post.imagedir, isEdit: true })

	}
	catch(e){
		console.error(e)
		res.status(500).redirect("servererror")
	}

})
router.post("/edit", loginauth,sessionParser, ImageUploader.upload.single("img"), async (req: express.Request, res: express.Response) => {
	const url = req.body.url
	const session=res.locals.session
	try{
		let post = await PostSchema.findOneByArticleId(url)
		if (post.author.toString() !== session.userId) {
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

		let visibility=req.body.visibility
		// console.log(visibility)
		await PostSchema.update(url, title, content,visibility)
		if (imagedir !== "") {
			await PostSchema.updateImage(url, imagedir)
		}

		res.redirect("/board/post/" + url)
	}
	catch(e){
		console.error(e)
		res.status(500).redirect("servererror")
	}
	
})
router.post("/comment", loginauth,sessionParser, ControllerWrapper(BoardPostController.addComment,201))
router.post("/comment/reply", loginauth,sessionParser,ControllerWrapper(BoardPostController.addReply,201))


router.post("/delete", loginauth,sessionParser,ControllerWrapper(BoardPostController.deletePost))
router.post("/comment/delete", loginauth,sessionParser,ControllerWrapper(BoardPostController.deleteComment))
router.post("/reply/delete", loginauth,sessionParser, ControllerWrapper(BoardPostController.deleteReply))


router.get("/comment/:commentId/reply",availabilityCheck,sessionParser, ControllerWrapper(BoardPostController.getReply))
router.get("/:postUrl",availabilityCheck,sessionParser, postRoleChecker,ControllerWrapper(BoardPostController.getPost))

module.exports = router
