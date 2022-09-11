import express = require("express")
// import { R } from "../RoomStorage"
const router = express.Router()
const { UserBoardData, Article, Comment, CommentReply } = require("../../mongodb/BoardDBHandler")
import { upload } from "../../mongodb/mutler"
import { auth, availabilityCheck, COUNT_PER_PAGE, PostTitle } from "./helpers"

// const { User } = require("../mongodb/DBHandler")

router.post("/uploadimg",availabilityCheck, auth, upload.single("img"), async (req, res) => {
	const imgfile = req.file
	console.log(imgfile)
	// console.log(req.body.content)
	res.status(201).send({
		message: "Uploaded image successfully",
		fileInfo: req.file
	})
})


router.get("/", availabilityCheck,async (req, res) => {

	//cleanUpComments()
	let start = 0
	let count = COUNT_PER_PAGE
	if (req.query.start) {
		start  = Math.max(0,Number(req.query.start))
	}
	let total=await Article.countDocuments({});

	Article.findTitleByRange(start, count)
		.then((data: PostTitle[]) => {
			res.render("board", {
				posts: data,
				logined: req.session.isLogined,
				user: null,
				count:count,
				start:start,
				isEnd:(start+count > total)
			})
		})
		.catch((err: any) => res.status(500).redirect("/"))
})
router.get("/mypage", availabilityCheck,auth, (req, res) => {
	res.redirect("/board/user/" + req.session.username + "/posts")
})



module.exports = router
