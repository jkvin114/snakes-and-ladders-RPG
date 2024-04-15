import { DayRecord, StatData } from "../../stockgame/types/DisplayData"
import "./../../styles/stockgame/statboard.css"
import DayRecordItem from "./stat/DayRecordItem"
import StatItem from "./stat/StatItem"
import { toPercentStr } from "../../stockgame/util"
type Props = {
    record:DayRecord[]
    stats:StatData
}
export function StatBoard({record,stats}:Props){
    // record=record.reverse()
    return(<>
        <h2 className="board-title">Statistics</h2>
        <div id="stat-content">
            <div id="stat">
                <StatItem name="최고가" value={String(stats.maxVal)} type="up"></StatItem>
                <StatItem name="최저가" value={String(stats.minVal)} type="down"></StatItem>

                <StatItem name="1일 최대 상승" value={toPercentStr(stats.maxChange)} type="up"></StatItem>
                <StatItem name="1일 최대 하락" value={toPercentStr(stats.minChange)} type="down"></StatItem>

            </div>
            <div id="history">
                {record.map((r:DayRecord)=>(<DayRecordItem day={r} key={r.date}></DayRecordItem>))}
            </div>  
        </div>
        
     </>)
}