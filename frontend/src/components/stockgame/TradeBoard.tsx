import { DayRecord, DisplayData } from "../../stockgame/types/DisplayData"
import { PlayerState } from "../../stockgame/types/PlayerState"

type Props = {
    player:PlayerState,
    price:DisplayData,
    sellFunc:(percent:number)=>void
    buyFunc:(percent:number)=>void
}
export function TradeBoard({player,price,sellFunc,buyFunc}:Props){
    const {money,shares} = player
    const {value} = price

    const canBuy = value < money
    const canSell = shares > 0

    return(<div className="trade-board">
        <div className="trade-buy">
            <div className="trade-status">
                <div>매수 가능: </div>
                <div className="trade-status-values">
                    <span>${Math.floor(money/value)*value}</span>
                    <span>&#8594;</span>
                    <span>{Math.floor(money/value)}주</span>
                </div>
            </div>
            {canBuy?(
                <>
                <div className="trade-btn up-bg" onClick={()=>buyFunc(0.5)}>
                50% 매수
            </div>
            <div className="trade-btn up-bg" onClick={()=>buyFunc(1)}>
                전량 매수
            </div></>
            ):(<>
                <div className="trade-btn up-bg disabled" >
                50% 매수
            </div>
            <div className="trade-btn up-bg disabled" >
                전량 매수
            </div></>
            )}
            
        </div>   
        <div className="trade-sell">
            <div className="trade-status">
                <div>매도 가능: </div>
                <div className="trade-status-values">
                    <span>{shares}주</span>
                    <span>&#8594;</span>
                    <span>${shares*value}</span>
                </div>
            </div>
            {canSell?(
                <>
                <div className="trade-btn down-bg" onClick={()=>sellFunc(0.5)}>
                50% 매도
            </div>
            <div className="trade-btn down-bg" onClick={()=>sellFunc(1)}>
                전량 매도
            </div></>
            ):(<>
                <div className="trade-btn down-bg disabled" >
                50% 매도
            </div>
            <div className="trade-btn down-bg disabled" >
                전량 매도
            </div></>
            )}
        </div>   
    </div>)
}