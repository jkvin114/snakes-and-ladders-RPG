
import { Route, Routes } from "react-router-dom";
import HtmlPage from "./components/HtmlPage";
import "./index.css"
import StockGame from "./stockgame/StockGame";
import { LoginPage } from "./components/pages/Login";
import { useEffect } from "react";
import { RegisterPage } from "./components/pages/Register";
import { backend_url } from "./variables";

// Main App We run for frontend
function App() {
	const url= backend_url + "/test/jwt"

	async function init() {
		let data=sessionStorage.getItem("jwt")
		let valid=(!data) ? false: await ((await fetch( backend_url+"/test/jwt/verify",
		{
			headers:{
				 		'Authorization': `Bearer ${data}`, // notice the Bearer before your token
				 	}
		})).json())
		if(!valid) sessionStorage.removeItem("jwt")


		try{
			if(!sessionStorage.getItem("jwt")){
				data=await ((await fetch(url)).text())
				console.log(data)
				sessionStorage.setItem("jwt",data)
			}
			
			// await (await fetch(url, {
			// 	method: "POST",
			// 	mode:'cors',
			// 	headers:{
			// 		'Authorization': `Bearer ${data}`, // notice the Bearer before your token
			// 	}
			// }))
		}
		catch(e){
			console.error(e)
		}
	}

	useEffect(()=>{init()},[])

	return (
    <>
	    <Routes>
		<Route path='/stockgame' element={<StockGame/>}></Route> 
		<Route path='/login' element={<LoginPage/>}></Route> 
		<Route path='/register' element={<RegisterPage/>}></Route> 

        <Route path='/' element={<HtmlPage htmlPath="home"/>}></Route> 
		<Route path='/spectate' element={<HtmlPage htmlPath="spectate"/>}></Route> 
		<Route path='/stat' element={<HtmlPage htmlPath="stat"/>}></Route> 
		<Route path='/find_room' element={<HtmlPage htmlPath="find_room"/>}></Route> 

		</Routes>
		{/* <StockGame/> */}
	</>
	)
}

export default App
