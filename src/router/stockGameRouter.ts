import express = require("express")
import { ControllerWrapper, NoSessionControllerWrapper } from "./ControllerWrapper"
const router = express.Router()
import { StockGameController } from "../stockgame/stockGameController"
import { sessionParser } from "./jwt/auth"

router.post("/result", sessionParser, ControllerWrapper(StockGameController.postResult))

/**
 * get detailed result by id
 */
router.get("/result", NoSessionControllerWrapper(StockGameController.getResult))

/**
 * get user data (all records, recent best score)
 */
router.get("/user", NoSessionControllerWrapper(StockGameController.getUserResults))

/**
 * get all-time best of a user
 */
router.get("/userbest", NoSessionControllerWrapper(StockGameController.getUserAllTimeBest))

router.use("/rank", require("./stockGameRankRouter"))
module.exports = router
