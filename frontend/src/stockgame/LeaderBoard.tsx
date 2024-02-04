import { useContext, useEffect, useState } from "react"
import { AxiosApi } from "../api/axios"
import { ILeaderboard } from "./types/stat"
import { addCommas, getDateStringDifference } from "../util"
import { RootContext } from "../context/context"
import "./../styles/stockgame/leaderboard.scss"
import "./../styles/stockgame/table.scss"

import { RiCheckboxCircleFill } from "react-icons/ri"
type State={
    loggedIn:boolean
    allTime:boolean
    start:number
}

export default function StockGameLeaderboard() {
	const { context } = useContext(RootContext)

	const [stat, setStat] = useState<ILeaderboard[]>([])
    const [pageState,setPageState] = useState<State>({
        loggedIn:false,
        allTime:true,
        start:0
    })
	useEffect(() => {
		AxiosApi.get(`/stockgame/rank/leaderboard?loggedIn=${pageState.loggedIn}&allTime=${pageState.allTime}&start=${pageState.start}`).then((res) => setStat(res.data.result))

//		AxiosApi.get("/stockgame/user?userId=622bd1b14044e242102d1b66").then((res) => console.log(res.data))
	}, [pageState])

    function getRankDeco(rank:number){
        if(rank===0) return "first"
        if(rank===1) return "second"
        if(rank===2) return "third"
        return ""
    }
    function toggleLoggedIn(){
        setPageState({...pageState,loggedIn:!pageState.loggedIn})
    }
    function toggleAllTime(){
        setPageState({...pageState,allTime:!pageState.allTime})
    }
	return (
		<div id="stockgame-leaderboard-root">
            <h2>LeaderBoard</h2>
            <div className="toolbar">
                <button onClick={toggleLoggedIn} className={"button " + (pageState.loggedIn ? "":"dark")}>Logged In</button>
                <button onClick={toggleAllTime} className={"button " + (pageState.allTime ? "":"dark")}>All-time</button>
            </div>
			<div className="leaderboard ">
            <table className="stockgame-table">
            <thead>
                <tr>
                    <th className="change"></th>
                    <th className="rank">Rank</th>
                    <th>Username</th>
                    <th>Score</th>
                    <th className="date"></th>
                </tr>
            </thead>
            <tbody>
            {stat.map((s, i) => (
                <tr key={i} className="item">
                    <td className="change"></td>
                    <td className="rank"><b className={i<=2 ?("special " + getRankDeco(i)) :""}>{i+1}</b></td>
                    <td className={"name " + (s.loggedIn?"loggedin":"") }>{s.loggedIn && <RiCheckboxCircleFill />}{s.username}</td>
                    <td><b>{addCommas(s.score)}</b></td>
                    <td className="date">{getDateStringDifference(new Date(s.updatedAt).valueOf(), Date.now())} ago </td>
                </tr>
				))}
            </tbody>
            </table>
				
			</div>
		</div>
	)
}
