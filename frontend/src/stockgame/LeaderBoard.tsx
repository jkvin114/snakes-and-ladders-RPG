import { useContext, useEffect, useState } from "react"
import { AxiosApi } from "../api/axios"
import { ILeaderboard } from "./types/stat"
import { getDateStringDifference } from "../util"
import { RootContext } from "../context/context"

export default function StockGameLeaderboard(){
    const {context} = useContext(RootContext)

    const [stat,setStat] = useState<ILeaderboard[]>([])
    useEffect(()=>{
        AxiosApi.get("/stockgame/rank/leaderboard")
        .then(res=>setStat(res.data.result))

        AxiosApi.get("/stockgame/user?userId=622bd1b14044e242102d1b66")
        .then(res=>console.log(res.data))
    },[])

    return (<>
    {
        stat.map((s,i)=><div key={i}>
            <div>{s.username}</div>
            <div>{getDateStringDifference(new Date(s.updatedAt).valueOf(),Date.now())} ago </div>
            <div>{s.score}</div>
            <br></br>
        </div>)
    }</>)
}