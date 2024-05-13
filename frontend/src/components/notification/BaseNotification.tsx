import { RiMessage2Fill } from "react-icons/ri"
import { INotification, NOTI_TYPE } from "../../types/notification"
import ChatProfileImage from "../chat/ChatProfileImage"
import ChatNotification from "./ChatNotification"
import { Link } from "react-router-dom"
import { addCommas, getTimeAgo } from "../../util"
import InviteNotification from "./InviteNotification"
import FriendRequestNotification from "./FriendRequestNotification"
import { useContext } from "react"
import { LocaleContext } from "../../context/localeContext"
import Text from "../Text"
import { RootContext } from "../../context/context"

type Props = {
	noti: INotification
	isNew: boolean
	deleteNoti: (id: string) => void
}
export default function BaseNotification({ noti, deleteNoti, isNew }: Props) {
	const {context} = useContext(RootContext)
	return (
		<div className={"notification " + (noti.read ? "read" : "") + (isNew ? " new" : "")}>
			<span className="close" onClick={() => deleteNoti(noti._id)}>
				&times;
			</span>
			<div className="noti-body divlink">
				{noti.type === NOTI_TYPE.StockGameSurpass && (
					<div className="divlink">
                         <img src="/stock.png" className="invite-img"/>
						<Link className="divlink" to="/stockgame/mypage"></Link>
						<Text lkey="noti.stockgame" args={[noti.payload1]}/> <br></br>({addCommas(noti.payload2)})
					</div>
				)}
				{noti.type === NOTI_TYPE.Chat && <ChatNotification noti={noti} />}
				{noti.type === NOTI_TYPE.Empty && <ChatNotification noti={noti} />}
				{noti.type === NOTI_TYPE.GameInvite && <InviteNotification noti={noti} />}
                {noti.type === NOTI_TYPE.FriendRequest && <FriendRequestNotification noti={noti} />}
			</div>
			{noti.createdAt && <sub className="time"> {getTimeAgo(noti.createdAt,context.lang)} <Text lkey="generic.ago"/></sub>}
		</div>
	)
}
