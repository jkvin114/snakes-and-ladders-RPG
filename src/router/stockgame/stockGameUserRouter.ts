import express = require("express")
import { ControllerWrapper, NoSessionControllerWrapper } from "../ControllerWrapper"
const router = express.Router()
import { loginauth, sessionParser } from "../jwt/auth"
import { StockGameUserController } from "./controllers/stockGameUserController"
import { StockGameController } from "./controllers/stockGameController"

/**
 * get detailed result by id
 */
router.get("/info/:userId", NoSessionControllerWrapper(StockGameUserController.findUser))

/**
 * get best scores of friends based on current session
 */
router.get("/friends",loginauth, sessionParser,ControllerWrapper(StockGameController.getFriendBestScores))

/**
 * get my lobby data based on current session
 */
router.get("/mylobby",loginauth, sessionParser, ControllerWrapper(StockGameController.getUserLobbyInfo))

module.exports = router
