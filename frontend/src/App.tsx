
import { Route, Routes } from "react-router-dom";
import HtmlPage from "./components/HtmlPage";
import "./index.css"
import StockGame from "./stockgame/StockGame";
import { LoginPage } from "./components/pages/Login";
import { useEffect } from "react";
import { RegisterPage } from "./components/pages/Register";
import { backend_url } from "./variables";
import StatusPage from "./components/pages/Status";
import BoardPage from "./components/pages/Board";
import axios from "axios";

axios.defaults.withCredentials = true; // NEW


// Main App We run for frontend
function App() {

	const API = axios.create({ baseURL: backend_url });
	async function init() {
		
		// let data=sessionStorage.getItem("jwt")

		// let response=await API.get("/test/jwt/verify",
		// {  
		// 	headers:{
		// 		 		'Authorization': `Bearer ${data}`, // notice the Bearer before your token
		// 		 	}
		// })

		// let valid=response.data
		// if(!valid) sessionStorage.removeItem("jwt")

		try{
			// if(!sessionStorage.getItem("jwt")){
			// 	data=await ((await fetch(url,{credentials: 'include'})).text())
			// 	console.log(data)
			// 	sessionStorage.setItem("jwt",data)
			// }

			// await API.post("/jwt/init")
			// await API.get("test/jwt/verify")
			// console.log(res)
			// sessionStorage.setItem("jwt",res.data)

			// await API.post("/test/jwt",{},{
			// 	headers:{
			// 		'Authorization': `Bearer ${res.data}`, // notice the Bearer before your token
			// 	}
			// })
			// await (await fetch(url, {
			// 	method: "POST",
			// 	mode:'cors', 
			// 	credentials:"include",
			// 	headers:{
			// 		'Authorization': `Bearer ${data}`, // notice the Bearer before your token
			// 	}
			// }))
		}
		catch(e){
			console.error(e)
		}
	}

	useEffect(()=>{
		API.post("/jwt/init")
	},[])

	function logout() {
		API.post("/user/logout")
		.then(r=>{
			window.location.href="/"
			localStorage.removeItem("username")
		})
		.catch(e=>console.error(e))
	}
	return (
    <>
	    <Routes>
			<Route path='/stockgame' element={<StockGame/>}></Route> 
			<Route path='/login' element={<LoginPage/>}></Route> 
			<Route path='/register' element={<RegisterPage/>}></Route> 
			<Route path='/status' element={<StatusPage/>}></Route> 
			<Route path='/board' element={<BoardPage/>}></Route> 

			<Route path='/' element={<HtmlPage htmlPath="home"/>}></Route> 
			<Route path='/spectate' element={<HtmlPage htmlPath="spectate"/>}></Route> 
			<Route path='/stat' element={<HtmlPage htmlPath="stat"/>}></Route> 
			<Route path='/find_room' element={<HtmlPage htmlPath="find_room"/>}></Route> 

		</Routes>
		<button onClick={logout}> logout</button>
		{/* <StockGame/> */}
	</>
	)
}

export default App
