import express = require("express")
import { ControllerWrapper, NoSessionControllerWrapper } from "../ControllerWrapper"
const router = express.Router()
import { loginauth, sessionParser } from "../jwt/auth"
import { StockGameUserController } from "./controllers/stockGameUserController"

/**
 * get detailed result by id
 */
router.get("/:userId",loginauth, NoSessionControllerWrapper(StockGameUserController.findUser))

module.exports = router
