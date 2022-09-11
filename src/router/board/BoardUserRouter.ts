import express = require("express")
import { auth, availabilityCheck, CommentSummary, COUNT_PER_PAGE, PostTitle, timestampToNumber } from "./helpers"

const {  Article, Comment, CommentReply } = require("../../mongodb/BoardDBHandler")


const { User } = require("../../mongodb/DBHandler")
const router = express.Router()


router.get("/:username/posts", availabilityCheck,async (req, res) => {
	try{
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0,Number(req.query.start))
		}
	
		let user = await User.findIdByUsername(req.params.username)
	
		let total=await Article.countDocuments({author:user._id});
		let postlist: PostTitle[] = await Article.findTitleOfUserByRange(start, count, user._id)
	
		res.render("board", {
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
router.get("/:username/comments",availabilityCheck, async (req, res) => {
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

		let comments = await Comment.findOfUserByRange(start, count, user._id,sortby)
		let replys = await CommentReply.findOfUserByRange(start, count, user._id,sortby)

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
				let post = await Article.getUrlById(comments[c].article)
				if (post != null) articleUrl = post.articleId

				list.push({
					type: "comment",
					id: String(comments[c]._id),
					imagedir: comments[c].imagedir,
					createdAt: comments[c].createdAt,
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
					createdAt: replys[r].createdAt,
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
			canModify: String(user._id) === req.session.userId,
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
