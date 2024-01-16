import { RiMessage2Fill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import ProfileImage from "../chat/ProfileImage"

type Props= {
    noti:INotification
}
export default function ChatNotification({noti}:Props){

    return (<div className={"notification divlink "+(noti.read?"read":"")}>
        <span className="close">&times;</span>
        <div className="topbar">
            <ProfileImage profileImgDir={noti.payload4} username={noti.payload3}/>
            &bull; Chat &bull; {noti.createdAt?.slice(0,16).replace("T", " ") }
        </div>
        {/* <hr></hr> */}
        <div className="noti-content"><RiMessage2Fill/>{noti.message}</div>
        <div className="noti-footer">{noti.payload3}</div>
    </div>)
}