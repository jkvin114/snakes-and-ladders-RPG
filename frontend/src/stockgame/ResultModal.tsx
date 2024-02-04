import { RiTrophyLine } from "react-icons/ri"
import { IStockGameResult, IStockGameResultResponse } from "./types/Result"
import { addCommas } from "../util"
import { rel_diff, toPercentStr } from "./util"
import { RootContext } from "../context/context"
import { useContext } from "react"
import { useNavigate } from "react-router-dom"

type Props={
    clientResult : IStockGameResult
    serverResult : IStockGameResultResponse

}

export default function ResultModal({clientResult,serverResult}:Props){
    const { context, setContext } = useContext(RootContext)
    const passedFriends = serverResult.passedFriends.length>0
    const MAX_FRIEND_COUNT=3
    const navigate = useNavigate()
    function quit(){
        navigate("/")
    }
    function retry(){
        navigate(0)
        // window.location.reload()
    }
    return (<div id="stockgame-result">
        <div className="resulttext">게임 결과</div>
        <div className="username">{context.loggedin ? context.username : clientResult.username}</div>
        <div className="content">
            <div className="badge-container">
               {serverResult.isNewBest && <div className="badge"><RiTrophyLine /><b>신기록 달성!</b></div>}
                {clientResult.delistAt && <div className="badge delist"><b>상장폐지</b></div>}
            </div>
            <div className="score content-section">
               <h1>${addCommas(clientResult.finaltotal)}</h1> 
               <span >수익률: <b className={clientResult.finaltotal >= clientResult.initialMoney?"up":"down"}>{toPercentStr(rel_diff(clientResult.initialMoney,clientResult.finaltotal))}</b></span>
            </div>
            <div className="content-section">
                전체랭킹 : <b>{serverResult.better+1}등 </b> <sub>(상위 {toPercentStr((serverResult.better+1)/serverResult.total,true)})</sub>
            </div>
            {
                context.loggedin && 
                <div className="content-section friend-section">
                    <div>
                        {serverResult.isNewBest && <>친구랭킹 :<br></br> <b  className={passedFriends? "up":""}> {passedFriends?<>&#9650;</>:""} {serverResult.friendRanking}등 </b><br></br></>}
                        {passedFriends&& <span> 이긴 친구수: <b>{serverResult.passedFriends.length}</b></span>}
                    </div>
                    {
                        passedFriends && <div className="friends">
                        {serverResult.passedFriends.slice(0,MAX_FRIEND_COUNT)
                        .map((f,i)=><div><b className="down">&#9660; {serverResult.friendRanking+i+1}</b> <span>{f.username}</span> <b>${addCommas(f.score)}</b></div>)}
                        {serverResult.passedFriends.length > MAX_FRIEND_COUNT && <div><b></b>...</div>}
                    </div>
                    }
                </div>
            }
            
        </div>
        <div className="buttons">
            <button className="button" onClick={quit}>
                확인
            </button>
            <button className="button" onClick={retry}>
                한판 더하기
            </button>
        </div>
    </div>)
}