import { DayRecord, DisplayData } from "../../stockgame/types/DisplayData"
import { rel_diff, round } from "../../stockgame/util"
type Props={
    val:DisplayData
}

export function Display({val}:Props){
    const {currCount,totalCount,value,lastDayValue} =val
    const diff = rel_diff(lastDayValue,value)

    return (<><div>
            <p>{round(value + Math.random(),-2)}</p>
            <p>{round(diff*100,-2)}%</p>
        </div>
        <div>
            {currCount}/{totalCount}
            {/* <p>max change:{round(maxChange*100,-2)}%</p>
            <p>min change:{round(minChange*100,-2)}%</p>
            <p>max val:{maxVal}</p>
            <p>min val:{minVal}</p> */}
        </div></>)
}