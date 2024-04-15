import { useEffect, useState } from "react"
import { IStockGameUserRecordResponse } from "../../stockgame/types/Result"
import { rel_diff, round, toPercentStr } from "../../stockgame/util"
import { addCommas, getTimeAgo } from "../../util"
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri"

type Stat = {
	avgProfitRate: number
	count: number
	avgTradeAmt: number
	avgTradeCount: number
}
type Props = {
	record: IStockGameUserRecordResponse[]
	count: number
}
export default function StockGameUserResultRecord({ record, count }: Props) {
	const [stat, setStat] = useState<Stat>({
		avgProfitRate: 0,
		count: 0,
		avgTradeAmt: 0,
		avgTradeCount: 0,
	})
	const [expanded, setExpanded] = useState<number>(-1)
	useEffect(() => {
		if (record.length === 0) return
		let totalprofit = 0
		let totaltrade = 0
		let totaltradeamt = 0
		for (const g of record) {
			totalprofit += g.finaltotal / g.initialMoney
			totaltrade += g.transactionHistory.length
			totaltradeamt += g.transactionHistory.reduce((prev, curr) => prev + curr.amount * curr.price, 0)
		}
		setStat({
			avgProfitRate: round(totalprofit / record.length,-4) - 1,
			count: count,
			avgTradeAmt: round(totaltradeamt / record.length),
			avgTradeCount: round(totaltrade / record.length,-2),
		})
	}, [record, count])

    function expand(idx:number){
        setExpanded(idx)
    }
    function collapse(){
        setExpanded(-1)
    }
	return (
		<>
			<div className="stat">
				<div>
					<span className="stat-item">
						게임 수: <b>{stat.count}회</b>
					</span>
					<span className="stat-item">
						평균 수익률: <b>{toPercentStr(stat.avgProfitRate)}</b>
					</span>
				</div>
				<div>
					<span className="stat-item">
						평균 거래 횟수: <b>{stat.avgTradeCount}</b>
					</span>
					<span className="stat-item">
						평균 거래량: <b>${addCommas(stat.avgTradeAmt)}</b>
					</span>
				</div>
			</div>
			<h3>최근 플레이</h3>
			<div className="records">
                {record.length===0 && <>No games played</>}
				{record.map((r, i) => {
					return (
						<div key={i}>
							<div className="record-item">
								<div className="record-item-content">
									<b> {addCommas(r.score)}</b>{" "}
									<span className={r.finaltotal >= r.initialMoney ? "up" : "down"}>
										{toPercentStr(rel_diff(r.initialMoney, r.finaltotal))}
									</span>
									<br></br>
									<span>
										거래량 : $
										{addCommas(r.transactionHistory.reduce((prev, curr) => prev + curr.amount * curr.price, 0))}
									</span>
									<sub> {getTimeAgo(r.updatedAt)} ago</sub>
								</div>
								<div className="expand-btn" onClick={expanded === i ? collapse : ()=>expand(i)}>
                                    
                                    {expanded === i ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                                </div>
							</div>
                            {
                                expanded === i && <div className="tran-record">
                                {r.transactionHistory.map((tran,j)=><div className="tran-record-item" key={j}>
                                    <li> {tran.type} <b>{tran.amount}</b> at ${addCommas(tran.price)}</li>
                                   
                                </div>)}
                                {r.delistAt && <div className="tran-record-item" style={{color:"red"}}><li>상장폐지!</li></div>}
                                {r.transactionHistory.length===0 && <div className="tran-record-item">No transactions</div>}
                                </div>
                            }
							
						</div>
					)
				})}
			</div>
		</>
	)
}
