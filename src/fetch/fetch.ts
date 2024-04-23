import fetch from "node-fetch"
import { Logger } from "../logger"
// import {stockgame_gen_url,prediction_url} from "../../config/config.json"
require("dotenv").config({ path: __dirname + "/../config/.env" })
const prediction_url = process.env.PREDICTION_URL
const URL = prediction_url + "/prediction"
console.log("prediction url: " + prediction_url)
const stockgame_host = (process.env.STOCKGAME_URL ? process.env.STOCKGAME_URL : "http://127.0.0.1:5050")
console.log("stockgame url: " + stockgame_host)

export function extractNumber(str: string) {
	let s = str.match(/([0-9,.,\s]+)/g)?.join("")
	if (!s) return ""
	return s.replace(/[\s]{2,}/g, " ")
}

export async function getPrediction(labels: string, playercount: number, map: number) {
	return new Promise<string[]>(async (resolve, reject) => {
		try {
			let response = await fetch(URL + `?count=${String(playercount)}&map=${map}&labels=${labels}`)
			const body = await response.text()
			if (body[0] === "[") {
				resolve(extractNumber(body).split(", "))
			} else resolve([])
		} catch (e) {
			Logger.error("ERROR while fetching win prediction data", e)
			return resolve([])
		}
		return resolve([])
	})
}

export async function generateStockChart(variance: number, scale: number, version: string) {
	return new Promise<string[]>(async (resolve, reject) => {
		try {
			const data = await (
				await fetch(stockgame_host, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						variance: variance,
						scale: scale,
						version: version,
					}),
				})
			).json()

			resolve(data)
		} catch (e) {
			Logger.error("ERROR while fetching generating stock chart", e)
			return resolve(null)
		}
		return resolve(null)
	})
}
