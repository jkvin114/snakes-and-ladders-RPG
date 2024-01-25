import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AxiosApi } from "../../api/axios"
import { RPGPlayerStat } from "../../types/stat"
import "../../styles/rpgstat.scss"
import RPGItem from "../stat/RPGItem"
import { getDateStringDifference } from "../../util"

interface Statistics {
	winrate: number
}

function multiKillText(count: number) {
	let multiKillText = ""
	if (count >= 2) {
		multiKillText = "Double Kill"
	}
	if (count >= 3) {
		multiKillText = "Triple Kill"
	}
	if (count >= 4) {
		multiKillText = "Quadra Kill"
	}
	if (count >= 5) {
		multiKillText = "Penta Kill"
	}
	return multiKillText
}

export default function RPGPlayerStatPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [games, setGames] = useState<RPGPlayerStat[]>([])
	const [username, setUsername] = useState<string | null>(null)
	const [statistics, setStatistics] = useState<Statistics>({
		winrate: 0,
	})
    const [setting,setSetting] = useState<any>(null)

    /**
     * get character img url for each character
     * @param {*} champ_id
     * @returns
     */
    function getCharImgUrl(champ_id:number) {
        if (champ_id === undefined || !setting) return ""
        return "res/img/character/illust/" + setting.characters[champ_id].illustdir
    }

	async function load() {
		const user = searchParams.get("userId")
		const username = searchParams.get("username")
		setUsername(username)
		let url = null
		if (username) url = "/stat/game/user?username=" + username
		else if (user) url = "/stat/game/user?userId=" + user

        let settings = await AxiosApi.get("/resource/globalsetting")
        setSetting(settings.data)
		if (url) AxiosApi.get(url).then((res) => onload(res.data))
	}
	function onload(game: RPGPlayerStat[]) {
		calcStat(game)
		setGames(game)
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
	useEffect(()=>{load()}, [searchParams])
	return (
		<div id="rpg-stat-root">
			{username && <h3>{"Player: " + username}</h3>}<br></br>
			<div id="stat-container">
				{games.map((g, i) => (
					<div key={i} className="game-item divlink">
						<a className="divlink" href={"/stat?type=game&statid=" + g.gameId + "&turnfocus=" + g.turn}></a>
						<div className={"game-header " + (g.isWon ? "" : "lost")}>
							<div>{g.isWon ? "Win" : "Lose"}</div>
							<a>{g.totalturn}T</a>
						</div>
						<div className="game-content">
							<div>
								<div className="charimg">
									<img src={getCharImgUrl(g.player.champ_id)}></img>
								</div>
								<b className="kda">{`${g.player.kill}/${g.player.death}/${g.player.assist}`}</b>
							</div>
							<div>
								<RPGItem items={g.player.items} />
							</div>
						</div>
						<div className="game-desc">
							<div>{g.map} map</div>
							<div>{getDateStringDifference(g.createdAt,Date.now())} ago</div>
								{g.player.bestMultiKill>=2 && 
									<b className="multikill-text" data-lkey="multikill.double">
										{multiKillText(g.player.bestMultiKill)}
									</b>
								}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
