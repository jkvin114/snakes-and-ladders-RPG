import { RiDownloadCloudFill } from "react-icons/ri"
import { IChatMessage, IMessageData } from "../../types/chat"
import ChatProfileImage from "./ChatProfileImage"

type Props = {
	messages: IMessageData
    fetchOld:React.MouseEventHandler
}
export default function Messages({ messages,fetchOld }: Props) {
	const me = localStorage.getItem("username")
	let lastusername = ""
	let isLastMessageEmpty = false
	let lastDate = ""
	let started = false
	let unread = 0
	messages.userLastSerials.sort((a, b) => a - b)
	let serials = new Set<number>()
	return (
		<>
			{messages.messages.map((m, i) => {
				if(serials.has(m.serial)) return (<></>)
				serials.add(m.serial)
				const today = m.createdAt ? m.createdAt.slice(0, 11).replace("T", " ") : ""
				const showdate = lastDate !== today
				const showdots = !isLastMessageEmpty && (!m.content || m.content==="")
				const showfetch = !started && m.serial > 1

				const showname = (lastusername !== m.username || showdate)
                started=true
				if (m.username) lastusername = m.username
				lastDate = today
				isLastMessageEmpty = (!m.content || m.content==="")

				while (unread < messages.userLastSerials.length && m.serial > messages.userLastSerials[unread])
					unread++

				const msgunread = messages.freshMsgSerial === m.serial ? m.unread : unread


				if (showdots) {
					return (
						<>
							{showfetch && (
								<div key={"fetch"} className="fetchbtn" onClick={fetchOld} title="Load older messages">
									<RiDownloadCloudFill />
								</div>
							)}
							<div key={m.serial} title="cannot load messages">...</div>
						</>
					)
				}else if(isLastMessageEmpty){
					return (<></>)
				} else {
					return (
						<>
							{showfetch && (
								<div key={"fetch"} className="fetchbtn" onClick={fetchOld}>
									<RiDownloadCloudFill />
								</div>
							)}
							{showdate && <div className="time" key={today}>{today}</div>}

							<div key={m.serial} className={"message-container " + (m.username === me ? "me" : "")}>
								{m.username === me ? (
									<>
										<b className="unread">{msgunread>0?msgunread:""}</b>
										<div className="message me" title={m.serial.toString()}>
											{m.content}
										</div>
									</>
								) : (
									<>
                                        {showname && <ChatProfileImage username={m.username} profileImgDir={m.profileImgDir} />}
								        {!showname && <div className="profile-placeholder"></div>}
										<div className="message-other">
											{showname && <div className="name">{m.username} </div>}
											<div className="message" title={m.serial.toString()}>
												{m.content}
											</div>
										</div>
										<b className="unread">{msgunread>0?msgunread:""}</b>
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
