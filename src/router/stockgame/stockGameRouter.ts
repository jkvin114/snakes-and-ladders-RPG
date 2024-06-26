import express = require("express")
import { ControllerWrapper, NoSessionControllerWrapper } from "../ControllerWrapper"
const router = express.Router()
import { StockGameController } from "./controllers/stockGameController"
import { sessionParser } from "../jwt/auth"

router.post("/result", sessionParser, ControllerWrapper(StockGameController.postResult))

/**
 * get detailed result by id
 */
router.get("/result", NoSessionControllerWrapper(StockGameController.getResult))

/**
 * get user data (all records, recent best score)
 */
router.get("/profile/:userId", NoSessionControllerWrapper(StockGameController.getUserResults))


/**
 * get all-time best of a user
 */
router.get("/userbest", NoSessionControllerWrapper(StockGameController.getUserAllTimeBest))

/**
 * generate stock chart from python flask service
 */
router.get("/generate", sessionParser, ControllerWrapper(StockGameController.generateChart))

router.use("/rank", require("./stockGameRankRouter"))
router.use("/user", require("./stockGameUserRouter"))

module.exports = router
