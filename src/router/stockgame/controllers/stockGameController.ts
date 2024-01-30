import type { Request, Response } from "express"
import { ISession } from "../../../session/inMemorySession"
import { IStockGameResult, StockGameResult } from "../../../mongodb/StockGameSchema"
import { StockGameSchema } from "../../../mongodb/schemaController/StockGame"
import { UserRelationSchema } from "../../../mongodb/schemaController/UserRelation"
import { MongoId } from "../../../mongodb/types"
import { UserCache } from "../../../cache/cache"
import { IPassedFriend, IStockGameResultResponse } from "../../ResponseModel"
import { isNumber } from "../../board/helpers"
import { StockGameUserSchema } from "../../../mongodb/schemaController/StockGameUser"
import { NotificationSchema } from "../../../mongodb/schemaController/Notification"

export namespace StockGameController {
	const LEADERBOARD_PAGE_SIZE = 100

    export async function resetBestScores(req: Request, res: Response) {
        await StockGameSchema.resetAllBest()
    }
	export async function getResult(req: Request, res: Response) {
		const gameId = req.query.gameId
        if(!gameId){
            res.status(400).end("game id is required")
            return
        }
		const result = StockGameSchema.getRecordById(String(gameId))
		if (!result) res.status(404).end()
		else res.json({ result: result }).end()
	}

	export async function getLeaderboard(req: Request, res: Response) {
		const loggedIn = req.query.loggedIn ? Boolean(req.query.loggedIn) : false
		const allTime = req.query.allTime ? Boolean(req.query.allTime) : false
		const start = req.query.start ? Number(req.query.start) : 0

		const result = await StockGameSchema.getLeaderboard(loggedIn, allTime, start, LEADERBOARD_PAGE_SIZE)

		res.json({ result: result }).end()
	}
	export async function getUserAllTimeBest(req: Request, res: Response) {
		const userId = req.query.userId
		if (!userId) {
			res.status(404).end()
			return
		}
		const result = await StockGameSchema.findAllTimeBestByUser(String(userId))
		res.json({ result: result }).end()
	}
	export async function getUserResults(req: Request, res: Response) {
		const userId = req.query.userId
		if (!userId) {
			res.status(404).end()
			return
		}
		const records = await StockGameSchema.findRecordsByUser(String(userId))
		const best = await StockGameSchema.findRecentBestByUser(String(userId))

		res
			.json({
				records: records,
				best: best,
			})
			.end()
	}
	export async function getFriendBestScores(req: Request, res: Response, session: ISession) {
		const friends = (await UserRelationSchema.findFriends(session.userId)) as string[]
		friends.push(session.userId)

		const friendScores = await StockGameSchema.findBestsByUsers(friends)
		res.json({ result: friendScores }).end()
	}
	export async function getPosition(req: Request, res: Response) {
		const gameId = req.query.gameId
        const allTime = req.query.allTime ? Boolean(req.query.allTime) : false

		if (!gameId) {
			res.status(400).end("gameid or score is required")
			return
		}
		const score = (await StockGameSchema.getRecordById(String(gameId))).score
		const [better, total] = allTime? await StockGameSchema.getGlobalRank(score): await StockGameSchema.getRecentRank(score)

		res.json({ better: better, total: total }).end()
	}

	async function getPassedFriends(session: ISession, newScore: number, oldScore: number): Promise<IPassedFriend[]> {
		const friends = await UserRelationSchema.findFriends(session.userId)
		const passedscores = await StockGameSchema.findBestsByUsersInScoreRange(friends as MongoId[], oldScore, newScore)

		return passedscores.map((s) => {
			return { score: s.score, username: s.username, userId: String(s.user) }
		})
	}

	export async function postResult(req: Request, res: Response, session: ISession) {
		const game = req.body.result
		if (!game || (!session.isLogined && !req.body.username)) {
			res.status(400).end("empty result or username")
			return
		}
		const username = session.isLogined ? session.username : req.body.username

		const gameresult = {...game,
			user: session.isLogined ? session.userId : null
		}

		const gamedata = await StockGameResult.create(gameresult)
		if (!gamedata) {
			res.status(500).end("failed to save result")
			return
		}
		let result: IStockGameResultResponse = {
			better: 0,
			total: 0,
			passedFriends: [],
			_id: String(gamedata._id),
			score: gamedata.score,
			isNewBest: false,
		}
		if (session.isLogined) {
			StockGameUserSchema.incrementTotalGames(session.userId)

			const lastbest = await StockGameSchema.findRecentBestByUser(session.userId)
			let updated = false
			if (!lastbest) {
				await StockGameSchema.setBest(username, gamedata._id, gamedata.score, true, session.userId)
				updated = true
			} else if (lastbest.score < gamedata.score) {
				await StockGameSchema.updateBest(lastbest._id, gamedata._id, gamedata.score)
				updated = true
			}
			if (updated) {
				result.isNewBest = true
				const passed = await getPassedFriends(session, gamedata.score, lastbest ? lastbest.score : 0)
				result.passedFriends = passed

				//send notifications for surpassing best score
				for(const friend of passed){
					NotificationSchema.stockGameSurpass(friend.userId,session.username,gamedata.score).then()
				}
			}
		} else {
			result.isNewBest = true
			await StockGameSchema.setBest(username, gamedata._id, gamedata.score, false)
		}

		const [better, total] = await StockGameSchema.getGlobalRank(gamedata.score)
		result.better = better
		result.total = total

		res.json(result)
	}
}
