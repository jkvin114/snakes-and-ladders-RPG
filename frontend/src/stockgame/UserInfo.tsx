import { useEffect, useState } from "react"
import { IStockGameBestScoreResponsePopulated, IStockGameUserRecordResponse, ScorePosition } from "./types/Result"
import { AxiosApi } from "../api/axios"
import StockGameScoreReport from "../components/stockgame/ScoreReport"
import StockGameUserResultRecord from "../components/stockgame/UserResultRecord"
import "./../styles/stockgame/user.scss"
import "./../styles/userlist.scss"

import UserSummaryItem from "../components/profile/UserSummaryItem"

export default function StockGameUserInfo({userId}:{userId?:string}){
    const [currentBest, setCurrentBest] = useState<IStockGameBestScoreResponsePopulated | undefined>()
    const [record, setRecord] = useState<IStockGameUserRecordResponse[]>([])
	const [recordCount, setRecordCount] = useState<number>(0)
	const [currBestPos, setCurrBestPos] = useState<ScorePosition>({
		better: 0,
		total: 1,
	})
    const [username,setUsername] = useState<string>("?")
    const [userProfile,setUserProfile] = useState<string>("")
    
    useEffect(()=>{
        if(!userId) return
        AxiosApi.get("/stockgame/profile/"+userId)
        .then((res) => {
            setCurrentBest(res.data.best)
            setRecord(res.data.records)
            setRecordCount(res.data.recordCount)
            setUsername(res.data.username)
            setUserProfile(res.data.profileImgDir)

            AxiosApi.get("/stockgame/rank/position/byscore?score=" + res.data.best.score)
                .then((res) => setCurrBestPos(res.data))
                .catch((e) => console.error(e))
        })
        .catch((e) => console.error(e))
    },[userId])
    return (<div className="stockgame-content stockgame-user-content" data-locale={"eng"} id="stockgame-profile-root">
        <div className="content">
        <div className="profile userlist">
            <UserSummaryItem username={username} profileImgDir={userProfile} link={true} buttonType={null}/>
        </div>
        {currentBest && (
						<StockGameScoreReport
							header="Best Score"
							score={currentBest.score}
							finalTotal={currentBest.game.finaltotal}
							initialMoney={currentBest.game.initialMoney}
							better={currBestPos.better}
							total={currBestPos.total}
						/>
					)}
       <StockGameUserResultRecord record={record} count={recordCount} />
        </div>
    </div>)
}