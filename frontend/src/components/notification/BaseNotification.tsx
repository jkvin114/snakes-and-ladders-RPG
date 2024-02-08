import { RiMessage2Fill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import ChatProfileImage from "../chat/ChatProfileImage"
import ChatNotification from "./ChatNotification"
import { Link } from "react-router-dom"
import { addCommas, getTimeAgo } from "../../util"
import InviteNotification from "./InviteNotification"

type Props= {
    noti:INotification
    isNew:boolean
    deleteNoti:(id:string)=>void
}
export default function BaseNotification({noti,deleteNoti,isNew}:Props){
    
    return (<div className={"notification "+(noti.read?"read":"") + (isNew?" new":"")}>
        <span className="close" onClick={()=>deleteNoti(noti._id)}>&times;</span>
        <div className="noti-body divlink">
            {noti.type==="STOCKGAME_SURPASS" && <div className="divlink">
                <Link className="divlink" to="/stockgame/mypage"></Link><b>{noti.payload1}</b> surpassed your stockgame score! <br></br>({addCommas(noti.payload2)})
                
</div>}
            {noti.type==="CHAT" && <ChatNotification noti={noti}/>}
            {noti.type==="EMPTY" && <ChatNotification noti={noti}/>}
            {noti.type==="GAME_INVITE" && <InviteNotification noti={noti}/>}
        </div>
        {noti.createdAt && <sub className="time"> {getTimeAgo(noti.createdAt)} ago</sub>}
    </div>)
}