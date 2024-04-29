import { useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import "../../styles/marblestat.scss"
import { RiTrophyFill, RiZoomInLine } from "react-icons/ri"
import { useSearchParams } from "react-router-dom"
import MarbleGame from "../stat/MarbleGame"


interface Statistics{
	winrate:number
}
export default function MarbleStatPage() {
	
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
			AxiosApi.get("/api/stat/marble/user?username=" + username).then((res) => {
				calcStat(res.data)
				setGames(res.data)
			})
		else if (user)
			AxiosApi.get("/api/stat/marble/user?userId=" + user).then((res) => {
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
		AxiosApi.get("/api/stat/marble/all").then((res) =>
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
				{games.map((game, i) => <MarbleGame  key={i} game={game}/>)}
			</div>
		</div>
	)
}
