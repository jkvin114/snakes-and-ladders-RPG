import { RiCheckFill, RiCheckboxCircleLine, RiCloseFill, RiMessage2Fill, RiUserAddFill } from "react-icons/ri"
import { INotification } from "../../types/notification"
import { AxiosApi } from "../../api/axios"
import { useState } from "react"

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
				<b>{noti.payload2}</b> sent you friend request.
				{!responded && (
					<div style={{ textAlign: "center" }}>
						<button onClick={accept} className="button invite-btn">
							<RiCheckboxCircleLine />
							accept
						</button>
						<button onClick={reject} className="button dark invite-btn">
							<RiCloseFill />
							reject
						</button>
					</div>
				)}
			</div>
		</>
	)
}
