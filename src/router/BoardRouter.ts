import express = require("express")
const router = express.Router()
const { upload } = require("../mongodb/mutler")
const { UserBoardData, Article, Comment, CommentReply } = require("../mongodb/BoardDBHandler")
const mongoose = require('mongoose');

const { User } = require("../mongodb/DBHandler")
const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// next();
	// return
	try {
		if (req.session.isLogined) {
			next()
		} else {
			res.status(401).redirect("/")
		}
	} catch {
		res.status(401).redirect("/")
	}
}
const userAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// next();
	// return
	try {
		if (req.session.isLogined && req.session.username === req.params.username) {
			next()
		} else {
			res.status(401).redirect("/")
		}
	} catch {
		res.status(401).redirect("/")
	}
}
interface PostTitle {
	imagedir: string
	createdAt: string
	title: string
	views: number
	upvote: number
	downvote: number
	articleId: string
	commentCount:number
}

router.get("/", (req, res) => {
	let start = 0
	let count = 10
	if (req.query.start) {
		start = Number(req.query.start)
		count = Number(req.query.count)
	}
console.log(start,count)
	Article.findTitleByRange(start, count)
		.then((data: PostTitle[]) => {
			res.render("board", { posts: data })
		})
		.catch((err: any) => res.status(500).redirect("/"))
})

router.post("/uploadimg", auth, upload.single("img"), async (req, res) => {
	const imgfile = req.file
	console.log(imgfile)
	// console.log(req.body.content)
	res.status(201).send({
		message: "Uploaded image successfully",
		fileInfo: req.file
	})
})
router.get("/post/write", auth, async (req, res) => {
	res.render("writepost", { title: "", content: "", isEdit: false })
})

router.post("/post/write", auth, upload.single("img"), async (req, res) => {
	const imgfile = req.file
	let postUrl = Date.now()
  try{
    let user = await User.findOneByUsername(req.session.username)
    let post = await Article.create({
      title: req.body.title,
      content: req.body.content,
      author: user._id,
      views: 0,
      imagedir: imgfile.filename,
      uploaded: true,
      deleted: false,
      commentCount: 0,
      articleId: postUrl
    })
    await UserBoardData.addPost(user.boardData,post._id)
  }
  catch(e){
    console.error(e)
    res.status(500).redirect("/")
    return
  }
	
	res.redirect("/board/post/" + postUrl)
})

router.post("/post/edit", auth, upload.single("img"), async (req, res) => {
	const imgfile = req.file

	res.redirect("/board/post/" + req.body.title)
})

router.post("/post/comment", auth, async (req, res) => {
	const postId=mongoose.Types.ObjectId(req.body.postId)  //objectid
	const content=req.body.content
	const userId=mongoose.Types.ObjectId(req.session.userId)


	let comment=await Comment.create({
		content:content,article:postId,author:userId,reply:[],upvoters:[],downvoters:[],
		imagedir:"",upvote:0,downvote:0,deleted:false,replyCount:0
	})
	await Article.addComment(postId,comment._id)
	await UserBoardData.addComment(userId,comment._id)

	res.redirect("/board/post/" + req.body.postUrl)
})

router.post("/post/comment/delete", async (req, res) => {

	try{
		let commid=mongoose.Types.ObjectId(req.body.commentId)
		const comment=await Comment.findOneById(commid)
		await Article.removeComment(comment.article)
		await UserBoardData.removeComment(comment.author,commid)


		await Comment.delete(commid)
		res.status(201).end()
	}
	catch(e){
		console.error(e)
		res.status(400).end()
	}
	
		
})
router.post("/post/reply/delete", async (req, res) => {

	try{
		let commid=mongoose.Types.ObjectId(req.body.commentId)
		const reply=await CommentReply.findOneById(commid)

		await Comment.removeReply(reply.comment,commid)
		await Article.removeReply(reply.article)
		await UserBoardData.removeReply(reply.author,commid)
		await CommentReply.delete(commid)
		res.status(201).end()
	}
	catch(e){
		console.error(e)
		res.status(400).end()
	}
	
		
})


router.get("/post/comment/:commentId/reply", async (req, res) => {
	try{

		const comment=await Comment.findOneById(mongoose.Types.ObjectId(req.params.commentId))
		const commentreply=await Comment.getReplyById(mongoose.Types.ObjectId(req.params.commentId))
		const postUrl=await Article.getUrlById(comment.article)
	
		let replys=[]
		for(let reply of commentreply.reply){
			replys.push({
				canModify:(String(reply.author) === req.session.userId),
				content:reply.content,
				_id:String(reply._id),
				upvotes:reply.upvote,
				downvote:reply.downvote,
				author:reply.author.username
			})
		}
		console.log(comment)
		console.log(postUrl.articleId)
		
		res
			.status(201)
			.render("commentReply", {
				comment:comment,
				reply:replys,
				postUrl:postUrl.articleId,
				logined:req.session.isLogined
			})
	}
	catch(e){
		console.error(e)
		res.status(400).end()
	}
})


router.post("/post/comment/reply", auth, async (req, res) => {

	const commentId=mongoose.Types.ObjectId(req.body.commentId)  //objectid
	const content=req.body.content
	const userId=mongoose.Types.ObjectId(req.session.userId)

	const comment=await Comment.findOneById(mongoose.Types.ObjectId(req.body.commentId))

	let reply=await CommentReply.create({
		content:content,comment:commentId,article:comment.article,author:userId
		,upvoters:[],downvoters:[],
		imagedir:"",upvote:0,downvote:0,deleted:false
	})

	await Comment.addReply(commentId,reply._id)
	await UserBoardData.addReply(userId,reply._id)
	await Article.addReply(comment.article)
	res.redirect("/board/post/comment/"+req.body.commentId+"/reply")
})

router.get("/post/:postUrl", async(req, res) => {

  let post=await Article.findOneByArticleId(req.params.postUrl)

  await Article.incrementView(post.articleId)


  let comment=[]
  for(let comm of post.comments){
	if(comm.deleted && comm.replyCount===0) continue
	let authorname = await User.findUsernameById(comm.author)
	comment.push({
		canModify:(String(comm.author) === req.session.userId),
		content:comm.content,
		_id:String(comm._id),
		upvotes:comm.upvote,
		downvote:comm.downvote,
		replyCount:comm.replyCount,
		deleted:comm.deleted,
		author:authorname.username
	})
  }
  console.log(comment)
	res
		.status(201)
		.render("post", {
			comment:comment,
			url: req.params.postUrl,
			id:post._id,
			title: post.title,
			content: post.content,
      		image:post.imagedir,
      		views:post.views,
      		author:post.author.username,
			logined:req.session.isLogined
		})
})
router.get("/user/:userId", (req, res) => {
	console.log(req.params.userId)
})
router.get("/user/:userId/post", (req, res) => {
	console.log(req.params.userId)
})
router.get("/user/:userId/comment", (req, res) => {

})
module.exports = router
