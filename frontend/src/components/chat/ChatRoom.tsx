import { ChangeEvent, useRef, useState } from "react"
import { ChatStorage } from "../../storage/chatStorage"
import { IChatUser, IChatMessage, IMessageData } from "../../types/chat"
import { AxiosApi } from "../../api/axios"
import { useEffect } from "react"
import "../../styles/chat.scss"
import { RiImageFill, RiSendPlane2Fill, RiSendPlaneFill } from "react-icons/ri"
import { ChatSocket } from "../../api/chatsocket"
import { UserStorage } from "../../storage/userStorage"
import Messages from "./Messages"
type Props = {
	roomId: string

}

export default function ChatRoom({ roomId }: Props) {
	const [roomUsers, setRoomUsers] = useState<IChatUser[]>([])
	const [messages, setMessages] = useState<IMessageData>({messages:[],userLastSerials:[0]})
	//const [maxSerial, setMaxSerial] = useState<number>(0)
	const [roomname, setRoomName] = useState("?")
	let connected = false

	function onload() {
		if (connected) return
		connected=true
		//setMessages(ChatStorage.loadStoredMessages(roomId))
		//setMaxSerial(ChatStorage.maxSerial(roomId))
		setTimeout(()=>ChatSocket.joinRoom(roomId, ChatStorage.maxSerial(roomId)),500)
		//console.log(messages[0])
	//	console.log(messages.length)
		ChatSocket.on("chat:message_received", (data) => {
			if(!ChatSocket.isConnected()) return
			let lastserials = data.userLastSerials
			delete data.userLastSerials
			receiveMessage({
				...data,
				profileImgDir: UserStorage.getProfileImg(data.username),
			},lastserials)
		//	console.log("unread:"+data.unread)
			
		})
		ChatSocket.on("chat:message_sent", (data) => {
			let lastserials = data.userLastSerials
			delete data.userLastSerials
			receiveMessage({
				...data,
				profileImgDir: UserStorage.getProfileImg(data.username),
			},lastserials)
			//console.log("unread:"+data.unread)
		})
		ChatSocket.on("chat:joined_room", (data) => {
			setRoomName("Room:" + data.room.name)
			receiveMessageChunk(data.messages,data.userLastSerials)
		})
		ChatSocket.on("chat:user_join", (data) => {
			if(!ChatSocket.isConnected()) return
			updateUnread(data.userLastSerials)
			//ChatStorage.decrementUnread(roomId, data.userLastSerials)
		})

		ChatSocket.on("chat:user_quit", () => {
			if(!ChatSocket.isConnected()) return
		})
		ChatSocket.on("chat:error", (data) => {
			console.error(data)
			alert("error")
		})

		AxiosApi.get("/chat/users/" + roomId)
			.then((res) => {
				console.table(res.data)
				setRoomUsers(res.data)
				saveUser(res.data)
			})
			.catch((e) => {
				console.error(e)
			})
	}
	function saveUser(users:IChatUser[]){
		for(const user of users){
			UserStorage.saveUser(user.username,user.profileImgDir)
		}
	}

	useEffect(() => {
	//	console.log("load")
		onload()
		return () => {
			ChatSocket.leaveRoom(roomId)
		}
	}, [])

	

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	function updateUnread(userLastSerials: number[]) {
		setMessages(msgs => ({
			messages:msgs.messages,
			userLastSerials:userLastSerials,
			freshMsgSerial:-1
		}))
	}
	const handleKeyPress = (event: any) => {
		if (event.key === "Enter") {
			sendMessage()
		}
	}
	function receiveMessageChunk(messageChunk: IChatMessage[],userLastSerials:number[]) {
		// message.unread = String(message.unread)
		
		for(const msg of messageChunk){
			msg.profileImgDir = UserStorage.getProfileImg(msg.username)
			ChatStorage.storeMessage(roomId, msg)
		}

		setMessages(msgs=>({
			messages:[...ChatStorage.loadStoredMessages(roomId), ...messageChunk],
			userLastSerials:userLastSerials,
			freshMsgSerial:-1
		}))

		//setMaxSerial(ChatStorage.maxSerial(roomId))
	}

	function receiveMessage(message: IChatMessage,userLastSerials:number[]) {
		// message.unread = String(message.unread)
		
		setMessages(msgs=>({
			messages:[...msgs.messages, message],
			userLastSerials:userLastSerials,
			freshMsgSerial:message.serial
		}))
		ChatStorage.storeMessage(roomId, message)
		//setMaxSerial(ChatStorage.maxSerial(roomId))
	}
	function sendMessage() {
		let msg = (document.getElementById("msginput") as HTMLInputElement).value
		if (msg) {
			ChatSocket.sendChat(roomId, msg);
			(document.getElementById("msginput") as HTMLInputElement).value = ""
		}
	}
	const messagesEndRef = useRef(null)

	const scrollToBottom = () => {
		;(messagesEndRef.current as any).scrollIntoView()
	}
	function fetchOld(){
		
	}
	
	return (
		<>
			<div id="chatroom" onKeyDown={handleKeyPress}>
				<div className="contact bar">
					<div className="pic"></div>
					<div className="name">{roomname}</div>
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
					<input name="message" id="msginput" placeholder="Type your message here!" type="text" />
					<i className="icon-primary">
						<RiSendPlane2Fill onClick={sendMessage} />
					</i>
				</div>
			</div>
		</>
	)
}
