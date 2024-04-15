import { DayRecord } from "../../../stockgame/types/DisplayData"
import { round, toPercentStr } from "../../../stockgame/util"

type Props={
    day:DayRecord
}
export default function DayRecordItem({day}:Props){
    // console.log(day.date)
    return (<div className="day-record-item">
        <span className="day-record-date">{day.date?day.date.slice(5,11):""}</span>
        <span className={day.diff<0?"down":"up"}>{toPercentStr(day.diff)}</span>
    </div>)
}