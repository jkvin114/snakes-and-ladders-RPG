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
		})
	}
	export function updateBest(id: MongoId, game: MongoId, score: number) {
		return StockGameBestScore.findByIdAndUpdate(id, {
			game: game,
			score: score,
		})
	}
    /**
     * make all recent best scores to non-recent
     * @returns 
     */
	export function resetAllBest() {
		return StockGameBestScore.updateMany({ isRecent: true }, { isRecent: false })
	}
	export function findRecentBestByUser(user: MongoId) {
		return StockGameBestScore.findOne({ isRecent: true, user: user })
	}
	export async function findAllTimeBestByUser(user: MongoId) {
		return (await StockGameBestScore.find({ user: user }).sort({ score: "desc" }))[0]
	}
	export function findRecordsByUser(user: MongoId) {
		return StockGameResult.find({ user: user }).sort({ createdAt: "desc" })
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

	export function getLeaderboard(loggedIn: boolean, allTime: boolean, start: number, count: number) {
		let filter = { loggedIn: loggedIn, isRecent: true }
		if (allTime) delete filter.isRecent
        if (!loggedIn) delete filter.loggedIn

		return StockGameBestScore.find(filter).sort({ score: "desc" }).skip(start).limit(count)
	}
}
