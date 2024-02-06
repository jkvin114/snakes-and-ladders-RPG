import { useContext, useEffect, useState } from "react"
import { AxiosApi } from "../api/axios"
import { IFriendScore } from "./types/stat"
import "./../styles/stockgame/table.scss"
import "./../styles/stockgame/lobby.scss"
import "./../styles/stockgame/user.scss"

import { profile_img_path } from "../variables"
import { addCommas } from "../util"
import { RootContext } from "../context/context"
import {
	IStockGameBestScoreResponse,
	IStockGameBestScoreResponsePopulated,
	IStockGameResultResponse,
	IStockGameUserRecordResponse,
	ScorePosition,
} from "./types/Result"
import { toPercentStr, rel_diff } from "./util"
import StockGameScoreReport from "../components/stockgame/ScoreReport"
import StockGameUserResultRecord from "../components/stockgame/UserResultRecord"
import StockGameUserInfo from "./UserInfo"
import { RiCloseLine } from "react-icons/ri"

export default function StockGameUserLobby() {
	const [friendScores, setFriendScores] = useState<IFriendScore[]>([])
	const [alltimeBest, setAlltimeBest] = useState<IStockGameBestScoreResponsePopulated | undefined>()
	const [currentBest, setCurrentBest] = useState<IStockGameBestScoreResponsePopulated | undefined>()

	const [record, setRecord] = useState<IStockGameUserRecordResponse[]>([])
	const [recordCount, setRecordCount] = useState<number>(0)
	const [currBestPos, setCurrBestPos] = useState<ScorePosition>({
		better: 0,
		total: 1,
	})
	const [alltimeBestPos, setAlltimeBestPos] = useState<ScorePosition>({
		better: 0,
		total: 1,
	})
	const [openedUser, setOpenedUser] = useState<string | null>(null)
	const { context } = useContext(RootContext)

	function getScorePositions(curr: number, alltime: number) {
		AxiosApi.get("/stockgame/rank/position/byscore?score=" + curr)
			.then((res) => setCurrBestPos(res.data))
			.catch((e) => console.error(e))

		AxiosApi.get("/stockgame/rank/position/byscore?allTime=true&score=" + alltime)
			.then((res) => setAlltimeBestPos(res.data))
			.catch((e) => console.error(e))
	}
	useEffect(() => {
		AxiosApi.get(`/stockgame/user/friends`)
			.then((res) => setFriendScores(res.data))
			.catch((e) => console.error(e))
		AxiosApi.get("/stockgame/user/mylobby")
			.then((res) => {
				setAlltimeBest(res.data.alltimeBest)
				setCurrentBest(res.data.best)
				setRecord(res.data.records)
				setRecordCount(res.data.recordCount)
				getScorePositions(res.data.best.score, res.data.alltimeBest.score)
			})
			.catch((e) => console.error(e))
	}, [])
	function getRankClassname(rank: number) {
		if (rank === 0) return "first"
		if (rank === 1) return "second"
		if (rank === 2) return "third"
		return ""
	}
	function clickFriend(id: string) {
		setOpenedUser(id)
	}
	return (
		<>
			{openedUser && (
				<>
					<div className="shadow"></div>
					<div id="stockgame-lobby-modal">
						<b className="close-modal" onClick={() => setOpenedUser(null)}>
							<RiCloseLine />
						</b>
						<StockGameUserInfo userId={openedUser} />
					</div>
				</>
			)}

			<div id="stockgame-lobby-root" className="stockgame-content stockgame-user-content">
				<div className="content">
					<div>
						<h3>친구 랭킹</h3>
						<div className="friends">
							<table className="stockgame-table">
								{/* <thead>
								<tr>
									<th></th>
									<th></th>
									<th></th>
									<th></th>
								</tr>
							</thead> */}
								<tbody>
									{friendScores.map((s, i) => (
										<tr
											key={i}
											className={context.username === s.username ? "me" : ""}
											onClick={context.username !== s.username ? () => clickFriend(s.user) : () => {}}>
											<td className="rank">
												{s.game ? <b className={i <= 2 ? "special " + getRankClassname(i) : ""}>{i + 1}</b> : "-"}
											</td>
											<td className="profile">
												{s.profileImgDir && s.profileImgDir !== "" ? (
													<div>
														<img src={profile_img_path + s.profileImgDir}></img>{" "}
													</div>
												) : (
													""
												)}
											</td>
											<td className="score">
												{s.game && s.score ? <b>{addCommas(s.score)}</b> : "-"}
												<br></br>
												<span className="name">{s.username}</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<br></br>
						{currentBest && (
							<StockGameScoreReport
								header="Best Score"
								score={currentBest.score}
								finalTotal={currentBest.game.finaltotal}
								initialMoney={currentBest.game.initialMoney}
								better={currBestPos.better}
								total={currBestPos.total}
							/>
						)}
					</div>
					<div>
						<StockGameUserResultRecord record={record} count={recordCount} />
						{alltimeBest && currentBest && alltimeBest._id !== currentBest._id && (
							<StockGameScoreReport
								header="Best Score"
								score={alltimeBest.score}
								finalTotal={alltimeBest.game.finaltotal}
								initialMoney={alltimeBest.game.initialMoney}
								better={alltimeBestPos.better}
								total={alltimeBestPos.total}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
