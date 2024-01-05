import express = require("express")

import { availabilityCheck } from "./helpers"

import { sessionParser } from "../jwt/auth"
import { ControllerWrapper } from "../ControllerWrapper"
import { BoardUserController } from "./controller/BoardUserController"
const router = express.Router()


router.get("/:username/posts", availabilityCheck,sessionParser,ControllerWrapper(BoardUserController.allPost))

router.get("/:username/likes", availabilityCheck,sessionParser,ControllerWrapper(BoardUserController.likes))

router.get("/:username/bookmarks", availabilityCheck,sessionParser,ControllerWrapper(BoardUserController.bookmarks))

router.get("/:username/comments",availabilityCheck, sessionParser,ControllerWrapper(BoardUserController.comments))

module.exports = router
