import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AxiosApi } from "../../api/axios"
import { RPGPlayerStat } from "../../types/stat"
import "../../styles/rpgstat.scss"
import RPGItem from "../stat/RPGItem"
import { getDateStringDifference } from "../../util"
import RPGGameStat from "../stat/RPGGame"

interface Statistics {
	winrate: number
}

export default function RPGPlayerStatPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [games, setGames] = useState<RPGPlayerStat[]>([])
	const [username, setUsername] = useState<string | null>(null)
	const [statistics, setStatistics] = useState<Statistics>({
		winrate: 0,
	})
	const [setting, setSetting] = useState<any>(null)

	async function load() {
		const user = searchParams.get("userId")
		const username = searchParams.get("username")
		setUsername(username)
		let url = null
		if (username) url = "/api/stat/game/user?username=" + username
		else if (user) url = "/api/stat/game/user?userId=" + user

		let settings = await AxiosApi.get("/resource/globalsetting")
		setSetting(settings.data)
		if (url) AxiosApi.get(url).then((res) => onload(res.data))
	}
	function onload(game: RPGPlayerStat[]) {
		calcStat(game)
		setGames(game)
	}
	/**
	 * get character img url for each character
	 * @param {*} champ_id
	 * @returns
	 */
	function getCharImgUrl(champ_id: number) {
		if (champ_id === undefined || !setting) return ""
		return "res/img/character/illust/" + setting.characters[champ_id].illustdir
	}
	function calcStat(games: RPGPlayerStat[]) {
		let wins = 0

		// console.log(games)
		for (const g of games) {
			if (g.isWon) wins++
		}
		setStatistics({
			winrate: games.length === 0 ? 0 : wins / games.length,
		})
	}
	useEffect(() => {
		load()
	}, [searchParams])
	return (
		<div id="rpg-stat-root">
			{username && <h3>{"Player: " + username}</h3>}
			<br></br>
			<div id="stat-container">
				{games.map((g, i) => (
					<RPGGameStat key={i} g={g} getCharImgUrl={getCharImgUrl} />
				))}
			</div>
		</div>
	)
}
