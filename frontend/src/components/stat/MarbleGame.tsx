import { RiTrophyFill, RiZoomInLine } from "react-icons/ri"

type Props = {
	game: any
}
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
export default function MarbleGame({ game }: Props) {
	const stats = game.game
	const highlight = game.turn !== undefined ? game.turn : -1

	const winner = stats.players[stats.winner]

	let idx = [0, 1, 2, 3]
	let total = stats.players.length

	return (
		<div className="stat-game">
			<div className={"stat-win " + (game.isWon === false ? "lost" : "")}>
				{getWinType(stats.winType)} {game.isWon === false ? "패배" : "승리"}
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
}
