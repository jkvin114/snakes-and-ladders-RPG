import { RiMessage2Fill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import ProfileImage from "../chat/ProfileImage"
import ChatNotification from "./ChatNotification"

type Props= {
    noti:INotification
    isNew:boolean
    deleteNoti:(id:string)=>void
}
export default function BaseNotification({noti,deleteNoti,isNew}:Props){
    
    return (<div className={"notification "+(noti.read?"read":"") + (isNew?" new":"")}>
        <span className="close" onClick={()=>deleteNoti(noti._id)}>&times;</span>
        <div className="noti-body divlink">

            {noti.type==="CHAT" && <ChatNotification noti={noti}/>}
            {noti.type==="EMPTY" && <ChatNotification noti={noti}/>}
        </div>

    </div>)
}