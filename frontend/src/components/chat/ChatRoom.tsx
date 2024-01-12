import { ChangeEvent, useRef, useState } from "react"
import { ChatStorage } from "../../storage/chatStorage"
import { IChatUser, IChatMessage } from "../../types/chat"
import { AxiosApi } from "../../api/axios"
import { useEffect } from "react"
import "../../styles/chat.scss"
import { RiImageFill, RiSendPlane2Fill, RiSendPlaneFill } from "react-icons/ri"
import { createChatSocket } from "../../api/chatsocket"
type Props = {
	roomId: string
}
export default function ChatRoom({ roomId }: Props) {
	const [roomUsers, setRoomUsers] = useState<IChatUser[]>([])
	const [message, setMessage] = useState("")
	const [messages, setMessages] = useState<IChatMessage[]>(ChatStorage.loadStoredMessages(roomId))
	const [maxSerial, setMaxSerial] = useState<number>(ChatStorage.maxSerial(roomId))
  const [roomname,setRoomName] = useState('?')
  const [sendchat,setSendchat] = useState<((roomid: string, message: string) => void)|null>(null)
  let connected=false
  function onload(){
    if(connected) return

    const [socket,joinRoom,leaveRoom,sendChat] = createChatSocket()

    connected=true
    console.log(sendChat)
    setSendchat(sendChat)
    
    joinRoom(roomId,maxSerial)
    socket.on("chat:message_received", (data) => {
      receiveMessage({
        message:data.message,
        serial:data.serial,
        unread:String(data.unread),
        username:data.sender.username,
        profileImgDir:data.sender.profileImgDir
      })
      setMaxSerial(data.serial)
})
socket.on("chat:message_sent", (data) => {
  receiveMessage({
    message:data.message,
    serial:data.serial,
    unread:String(data.unread),
    username:data.sender.username,
    profileImgDir:data.sender.profileImgDir
  })
})
socket.on("chat:joined_room", (data) => {
      setRoomName("Room:"+data.room.name)
})
socket.on("chat:user_join", (data) => {
    decrementUnreadFrom(data.userLastSerial)
    ChatStorage.decrementUnread(roomId,data.userLastSerial)
})

socket.on("chat:user_quit", () => {
    
})
socket.on("chat:error", (data) => {
    console.error(data)
    alert("error")
})

  }
  useEffect(() => {
    
    onload()
		AxiosApi.get("/chat/users/"+roomId)
		.then(res=>{
		    console.log(res.data)
		    setRoomUsers(res.data)
		})
		.catch(e=>{
		    console.error(e)
		})
    return
		setMessages([
			{
				username: "me",
				profileImgDir: "",
				message: "hewrewsdfsdf",
				unread: "2",
				serial: 1,
			},
			{
				username: "33",
				profileImgDir: "",
				message: "hewrewsdddddddddddddfsdf",
				unread: "2",
				serial: 2,
			},
		])
	}, [])

  useEffect(()=>{
    scrollToBottom()
  },[messages])
	function decrementUnreadFrom(from: number) {
		setMessages(
			messages.map((m) => {
				if (m.serial >= from && m.unread !== null && m.unread !== "0") {
					if (isNaN(Number(m.serial))) m.unread = "0"
					else m.unread = String(Math.max(Number(m.serial) - 1, 0))
				}
				return m
			})
		)
	}
  const handleKeyPress = (event:any) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  };

	function receiveMessage(message: IChatMessage) {
		message.unread = String(message.unread)
		setMessages([...messages, message])
    console.table(messages)
    ChatStorage.storeMessage(roomId,message)
	}
	function sendMessage() {
    let msg = (document.getElementById("msginput") as HTMLInputElement).value
    console.log(sendchat)
		if (msg && sendchat) {
      
      sendchat(roomId,msg);
        // receiveMessage({
        //   message:message,
        //   serial:1,
        //   unread:"1",
        //   username:"mr",
        //   profileImgDir:"1677714448288.png"
        // });
        (document.getElementById("msginput") as HTMLInputElement).value=""
		}
	}
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setMessage(value)
	}
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    (messagesEndRef.current as any).scrollIntoView()
  }

  
	const me = localStorage.getItem("username")
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
					{messages.map((m) => {
						if (m.username !== me) {
							return (
								<div key={m.serial} className="message-container">
									<div
										className={
											"profileimg-container divlink" + (!m.profileImgDir || m.profileImgDir === "" ? " " : " has-img")
										}>
										{!m.profileImgDir || m.profileImgDir === "" ? (
											<b>{m.username && m.username.charAt(0).toUpperCase()}</b>
										) : (
											<img className="profileimg" src={"/uploads/profile/" + m.profileImgDir}></img>
										)}
									</div>

									<div  className="message-other">
										<div className="name">{m.username} </div>
										<div className="message">{m.message}</div>
									</div>
									<b className="unread">{m.unread && m.unread !== "0" ? m.unread : ""}</b>
								</div>
							)
						} else {
							return (
								<div  key={m.serial} className="message-container me">
									<b className="unread">{m.unread && m.unread !== "0" ? m.unread : ""}</b>
									<div className="message me">{m.message}</div>
								</div>
							)
						}
					})}
        <div style={{ float:"left", clear: "both" }}
             ref={messagesEndRef}>
        </div>

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
					<input name="message" id="msginput" placeholder="Type your message here!" type="text"
           />
					<i className="icon-primary">
						<RiSendPlane2Fill onClick={sendMessage} />
					</i>
				</div>
			</div>
		</>
	)
}
