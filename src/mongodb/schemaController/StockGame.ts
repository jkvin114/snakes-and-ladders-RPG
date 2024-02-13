import { IStockGameResult, StockGameBestScore, StockGameResult } from "../StockGameSchema"
import { MongoId } from "../types"

export namespace StockGameSchema {
	export function getRecordById(gameId: MongoId) {
		return StockGameResult.findById(gameId).select("score user transactionHistory createdAt")
	}
	export function setBest(username: string, game: MongoId, score: number, loggedIn: boolean, user?: MongoId) {
		return StockGameBestScore.create({
			user: user,
			game: game,
			score: score,
			username: username,
			loggedIn: loggedIn,
			isRecent: true,
			scoredAt:new Date()
		})
	}
	export function updateBest(id: MongoId, game: MongoId, score: number) {
		return StockGameBestScore.findByIdAndUpdate(id, {
			game: game,
			score: score,
			scoredAt:new Date()
		})
	}
    /**
     * make all recent best scores to non-recent
     * @returns 
     */
	export function resetAllBest() {
		return StockGameBestScore.updateMany({ isRecent: true }, { isRecent: false })
	}
	/**
	 * r
	 * @param user 
	 * @returns single recent best score of user, with game populated (initialMoney finalTotal delistAt)
	 */
	export function findRecentBestByUser(user: MongoId) {
		return StockGameBestScore.findOne({ isRecent: true, user: user })
		.populate<{ game:IStockGameResult}>("game","initialMoney finaltotal delistAt")
	}
	/**
	 * 
	 * @param user 
	 * @returns single all-time best score of user, with game populated (initialMoney finalTotal delistAt)
	 */
	export async function findAllTimeBestByUser(user: MongoId) {
		return (await StockGameBestScore.find({ user: user }).sort({ score: "desc" }).limit(1)
		.populate<{ game:IStockGameResult}>("game","initialMoney finaltotal delistAt"))[0]
	}
	/**
	 * fields returned: [score initialMoney finaltotal user transactionHistory delistAt createdAt updatedAt]
	 * limit: 100
	 * @param user 
	 * @returns all records of user, sorted in desc
	 */
	export function findRecordsByUser(user: MongoId) {
		return StockGameResult.find({ user: user }).sort({ createdAt: "desc" })
		.limit(100)
		.select("score initialMoney finaltotal user transactionHistory delistAt createdAt updatedAt")
	}

	export function countUserRecord(user: MongoId){
		return StockGameResult.count({ user: user })
	}

	/**
	 *
	 * @returns rank of a score based on the list of all scores including non-best and non-recent scores
	 * [# of games better than score, # of total games]
	 */
	export async function getGlobalRank(score: number): Promise<[number, number]> {
		let total = await StockGameResult.countDocuments({})
		let greater = await StockGameResult.countDocuments({ score: { $gt: score } })
		return [greater, total]
	}
    /**
	 *
	 * @returns rank of a score based on best recent scores
	 * [# of games better than score, # of total games]
	 */
    export async function getRecentRank(score: number): Promise<[number, number]>  {
        let total = await StockGameBestScore.countDocuments({isRecent:true})
		let greater = await StockGameBestScore.countDocuments({isRecent:true, score: { $gt: score } })
		return [greater, total]
    }
	/**
	 * 
	 * @param users 
	 * @returns best scores of users and loggedin=true and recent=true
	 */
	export function findBestsByUsers(users: MongoId[]) {
		return StockGameBestScore
        .find({ user: { $in: users }, loggedIn: true, isRecent: true })
			.sort({ score: "desc" })
	}
	export function findBestsByUsersInScoreRange(users: MongoId[], min: number, max: number) {
		return StockGameBestScore
        .find({ user: { $in: users }, loggedIn: true, isRecent: true, score: { $gt: min, $lt: max } })
			.sort({ score: "desc" })
	}
	/**
	 * return number of friends that has better score
	 * @param users 
	 * @param score 
	 * @returns 
	 */
	export function findRankInUsers(users: MongoId[],score:number) {
		return StockGameBestScore
        .countDocuments({ user: { $in: users },score: { $gt: score }, loggedIn: true, isRecent: true })
	}
	export function getLeaderboard(loggedIn: boolean, allTime: boolean, start: number, count: number) {
		let filter = { loggedIn: loggedIn, isRecent: true }
		if (allTime) delete filter.isRecent
        if (!loggedIn) delete filter.loggedIn

		return StockGameBestScore.find(filter).sort({ score: "desc" }).skip(start).limit(count)
	}
}
