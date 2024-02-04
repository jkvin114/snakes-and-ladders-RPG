import { useContext, useEffect, useState } from "react"
import { AxiosApi } from "../api/axios"
import { IFriendScore } from "./types/stat"
import "./../styles/stockgame/table.scss"
import "./../styles/stockgame/lobby.scss"
import { profile_img_path } from "../variables"
import { addCommas } from "../util"
import { RootContext } from "../context/context"

export default function StockGameUserLobby() {
	const [stat, setStat] = useState<IFriendScore[]>([])
	const { context } = useContext(RootContext)

	useEffect(() => {
		AxiosApi.get(`/stockgame/user/friends`).then((res) => setStat(res.data))
	}, [])
	function getRankDeco(rank: number) {
		if (rank === 0) return "first"
		if (rank === 1) return "second"
		if (rank === 2) return "third"
		return ""
	}
	return (
		<div id="stockgame-lobby-root">
			<div className="content">
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
							{stat.map((s, i) => (
								<tr key={i} className={context.username === s.username ? "me":""}>
									<td className="rank">
										{s.game ?<b className={i <= 2 ? "special " + getRankDeco(i) : ""}>{i + 1}</b>:"-"}
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
			</div>
		</div>
	)
}
