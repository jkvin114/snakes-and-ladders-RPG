import express = require("express")
// import { R } from "../RoomStorage"
const router = express.Router()
import { PostSchema } from "./schemaController/Post"
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
	let total=await PostSchema.countDocuments({});

	PostSchema.findSummaryByRange(start, count)
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
router.use("/user", require("./BoardUserRouter"))
router.use("/comment", require("./BoardCommentRouter"))
router.use("/reply", require("./BoardReplyRouter"))
router.use("/post", require("./BoardPostRouter"))


module.exports = router
