import { useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import "../../styles/marblestat.scss"
import { RiTrophyFill, RiZoomInLine } from "react-icons/ri"
import { useSearchParams } from "react-router-dom"


interface Statistics{
	winrate:number
}
export default function MarbleStatPage() {
	function getWinType(win: string) {
		let wintype = "파산"
		if (win === "triple") wintype = "트리플 독점"
		if (win === "line") wintype = "라인 독점"
		if (win === "sight") wintype = "관광지 독점"
		return wintype
	}
	function getMapName(map: string) {
		if (map === "god_hand") return "신의손"
		return "월드맵"
	}
	const [searchParams, setSearchParams] = useSearchParams()

	const [games, setGames] = useState<any[]>([])
	const [username,setUsername] = useState<string|null>(null)
	const [statistics,setStatistics] = useState<Statistics>({
		winrate:0
	})
	function loadUser() {
		const user = searchParams.get("userId")
		const username =  searchParams.get("username")
		setUsername(username)
		if (username)
			AxiosApi.get("/stat/marble/user?username=" + username).then((res) => {
				calcStat(res.data)
				setGames(res.data)
			})
		else if (user)
			AxiosApi.get("/stat/marble/user?userId=" + user).then((res) => {
				calcStat(res.data)
				setGames(res.data)
			})
	}
	function calcStat(games:any){
		let wins = 0
		//console.log(games)
		for(const g of games){
			if(g.isWon) wins++
		}
		setStatistics({
			winrate:games.length===0?0:wins/games.length
		})
	}
	function loadAll() {
		AxiosApi.get("/stat/marble/all").then((res) =>
			setGames(
				res.data.reverse().map((g: any) => {
					return {
						game: g,
					}
				})
			)
		)
	}

	useEffect(() => {
		if (!searchParams.has("userId") && !searchParams.has("username")) loadAll()
		else loadUser()
	}, [searchParams])

	return (
		<div id="marble-stat-root">
			<h1>모두의마블 대전기록</h1><br></br>
			{username && <h3>{"플레이어: "+username}</h3>}<br></br>
			{username && <h3>승률: {Math.floor(statistics.winrate*100)}%</h3>}<br></br>
			<div id="stat-container">
				{games.length===0 && <h2>No Statistics Found</h2>}
				{games.map((game, i) => {
					const stats = game.game
					const highlight = game.turn!==undefined ? game.turn : -1

					const winner = stats.players[stats.winner]
					
					let idx = [0, 1, 2, 3]
					let total = stats.players.length
					return (
						<div className="stat-game" key={i}>
							<div className={"stat-win " + (game.isWon===false?"lost":"")} >
								{getWinType(stats.winType)} {game.isWon===false?"패배":"승리"}
								<a style={{ color: "white" }}>{getMapName(stats.map)}</a>
								<a>{new Date(stats.createdAt).toLocaleString()}</a>
							</div>
							<div className="stat-player-container">
								<div className={"stat-player winner " + (highlight === winner.turn ? "focus" : "")}>
									<div className="stat-player-name">
										<RiTrophyFill style={{ color: "gold" }} />
										{winner.name ? winner.name : stats.winner + 1 + "P"}
									</div>
									<div className="stat-player-score">{winner.score}</div>
									<div>
										<div className="stat-player-detail-btn" data-game={stats._id} data-player={stats.winner}>
											<RiZoomInLine />
										</div>
									</div>
								</div>
								{idx.map((i: number) => {
									if (i === stats.winner) return <></>
									const player = stats.players[i]
									if (i < total)
										return (
											<div className={"stat-player " + (highlight === player.turn ? "focus" : "")} key={i}>
												<div className="stat-player-name">{player.name ? player.name : i + 1 + "P"}</div>
												<div className="stat-player-score">{player.score}</div>
												<div>
													<div className="stat-player-detail-btn" data-game={stats._id} data-player={i}>
														<RiZoomInLine />
													</div>
												</div>
											</div>
										)
									else
										return (
											<div className={"stat-player "} key={i}>
												<div className="stat-player-name">&nbsp;</div>
												<div className="stat-player-score"> &nbsp;</div>
												<div></div>
											</div>
										)
								})}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
