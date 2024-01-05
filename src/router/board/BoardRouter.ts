import express = require("express")
const router = express.Router()
import { ImageUploader } from "../../mongodb/mutler"
import { auth, availabilityCheck } from "./helpers"

import { loginauth, sessionParser } from "../jwt/auth"
import { ControllerWrapper } from "../ControllerWrapper"
import { BoardController } from "./controller/BoardController"

router.post("/uploadimg",availabilityCheck, auth, ImageUploader.upload.single("img"), async (req: express.Request, res: express.Response) => {
	const imgfile = req.file
	console.log(imgfile)
	// console.log(req.body.content)
	res.status(201).send({
		message: "Uploaded image successfully",
		fileInfo: req.file
	})
})


router.get("/", availabilityCheck,sessionParser,ControllerWrapper(BoardController.allPost))
router.get("/mypage", loginauth,sessionParser, (req: express.Request, res: express.Response) => {
	const session = res.locals.session
	res.redirect("/board/user/" + session.username + "/posts")
})

router.post("/bookmark", loginauth,sessionParser,ControllerWrapper(BoardController.addBookmark))

router.use("/user", require("./BoardUserRouter"))
router.use("/comment", require("./BoardCommentRouter"))
router.use("/reply", require("./BoardReplyRouter"))
router.use("/post", require("./BoardPostRouter"))


module.exports = router
