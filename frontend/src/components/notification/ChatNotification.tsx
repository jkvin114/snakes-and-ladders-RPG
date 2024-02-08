import { RiMessage2Fill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import ChatProfileImage from "../chat/ChatProfileImage"
import { getTimeAgo, limitString } from "../../util"
import { Link } from "react-router-dom"

type Props= {
    noti:INotification
}
export default function ChatNotification({noti}:Props){

    return (<>
    <Link className="divlink" to={"/chat?room="+noti.payload1}></Link>
    <div className="topbar">
        <RiMessage2Fill/>
            <ChatProfileImage profileImgDir={noti.payload4} username={noti.payload3}/>
            &bull; {noti.payload3}  &bull; {noti.createdAt?.slice(0,16).replace("T", " ") }
        </div>
        <div className="noti-content">{limitString(noti.message)}</div>
        {/* <div className="noti-footer"></div> */}

        </>)
}