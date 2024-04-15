import { RiCheckFill, RiCheckboxCircleLine, RiMessage2Fill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import ChatProfileImage from "../chat/ChatProfileImage"
import { getTimeAgo, limitString } from "../../util"
import { Link } from "react-router-dom"
import { AxiosApi } from "../../api/axios"

type Props= {
    noti:INotification
}
export default function InviteNotification({noti}:Props){

    function accept(){
        AxiosApi.post("/room/accept_invite",{roomname:noti.payload2})
        .then(res=>{
            window.location.href=`/match?join=true&roomname=${noti.payload2}&gametype=${noti.payload3}`
        })
        .catch(e=>{
            console.error(e)
            alert(e.response.data)
        })
    }
    return (<><div>
    <img className="invite-img" src={noti.payload3==="marble"?"/res/img/marble/icon.jpg":"/favicon.png"}></img>
    <b>{noti.payload3} game invitation: from {noti.payload1}</b>
    <div style={{textAlign:"center"}}>
        <button  onClick={accept} className="button invite-btn"><RiCheckboxCircleLine/>accept</button>
            
        </div>
    
        
</div></>)
}