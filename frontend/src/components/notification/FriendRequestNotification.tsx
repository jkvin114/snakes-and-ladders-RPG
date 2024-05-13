import { RiCheckFill, RiCheckboxCircleLine, RiCloseFill, RiMessage2Fill, RiUserAddFill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import { AxiosApi } from "../../api/axios"
import { useState } from "react"
import Text from "../Text"

type Props = {
	noti: INotification
}
export default function FriendRequestNotification({ noti }: Props) {
	const [responded, setResponded] = useState(false)
	function accept() {
		AxiosApi.post("/api/user/relation/friend_request/accept", { senderId: noti.payload1 })
			.then((res) => {
				setResponded(true)
			})
			.catch((e) => {
				console.error(e)
				alert(e.response.data)
			})
	}
	function reject() {
		AxiosApi.post("/api/user/relation/friend_request/reject", { senderId: noti.payload1 })
			.then((res) => {
				setResponded(true)
			})
			.catch((e) => {
				console.error(e)
				alert(e.response.data)
			})
	}
	return (
		<>
			<div>
                <RiUserAddFill  className="invite-img"/>
				<Text lkey="noti.friendrequest" args={[noti.payload2]}/>
				{!responded && (
					<div style={{ textAlign: "center" }}>
						<button onClick={accept} className="button invite-btn">
							<RiCheckboxCircleLine />
							<Text lkey="generic.accept"/>
						</button>
						<button onClick={reject} className="button dark invite-btn">
							<RiCloseFill />
							<Text lkey="generic.reject"/>
						</button>
					</div>
				)}
			</div>
		</>
	)
}
