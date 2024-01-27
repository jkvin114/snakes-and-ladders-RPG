import express = require("express")
import {  availabilityCheck, voteController ,ContentType, postRoleChecker} from "./helpers"
import { ImageUploader } from "../../mongodb/mutler"
import { loginauth, sessionParser } from "../jwt/auth"
import { ControllerWrapper } from "../ControllerWrapper"
import { BoardPostController } from "./controller/BoardPostController"



const router = express.Router()

// console.log(ajaxauth)
router.post("/vote", loginauth,sessionParser, async (req: express.Request, res: express.Response) => voteController(req,res,ContentType.POST))

router.post("/write", loginauth,sessionParser, ControllerWrapper(BoardPostController.writePost))
router.get("/edit/:postUrl", loginauth,sessionParser, ControllerWrapper(BoardPostController.getEditPost))
router.post("/edit", loginauth,sessionParser, ControllerWrapper(BoardPostController.editPost))
router.post("/comment", loginauth,sessionParser, ControllerWrapper(BoardPostController.addComment,201))
router.post("/comment/reply", loginauth,sessionParser,ControllerWrapper(BoardPostController.addReply,201))

router.post("/delete", loginauth,sessionParser,ControllerWrapper(BoardPostController.deletePost))
router.post("/comment/delete", loginauth,sessionParser,ControllerWrapper(BoardPostController.deleteComment))
router.post("/reply/delete", loginauth,sessionParser, ControllerWrapper(BoardPostController.deleteReply))
router.post("/image", loginauth,sessionParser,ImageUploader.upload.single("img"),ControllerWrapper(BoardPostController.uploadImage))


router.get("/comment/:commentId/reply",availabilityCheck,sessionParser, ControllerWrapper(BoardPostController.getReply))
router.get("/:postUrl",availabilityCheck,sessionParser, postRoleChecker,ControllerWrapper(BoardPostController.getPost))
router.get("/content/:postUrl",availabilityCheck,sessionParser, postRoleChecker,ControllerWrapper(BoardPostController.getPostContent))

module.exports = router
