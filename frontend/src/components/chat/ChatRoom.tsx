import { ChangeEvent, useContext, useRef, useState } from "react"
import { ChatStorage } from "../../storage/chatStorage"
import { IChatUser, IChatMessage, IMessageData } from "../../types/chat"
import { AxiosApi } from "../../api/axios"
import { useEffect } from "react"
import "../../styles/chat.scss"
import "../../styles/userlist.scss"

import {
	RiArrowLeftLine,
	RiCloseLine,
	RiImageFill,
	RiMenuLine,
	RiSendPlane2Fill,
	RiSendPlaneFill,
} from "react-icons/ri"
import { ChatSocket } from "../../api/chatsocket"
import { UserStorage } from "../../storage/userStorage"
import Messages from "./Messages"
import { Link } from "react-router-dom"
import RoomUserList from "./RoomUserList"
import { LocaleContext } from "../../context/localeContext"
import { lText } from "../../util"
type Props = {
	roomId: string
	onBack:string
}

export default function ChatRoom({ roomId,onBack }: Props) {
	const [roomUsers, setRoomUsers] = useState<IChatUser[]>([])
	const [messages, setMessages] = useState<IMessageData>({ messages: [], userLastSerials: [0] })
	//const [maxSerial, setMaxSerial] = useState<number>(0)
	const [roomname, setRoomName] = useState("loading...")
	const [loading, setLoading] = useState(true)
	const [usersOpen, setUsersOpen] = useState(false)
	let connected = false
    const {locale} = useContext(LocaleContext)


	function onload() {
		if (connected) return
		connected = true
		//setMessages(ChatStorage.loadStoredMessages(roomId))
		//setMaxSerial(ChatStorage.maxSerial(roomId))
		// setTimeout(() => ChatSocket.joinRoom(roomId, ChatStorage.maxSerial(roomId)), 500)
		//console.log(messages[0])
		//	console.log(messages.length)
		ChatSocket.on("chat:message_received", (data) => {
			if (!ChatSocket.isConnected()) return
			let lastserials = data.userLastSerials
			delete data.userLastSerials
			receiveMessage(
				{
					...data,
					profileImgDir: UserStorage.getProfileImg(data.username),
				},
				lastserials
			)
			//	console.log("unread:"+data.unread)
		})
		ChatSocket.on("chat:message_sent", (data) => {
			let lastserials = data.userLastSerials
			delete data.userLastSerials
			receiveMessage(
				{
					...data,
					profileImgDir: UserStorage.getProfileImg(data.username),
				},
				lastserials
			)
			//console.log("unread:"+data.unread)
		})
		ChatSocket.on("chat:joined_room", (data) => {
			setRoomName(data.room.name)
			receiveMessageChunk(data.messages, data.userLastSerials)
			onFinishRoomLoad()
		})
		ChatSocket.on("chat:user_join", (data) => {
			if (!ChatSocket.isConnected()) return
			updateUnread(data.userLastSerials)
			//ChatStorage.decrementUnread(roomId, data.userLastSerials)
		})

		ChatSocket.on("chat:user_quit", () => {
			if (!ChatSocket.isConnected()) return
		})
		ChatSocket.on("chat:error", (data) => {
			console.error(data)
			alert("error")
		})

		AxiosApi.get("/api/chat/users/" + roomId)
			.then((res) => {
				//	console.table(res.data)
				setRoomUsers(res.data)
				saveUser(res.data)
				ChatSocket.joinRoom(roomId, ChatStorage.maxSerial(roomId))
			})
			.catch((e) => {
				console.error(e)
			})
	}
	function saveUser(users: IChatUser[]) {
		for (const user of users) {
			UserStorage.saveUser(user.username, user.profileImgDir)
		}
	}

	useEffect(() => {
		setLoading(true)
		//	console.log("load")
		onload()
		return () => {
			ChatSocket.leaveRoom(roomId)
		}
	}, [roomId])

	useEffect(() => {
		scrollToBottom()
	}, [messages])
	function onFinishRoomLoad() {
		setLoading(false)
		
	}

	function updateUnread(userLastSerials: number[]) {
		setMessages((msgs) => ({
			messages: msgs.messages,
			userLastSerials: userLastSerials,
			freshMsgSerial: -1,
		}))
	}
	const handleKeyPress = (event: any) => {
		if (event.key === "Enter") {
			sendMessage()
		}
	}
	function receiveMessageChunk(messageChunk: IChatMessage[], userLastSerials: number[]) {
		// message.unread = String(message.unread)

		for (const msg of messageChunk) {
			msg.profileImgDir = UserStorage.getProfileImg(msg.username)
			ChatStorage.storeMessage(roomId, msg)
		}

		setMessages((msgs) => ({
			messages: [...ChatStorage.loadStoredMessages(roomId), ...messageChunk],
			userLastSerials: userLastSerials,
			freshMsgSerial: -1,
		}))

		//setMaxSerial(ChatStorage.maxSerial(roomId))
	}

	function receiveMessage(message: IChatMessage, userLastSerials: number[]) {
		// message.unread = String(message.unread)

		setMessages((msgs) => ({
			messages: [...msgs.messages, message],
			userLastSerials: userLastSerials,
			freshMsgSerial: message.serial,
		}))
		ChatStorage.storeMessage(roomId, message)
		//setMaxSerial(ChatStorage.maxSerial(roomId))
	}
	function sendMessage() {
		let msg = (document.getElementById("msginput") as HTMLInputElement).value
		if (msg) {
			ChatSocket.sendChat(roomId, msg)
			;(document.getElementById("msginput") as HTMLInputElement).value = ""
		}
	}
	const messagesEndRef = useRef(null)

	const scrollToBottom = () => {
		;(messagesEndRef.current as any).scrollIntoView()
	}
	function fetchOld() {}
	function toggleUsers() {
		setUsersOpen(!usersOpen)
	}
	return (
		<>
			<div id="chatroom" onKeyDown={handleKeyPress}>
				{usersOpen && (
					<>
						<RoomUserList roomUsers={roomUsers} onClose={toggleUsers}/>
						<div id="shadow" className="shadow-inner"></div>
					</>
				)}

				<div className="contact bar">
					<Link to={onBack} className="back">
						<RiArrowLeftLine />{" "}
					</Link>
					<div className="pic"></div>
					<div className="name">{roomname}</div>
					<a className="menu" onClick={toggleUsers}>
						<RiMenuLine />
					</a>
					{/* <div className="seen">Today at 12:56</div> */}
				</div>

				<div className="messages" id="chat">
					{/* <div className="time">Today at 11:41</div> */}
					<Messages messages={messages} fetchOld={fetchOld}></Messages>
					<div style={{ float: "left", clear: "both" }} ref={messagesEndRef}></div>

					{/* <div className="message me">
        Uh, what is this guy's problem, Mr. Stark? 
      </div>
      <div>
        <div className="message">
          Uh, he's from space, he came here to steal a necklace from a wizard.
        </div>
      </div>
      <div>

        <div className="message">
          <div className="typing typing-1"></div>
          <div className="typing typing-2"></div>
          <div className="typing typing-3"></div>
        </div>
      </div> */}
				</div>
				<div className="input">
					<i>
						<RiImageFill />
					</i>
					<input name="message" id="msginput" placeholder={lText(locale,"chat.enter-ph")} type="text" />
					<i className="icon-primary">
						<RiSendPlane2Fill onClick={sendMessage} />
					</i>
				</div>
				{loading && <img id="loading" src="/res/img/ui/loading_purple.gif"></img>}
			</div>
		</>
	)
}
