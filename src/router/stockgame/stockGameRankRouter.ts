import express = require("express")
import { ControllerWrapper, NoSessionControllerWrapper } from "../ControllerWrapper"
const router = express.Router()
import { loginauth, sessionParser } from "../jwt/auth"
import { adminauth } from "../board/helpers"
import { StockGameController } from "./controllers/stockGameController"

/**
 * 
 */
router.get("/leaderboard", NoSessionControllerWrapper(StockGameController.getLeaderboard))

/**
 * return position(# of better scores, # of total scores) of a game
 */
router.get("/position/bygame", NoSessionControllerWrapper(StockGameController.getPositionByGame))


router.get("/leaderboard", NoSessionControllerWrapper(StockGameController.getLeaderboard))

/**
 * return position(# of better scores, # of total scores) of a score
 */
router.get("/position/byscore", NoSessionControllerWrapper(StockGameController.getPositionByScore))


/**
 * return all friends' best scores
 */
router.get("/friends", loginauth, sessionParser, ControllerWrapper(StockGameController.getFriendBestScores))

/**
 * (admin only)  make all recent best scores to non-recent
 */
router.post("/reset", adminauth,sessionParser,ControllerWrapper(StockGameController.resetBestScores))

module.exports = router
