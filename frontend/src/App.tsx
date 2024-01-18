import { Link, Route, Routes, useLocation, useParams } from "react-router-dom"
import HtmlPage from "./components/HtmlPage"
import "./index.css"
import StockGame from "./stockgame/StockGame"
import { LoginPage } from "./components/pages/Login"
import { useEffect, useState } from "react"
import { RegisterPage } from "./components/pages/Register"
import { backend_url } from "./variables"
import StatusPage from "./components/pages/Status"
import BoardPostWrite from "./components/pages/BoardPostWrite"
import axios from "axios"
import EjsPage from "./components/EjsPage"
import ProfilePage from "./components/pages/Profile"
import RelationPage from "./components/pages/Relation"
import { AxiosApi } from "./api/axios"
import ChatPage from "./components/pages/Chat"
import ChatRoom from "./components/chat/ChatRoom"
import SideBar from "./components/menu/Sidebar"
import TopBar from "./components/menu/TopBar"
import HomePage from "./components/pages/Home"
import MarbleStatPage from "./components/pages/MarbleStat"
import { INotification } from "./types/notification"
import { ToastContainer, toast } from "react-toastify"
import { RiMessage2Fill } from "react-icons/ri"
import Notifications from "./components/notification/Notifications"
import { IRootContext, RootContext } from "./context/context"
import { ToastHelper } from "./ToastHelper"
import { limitString } from "./util"




// Main App We run for frontend
function App() {
	const mountedRef = { current: false };
	const [notiCount,setNotiCount] = useState(0)
	const [rootState,_] = useState<IRootContext>({
		username:localStorage.getItem("username"),
		loggedin:localStorage.getItem("username") != null && localStorage.getItem("loggedIn") === "true"
	})
	const [notiQueue,setNotiQueue] = useState<INotification[]>([])
	function updateNotiCount(count:number){
		let username = localStorage.getItem("username")
		if(!username) return
		
		let unread = localStorage.getItem("noti-unread-"+username)
		if(!unread) {
			setNotiCount(count)
			localStorage.setItem("noti-unread-"+username,String(count))
		}
		else{
			setNotiCount(Number(unread)+count)
			localStorage.setItem("noti-unread-"+username,String(Number(unread)+count))
		} 
	}
	function onReceiveNoti(notis:INotification[]){
		if(notis.length===0) return
		
		if(window.location.pathname.split("/")[1] === "notification"){
			setNotiQueue(notis)
			setNotiCount(0)
			localStorage.removeItem("noti-unread-"+rootState.username)
			return
		}
		else{
			toast.info("New Message: "+limitString(notis[0].message), {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
				icon:(<RiMessage2Fill/>)
			})
			// ToastHelper.ChatToast("New Message: "+notis[0].message,)
			updateNotiCount(notis.length)
		}
		
	}
	function pollNotification(){
		console.log("start polling")
		AxiosApi.get("/notification/poll")
		.then(res=>{
			if(!mountedRef.current) return
			
			onReceiveNoti(res.data as INotification[])
			pollNotification()
		})
		.catch(e=>{
			if(e.response.status !== 401)
				console.error(e)
			if(!mountedRef.current) return
			setTimeout(pollNotification,5*1000)
		})
	}
	useEffect(() => {
		if(!mountedRef.current && localStorage.getItem("username") != null && localStorage.getItem("loggedIn"))
		{
			pollNotification()
			updateNotiCount(0)
		}	
		mountedRef.current=true

		// API.get("/statustest")
		// .then(res=>console.log(res))
		// .catch(e=>console.log(e))
		AxiosApi.post("/jwt/init")
		if(localStorage.getItem("username") != null)
			AxiosApi.post("/user/current")
			.then(res=>{
				if (res.data === "") {
					localStorage.removeItem("username")
					localStorage.removeItem("loggedin")
					window.location.reload()
				}
			})
		
		return () => {
			mountedRef.current = false;
			};
		  
	}, [])

	function logout() {
		AxiosApi.post("/user/logout")
			.then((r) => {
				window.location.href = "/"
				localStorage.removeItem("username")
			})
			.catch((e) => console.error(e))
	}
	const [navbarOpen,setNavbarOpen]=useState(false)
	function printsession(){
		AxiosApi.get("/session")
		.then(res=>console.log(res.data))
	}
	function closeNavbar(){
		setNavbarOpen(false)
	}
	function clearChatCache(){
		Object.keys(localStorage)
		.filter(x =>
			x.startsWith('chat-'))
		.forEach(x => 
			localStorage.removeItem(x))

	}
	return (
		<>
			<RootContext.Provider value={rootState}>
			<div id="page-root">
				<SideBar isOpen={navbarOpen} openNavbar={setNavbarOpen} notiCount={notiCount}/>
				<div>
					<TopBar openNavbar={setNavbarOpen}/>
					<div onClick={closeNavbar}>

					
					<Routes>
						<Route path="/" element={<HomePage/>}></Route>
						<Route path="/stockgame" element={<StockGame />}></Route>
						<Route path="/login" element={<LoginPage />}></Route>
						<Route path="/register" element={<RegisterPage />}></Route>
						<Route path="/status" element={<StatusPage />}></Route>
						<Route path="/writepost" element={<BoardPostWrite />}></Route>
						<Route path="/chat" element={<ChatRoom roomId="659c2791dbc11e5a15ec6e5a" />}></Route>
						<Route path="/marble_stat" element={<MarbleStatPage />}></Route>
						<Route path="/notification" element={<Notifications newNoti={notiQueue} setCount={setNotiCount}/>}></Route>

						<Route path="/user/:username" element={<ProfilePage />}></Route>
						<Route path="/user/" element={<ProfilePage />}></Route>
						<Route path="/user/:username/friend" element={<ProfilePage modal="friend" />}></Route>
						<Route path="/user/:username/follower" element={<ProfilePage modal="follower" />}></Route>
						<Route path="/user/:username/following" element={<ProfilePage modal="following" />}></Route>
						<Route path="/user/:username/setting" element={<ProfilePage modal="setting" />}></Route>

						{/* <Route path='/relation/:username' element={<RelationPage/>}></Route> */}

						<Route path="/board" element={<EjsPage />}>
							<Route path="/board/:arg1/:arg2" element={<EjsPage />}></Route>
							<Route path="/board/:arg1" element={<EjsPage />}></Route>
							<Route path="/board/:arg1/:arg2/:arg3" element={<EjsPage />}></Route>
							<Route path="/board/:arg1/:arg2/:arg3/:arg4" element={<EjsPage />}></Route>
						</Route>
						<Route path="/spectate" element={<HtmlPage htmlPath="spectate" />}></Route>
						<Route path="/stat" element={<HtmlPage htmlPath="stat" />}></Route>
						<Route path="/match" element={<HtmlPage htmlPath="matching" />}></Route>
						<Route path="/admin" element={<HtmlPage htmlPath="admin" />}></Route>
						<Route path="/find_room" element={<HtmlPage htmlPath="find_room" />}></Route>
						<Route path="/rpggame" element={<HtmlPage htmlPath="rpggame" />}></Route>
						<Route path="/marblegame" element={<HtmlPage htmlPath="marblegame" />}></Route>

					</Routes>
					</div>
					<button onClick={printsession}>session</button>
				<button onClick={clearChatCache}>clear chat</button>
				</div>
				

				{/* <StockGame/> */}
			</div>
			<ToastContainer></ToastContainer>
			</RootContext.Provider>
		</>
	)
}

export default App
