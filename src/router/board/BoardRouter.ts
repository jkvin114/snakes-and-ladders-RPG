import express = require("express")
// import { R } from "../RoomStorage"
const router = express.Router()
import { PostSchema } from "./schemaController/Post"
import { ImageUploader } from "../../mongodb/mutler"
import { auth, availabilityCheck, COUNT_PER_PAGE, filterPostSummary, PostTitle } from "./helpers"
import { UserBoardDataSchema } from "./schemaController/UserData"
import { SchemaTypes } from "../../mongodb/SchemaTypes"
const  {User}  = require("../../mongodb/DBHandler")

// const { User } = require("../mongodb/DBHandler")

router.post("/uploadimg",availabilityCheck, auth, ImageUploader.upload.single("img"), async (req: express.Request, res: express.Response) => {
	const imgfile = req.file
	console.log(imgfile)
	// console.log(req.body.content)
	res.status(201).send({
		message: "Uploaded image successfully",
		fileInfo: req.file
	})
})


router.get("/", availabilityCheck,async (req: express.Request, res: express.Response) => {

	//cleanUpComments()
	let start = 0
	let count = COUNT_PER_PAGE
	if (req.query.start) {
		start  = Math.max(0,Number(req.query.start))
	}
	let total=await PostSchema.countDocuments({});
 
	let data:SchemaTypes.Article[]=(await PostSchema.findSummaryByRange(start, count))
	data=await filterPostSummary(req.session,data,false)

	res.render("postlist", {
		displayType:"all",
		posts: data,
		logined: req.session.isLogined,
		user: null,
		count:count,
		start:start,
		isEnd:(start+count > total)
	})
})
router.get("/mypage", availabilityCheck,auth, (req: express.Request, res: express.Response) => {
	res.redirect("/board/user/" + req.session.username + "/posts")
})
router.post("/bookmark", auth,async  (req: express.Request, res: express.Response) => {
	const user = await User.getBoardData(req.session.userId)
	const bookmarks = await UserBoardDataSchema.getBookmarks(user.boardData)
	if(!bookmarks) {
		return
	}
	if(bookmarks.bookmarks.some((id:any)=>String(id)===req.body.id)){
		await UserBoardDataSchema.removeBookmark(user.boardData,req.body.id)
		res.status(200).json({ change: -1 })
	}
	else{
		await UserBoardDataSchema.addBookmark(user.boardData,req.body.id)
		res.status(200).json({ change: 1 })
	}
})

router.use("/user", require("./BoardUserRouter"))
router.use("/comment", require("./BoardCommentRouter"))
router.use("/reply", require("./BoardReplyRouter"))
router.use("/post", require("./BoardPostRouter"))


module.exports = router
