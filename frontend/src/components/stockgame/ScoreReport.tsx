import { toPercentStr, rel_diff } from "../../stockgame/util"
import { addCommas } from "../../util"
import "./../../styles/stockgame/scorereport.scss"

type Props = {
    header:string
    score:number
    initialMoney:number
    finalTotal:number
    better:number
    total:number
}

export default function StockGameScoreReport({header,score,initialMoney,finalTotal,better,total}:Props){
    return (<div className="score-report stockgame-content">
        <h3>{header}</h3>
        <div className="score content-section">
            <h1>${addCommas(score)}</h1>
            <span>
                수익률:{" "}
                <b className={finalTotal >= initialMoney ? "up" : "down"}>
                    {toPercentStr(rel_diff(initialMoney, finalTotal))}
                </b>
            </span>
        </div>
        <div className="content-section">
            전체랭킹 : <b>{better + 1}등</b>{" "}
            <sub>(상위 {toPercentStr((better + 1) / total, true)},{better+1}/{total})</sub>
        </div>
    </div>)
}