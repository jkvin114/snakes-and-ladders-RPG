import { RiDownloadCloudFill } from "react-icons/ri"
import { IChatMessage } from "../../types/chat"
import ProfileImage from "./ProfileImage"

type Props = {
	messages: IChatMessage[]
    fetchOld:React.MouseEventHandler
}
export default function Messages({ messages,fetchOld }: Props) {
	const me = localStorage.getItem("username")
	let lastusername = ""
	let isLastMessageEmpty = false
	let lastDate = ""
	let started = false
	return (
		<>
			{messages.map((m, i) => {
				const today = m.createdAt ? m.createdAt.slice(0, 16).replace("T", " ") : ""
				const showname = lastusername !== m.username
				const showdate = lastDate !== today
				const showdots = !isLastMessageEmpty && !m.content
				const showfetch = !started && m.serial > 1
                started=true
				if (m.username) lastusername = m.username
				lastDate = today
				isLastMessageEmpty = !m.content

				if (showdots) {
					return (
						<>
							{showfetch && (
								<div className="fetchbtn" onClick={fetchOld}>
									<RiDownloadCloudFill />
								</div>
							)}
							<div>...</div>
						</>
					)
				} else {
					return (
						<>
							{showfetch && (
								<div className="fetchbtn" onClick={fetchOld}>
									<RiDownloadCloudFill />
								</div>
							)}
							{showdate && <div className="time">{today}</div>}

							<div key={m.serial} className={"message-container " + (m.username === me ? "me" : "")}>
								{m.username === me ? (
									<>
										<b className="unread">{m.unread ? m.unread : ""}</b>
										<div className="message me">
											{m.content}
											{m.serial}
										</div>
									</>
								) : (
									<>
                                        {showname && <ProfileImage username={m.username} profileImgDir={m.profileImgDir} />}
								        {!showname && <div className="profile-placeholder"></div>}
										<div className="message-other">
											{showname && <div className="name">{m.username} </div>}
											<div className="message">
												{m.content}
												{m.serial}
											</div>
										</div>
										<b className="unread">{m.unread ? m.unread : ""}</b>
									</>
								)}
								
							</div>
						</>
					)
				}
			})}
		</>
	)
}
