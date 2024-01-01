import { useEffect, useRef, useState } from "react"
import "./../styles/stockgame/stockgame.css"
import './../styles/stockgame/board.css';

import { ColorType, createChart, CrosshairMode, IChartApi } from "lightweight-charts"
import { DayRecord, DisplayData, StatData } from "./types/DisplayData"
import StockChart from "./StockChart"
import { round, triDist } from "./util"
import { PlayerState } from "./types/PlayerState"
import PlayerManager from "./types/PlayerManager"
import { ScoreBoard } from "../components/stockgame/ScoreBoard"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { TradeBoard } from "../components/stockgame/TradeBoard"
import { TranHistoryBoard } from "../components/stockgame/TranHistoryBoard"
import { StatBoard } from "../components/stockgame/StatBoard"
import Transaction from "./types/Transaction";

// Main App We run for frontend
function StockGame() {
	let theme="light"
	const dataFetch = useRef(false)
	const [val, setVal] = useState<DisplayData>({
		value: 0,
		lastDayValue: 0,
		totalCount: 0,
		currCount: 0,
	})
	const [stat, setStat] = useState<StatData>({
		maxChange: 0,
		minChange: 0,
		maxVal: 0,
		minVal: 0,
	})
	const [dayRecord, setDayRecord] = useState<DayRecord[]>([])
	const [stockChart, setStockChart] = useState<null | StockChart>(null)
  const [gameState,setGameState] = useState<"none"|"running"|"ended">("none")
	const [playerState, setPlayerState] = useState<PlayerState>({
		money: 0,
    initialMoney:0,
		avgUnitPrice: 0,
		shares: 0,
		profit: 0,
		profitRate: 0,
		totalAsset: 0,
	})
  const [tranHistory, setTranHistory] = useState<Transaction[]>([])
	const [player, setPlayer] = useState<PlayerManager>(new PlayerManager(10000, setPlayerState,
    setTranHistory,displayNews))
	function onTerminate() {
		if (stockChart) {
			player.sellPercent(stockChart.getCurrPrice, 1)
		}
    setGameState("ended")
		let result = player.evalResult()
		alert(`게임 종료, 수익률:${round(result.profitRate * 100, -2)}%`)
	}
	function onDelist() {
		player.deList()
    setGameState("ended")
		let result = player.evalResult()
		alert(`상장폐지!, 수익률:${round(result.profitRate * 100, -2)}%`)
	}
	function stopChart() {
		if (stockChart != null && gameState==="running") {
      setGameState("ended")
			stockChart.stop()
		}
	}
	function sellFunc(percent:number) {
		if (stockChart && gameState==="running") {
      let count=player.sellPercent(stockChart.getCurrPrice, percent)
      stockChart.addMarker("sell",count)
    }
    
	}
	function buyFunc(percent:number) {
		if (stockChart && gameState==="running") {
      let count=player.buyPercent(stockChart.getCurrPrice, percent)
      stockChart.addMarker("buy",count)
    }
    
	}
	function start() {
		if (stockChart && gameState==="none") {
      setGameState("running")
      stockChart.start(onTerminate, onDelist)
    }
	}
	function displayNews(type: string, message: string, value: number) {
		if (type === "mincloseprice") {
			toast.error(`신저가 경신! (${value})`, {
				position: "top-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
			})
		}
		if (type === "maxcloseprice") {
			toast.success(`신고가 경신! (${value})`, {
				position: "top-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
			})
		}
    if(type==="tran"){
      toast.info(message, {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
			})
    }
    if(type==="tran-fail"){
      toast.error(message, {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
			})
    }
	}
	async function fetchstock() {
		let variance = 1
		let scale = 50 + triDist(200, 200)
		const data = await (
			await fetch(`http://127.0.0.1:5000/gen_stock?variance=${variance}&scale=${scale}`, { mode: "cors" })
		).json()
		// console.log(data)
    const width = window.innerWidth
    const height = window.innerHeight

	let layout = undefined
	let grid=undefined
	if(theme==="dark"){
		layout= {
			background: {
				type: ColorType.Solid,
				color: '#1d1d2d',
			},
			textColor: '#D9D9D9',
		}
		grid= {
			vertLines: {
				color: '#2B2B43',
			},
			horzLines: {
				color: '#363C4E',
			},
		}
	}
		const chart = createChart(document.getElementById("graph") as HTMLElement, {
			width: width*0.6,
			height: height*0.5,
			crosshair: {
				mode: CrosshairMode.Normal,
			} ,
			layout:layout,
			grid:grid
				
		})
    const {prices,seed,trend_changes,steep_increase,steep_decrease} = data

		let schart = new StockChart(prices, chart, setVal, setDayRecord, setStat, displayNews, player)
		schart.init()
		setStockChart(schart)
	}

	useEffect(() => {
		if (dataFetch.current) return
		dataFetch.current = true
		fetchstock()
	}, [])

	return (
    <>
	<div className="root" data-theme={theme}>
      <div  className="section">
        <div id="score-board" className="subsection ">
          <ScoreBoard gameState={gameState} player={playerState}  price={val} startFunc={start} stopFunc={stopChart}/>
        </div>
        <div id="graph"></div>
        <div id="trade-board" className="subsection bordered">
          <TradeBoard player={playerState} price={val} buyFunc={buyFunc} sellFunc={sellFunc}></TradeBoard>
        </div>
      </div>
      <div className="section">
        <div id="stat-board" className="subsection bordered">
          <StatBoard record={dayRecord} stats={stat}></StatBoard>
        </div>
        <div id="history-board" className="subsection bordered">
          <TranHistoryBoard record={tranHistory}></TranHistoryBoard>
        </div>
      </div>
		</div>
    <ToastContainer></ToastContainer></>
	)
}

export default StockGame
