import "./../../styles/stockgame/scoreboard.css"
import "./../../styles/stockgame/board.css"
import { DisplayData } from "../../stockgame/types/DisplayData"
import { PlayerState } from "../../stockgame/types/PlayerState"
import { rel_diff, round, toPercentStr } from "../../stockgame/util"
import PieChart from "./PieChart"
import ScoreBoardGraph from "../../stockgame/ScoreBoardGraph"
import { MouseEventHandler } from "react"

type Props={
    player:PlayerState,
    price:DisplayData,
    startFunc:Function
    stopFunc:Function
    gameState:"none"|"running"|"ended"
}
export function ScoreBoard({player,price,startFunc,stopFunc,gameState}:Props){
    const {initialMoney,money,profit,profitRate,shares,avgUnitPrice,totalAsset} = player
    const {value,lastDayValue,totalCount,currCount} = price

    const totalprofit = rel_diff(initialMoney,totalAsset)
    const diff=value-lastDayValue
    const reldiff = rel_diff(lastDayValue,value)
    return (<div>
        <div id="score-top">
            <div className="asset">
                <h3>${totalAsset}</h3>
                <span className="desc">총자산</span>
                <span className={totalprofit<0?"down":"up"}>{toPercentStr(totalprofit)}</span>
            </div>
            <div className="profit">
                {profit<0?(
                <h3 className="down">&#9660; ${profit}</h3>
                ):(
                    <h3 className="up">&#9650; ${profit}</h3>
                )}
                <span className="desc">현재 수익률</span>
                <span className={profitRate<0?"down":"up"}>{toPercentStr(profitRate)}</span>
            </div>
            <ScoreBoardGraph money={money} sharePrice={value} totalAsset={totalAsset} shares={shares}></ScoreBoardGraph>
        </div>
        <div className="meter">
            <span style={{width:((currCount/(0.01+totalCount))*100)+"%"}}></span>
        </div>
        <div className="price">
            <span className="price-val">${value} </span> 
            <span className={diff<0?"down":"up"}>
                {diff<0?(
                <a>&#9660;</a>
                ):(
                <a>&#9650;</a>
                )}
                {diff}
            </span>
            <span className={diff<0?"down":"up"}>
                {toPercentStr(reldiff)}
            </span>
            <div className="btn-toolbar">
                {gameState==="none"?<div className="start-btn" onClick={startFunc as MouseEventHandler}>거래 시작</div>:""}
                {gameState==="running"?<div className="stop-btn" onClick={stopFunc as MouseEventHandler}>전량 매도 후 거래 종료</div>:""}
            </div>
        </div>
    </div>)
}