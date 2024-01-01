
import { Route, Routes } from "react-router-dom";
import HtmlPage from "./components/HtmlPage";
import "./index.css"
import StockGame from "./stockgame/StockGame";

// Main App We run for frontend
function App() {

	return (
    <>
	    <Routes>
		<Route path='/stockgame' element={<StockGame/>}></Route> 

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
