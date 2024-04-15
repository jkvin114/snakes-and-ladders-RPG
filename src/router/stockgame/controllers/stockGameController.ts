import type { Request, Response } from "express"
import { ISession } from "../../../session/inMemorySession"
import { IStockGameResult, StockGameResult } from "../../../mongodb/StockGameSchema"
import { StockGameSchema } from "../../../mongodb/schemaController/StockGame"
import { UserRelationSchema } from "../../../mongodb/schemaController/UserRelation"
import { MongoId } from "../../../mongodb/types"
import { UserCache } from "../../../cache/cache"
import { IPassedFriend,  IStockGameBestScoreResponse,  IStockGameBestScoreResponsePopulated,  IStockGameFriendScore, IStockGameResultResponse, IStockGameUserRecordResponse } from "../../ResponseModel"
import { isNumber } from "../../board/helpers"
import { StockGameUserSchema } from "../../../mongodb/schemaController/StockGameUser"
import { NotificationSchema } from "../../../mongodb/schemaController/Notification"
import { generateStockChart } from "../../../fetch/fetch"
import { NotificationController } from "../../../social/notificationController"

export namespace StockGameController {
	const LEADERBOARD_PAGE_SIZE = 100
	const version = "2"
	export async function generateChart(req: Request, res: Response, session: ISession) {
		const variance = req.query.variance
		const scale = req.query.scale
		const data = await generateStockChart(Number(variance),Number(scale),String(version))
		if(!data){
			res.status(500).end()
		}
		else
			res.json(data)
	}

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
		const loggedIn = req.query.loggedIn ==="true"
		const allTime = req.query.allTime ==="true"
		const start = req.query.start ? Number(req.query.start) : 0

		const result = await StockGameSchema.getLeaderboard(loggedIn, allTime, start, LEADERBOARD_PAGE_SIZE)

		res.json({ result: result }).end()
	}
	export async function getUserLobbyInfo(req: Request, res: Response,session:ISession) {
		const userId = session.userId
		const alltime = await StockGameSchema.findAllTimeBestByUser(String(userId))
		const records = await StockGameSchema.findRecordsByUser(String(userId))
		const best = await StockGameSchema.findRecentBestByUser(String(userId))
		const count = await StockGameSchema.countUserRecord(String(userId))
		res
			.json({
				records: records as IStockGameUserRecordResponse[],
				best: best as IStockGameBestScoreResponsePopulated,
				alltimeBest: alltime as IStockGameBestScoreResponsePopulated,
				recordCount: count 
			})
			.end()
	}
	export async function getUserAllTimeBest(req: Request, res: Response) {
		const userId = req.query.userId
		if (!userId) {
			res.status(404).end()
			return
		}
		const result = await StockGameSchema.findAllTimeBestByUser(String(userId))
		res.json({ result: result as IStockGameBestScoreResponsePopulated }).end()
	}
	export async function getUserResults(req: Request, res: Response) {
		const userId = req.params.userId
		if (!userId) {
			res.status(404).end()
			return
		}
		const records = await StockGameSchema.findRecordsByUser(String(userId))
		const best = await StockGameSchema.findRecentBestByUser(String(userId))
		const count = await StockGameSchema.countUserRecord(String(userId))
		const user = await UserCache.getUser(String(userId))
		res
			.json({
				records: records.slice(0,10) as IStockGameUserRecordResponse[],
				best: best as IStockGameBestScoreResponsePopulated,
				recordCount: count ,
				username:user.username,
				profileImgDir:user.profileImgDir
			})
			.end()
	}
	export async function getFriendBestScores(req: Request, res: Response, session: ISession) {
		const friends = (await UserRelationSchema.findFriends(session.userId)) as MongoId[]
		friends.push(session.userId)

		const friendScores = await StockGameSchema.findBestsByUsers(friends)
		let result:IStockGameFriendScore[] = []
		const hasScore = new Set<string>()
		for(const friend of friendScores){
			const user = await UserCache.getUser(friend.user)
			hasScore.add(String(friend.user))
			result.push({
				user:String(friend.user),
				username:user.username,
				profileImgDir:user.profileImgDir,
				score:friend.score,
				game:String(friend.game),
			})
		}
		// console.log(hasScore)
		// console.log(friends)
		for(const id of friends){
			if(hasScore.has(String(id))) continue
			const user = await UserCache.getUser(id)
			result.push({
				user:String(id),
				username:user.username,
				profileImgDir:user.profileImgDir
			})
		}	
		res.json(result).end()
	}
	export async function getPositionByGame(req: Request, res: Response) {
		const gameId = req.query.gameId
        const allTime = req.query.allTime ? Boolean(req.query.allTime) : false

		if (!gameId) {
			res.status(400).end("gameid is required")
			return
		}
		const score = (await StockGameSchema.getRecordById(String(gameId))).score
		const [better, total] = allTime? await StockGameSchema.getGlobalRank(score): await StockGameSchema.getRecentRank(score)

		res.json({ better: better, total: total }).end()
	}
	export async function getPositionByScore(req: Request, res: Response) {
		const score = Number(req.query.score)
        const allTime = req.query.allTime ? Boolean(req.query.allTime) : false

		if (!score) {
			res.status(400).end("score is required")
			return
		}
		const [better, total] = allTime? await StockGameSchema.getGlobalRank(score): await StockGameSchema.getRecentRank(score)

		res.json({ better: better, total: total }).end()
	}

	async function getPassedFriendsAndRank(session: ISession, newScore: number, oldScore: number): Promise<[IPassedFriend[],number]> {
		const friends = await UserRelationSchema.findFriends(session.userId)
		const passedscores = await StockGameSchema.findBestsByUsersInScoreRange(friends as MongoId[], oldScore, newScore)
		const rank = await StockGameSchema.findRankInUsers(friends as MongoId[],newScore)
		return [passedscores.map((s) => {
			return { score: s.score, username: s.username, userId: String(s.user) }
		}),rank+1]
	}

	export async function postResult(req: Request, res: Response, session: ISession) {
		const game = req.body.result
		if (!game || (!session.isLogined && !req.body.username)) {
			res.status(400).end("empty result or username")
			return
		}
		const username = session.isLogined ? session.username : req.body.username

		const gameresult = {...game,
			user: session.isLogined ? session.userId : null,
			chartgenVersion:version
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
			friendRanking:0,
			_id: String(gamedata._id),
			score: gamedata.score,
			isNewBest: false,
		}
		if (session.isLogined) {
			StockGameUserSchema.incrementTotalGames(session.userId).then()

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
				const [passed,rank] = await getPassedFriendsAndRank(session, gamedata.score, lastbest ? lastbest.score : 0)
				result.passedFriends = passed
				result.friendRanking = rank
				//send notifications for surpassing best score
				for(const friend of passed){
					NotificationSchema.stockGameSurpass(friend.userId,session.username,gamedata.score).then()
					NotificationController.addToCache(friend.userId)
				}
			}
		} else {
			result.isNewBest = true
			await StockGameSchema.setBest(username, gamedata._id, gamedata.score, false)
		}

		const [better, total] = await StockGameSchema.getRecentRank(gamedata.score)
		result.better = better
		result.total = total

		res.json(result)
	}
}
