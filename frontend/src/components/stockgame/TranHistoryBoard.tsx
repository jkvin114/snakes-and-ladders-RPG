import Transaction from "../../stockgame/types/Transaction"

type Props = {
	record: Transaction[]
}
export function TranHistoryBoard({ record }: Props) {
	return (
		<>
			<h2 className="board-title">Trade History</h2>
			<div className="history">
				{record.map((r) => (
					<div className="history-item">
						<div className="history-top">
							<span>{r.type === "buy" ? "매수" : "매도"}</span>
							<span className={r.type === "sell" ? "down" : "up"} style={{float:"right"}}>
								{r.type === "sell" ? "-" : "+"} {r.shares} 주
							</span>
						</div>
						<div className="history-bottom">
							<span>{r.date}</span>
							<span style={{float:"right"}}>${r.money}</span>
						</div>
					</div>
				))}
			</div>
		</>
	)
}
