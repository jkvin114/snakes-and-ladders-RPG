import { RiCloseFill, RiCloseLine } from "react-icons/ri"
import { IChatUser } from "../../types/chat"
import UserSummaryItem from "../profile/UserSummaryItem"
import { MouseEventHandler } from "react"
import Text from "../Text"

type Props={
    roomUsers:IChatUser[]
    onClose:MouseEventHandler
}

export default function RoomUserList({roomUsers,onClose}:Props){
    return (<div id="chatusers" >
    <div className="modal-toolbar">
        <b>
            <Text lkey="chat.users"/>
        </b>
        <div className="divlink modal-close">
            <a className="divlink" onClick={onClose}>
                <RiCloseFill />
            </a>
        </div>
    </div>
    <div className="modal-content userlist">
        {roomUsers.map(u=><UserSummaryItem  key={u._id} link={false} username={u.username} profileImgDir={u.profileImgDir} buttonType={null}/>)}
    </div>
</div>)
}