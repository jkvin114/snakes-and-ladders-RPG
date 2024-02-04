import { useContext, useEffect, useRef, useState } from "react"
import "./../styles/stockgame/stockgame.css"
import "./../styles/stockgame/board.css"
import "./../styles/stockgame/result.scss"

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
import Transaction from "./types/Transaction"
import { RootContext } from "../context/context"
import { IStockGameResult, IStockGameResultResponse } from "./types/Result"
import { AxiosApi } from "../api/axios"
import { randName } from "../types/names"
import ResultModal from "./ResultModal"
import { ToastHelper } from "../ToastHelper"
import { sleep } from "../util"

type Props = {
	scale: number
	variance: number
	startMoney: number
	ranked:boolean
}

function StockGame({ scale, variance, startMoney,ranked }: Props) {
	let theme = "light"
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
	const [gameState, setGameState] = useState<"none" | "running" | "ended"|"paused">("none")
	const [playerState, setPlayerState] = useState<PlayerState>({
		money: 0,
		initialMoney: 0,
		avgUnitPrice: 0,
		shares: 0,
		profit: 0,
		profitRate: 0,
		totalAsset: 0,
	})
	const { context, setContext } = useContext(RootContext)

	const [tranHistory, setTranHistory] = useState<Transaction[]>([])
	const [player, setPlayer] = useState<PlayerManager>(
		new PlayerManager(startMoney, setPlayerState, setTranHistory, displayNews)
	)
	const [modal,setModal] = useState(false)
	const [processing,setProcessing] = useState(false)
	const [clientResult,setClientResult] = useState<IStockGameResult|null>(null)
	const [serverResult,setServerResult] = useState<IStockGameResultResponse|null>(null)

	function onTerminate() {
		if (stockChart) {
			player.sellPercent(stockChart.getCurrPrice, 1, stockChart.getTime())
		}
		setGameState("ended")
		postResult()
	}
	function onDelist() {
		if (!stockChart) return

		let time= stockChart.getTime()
		player.delist(time)
		setGameState("ended")
		postResult(time)
	}
	function stopChart() {
		if (stockChart != null && gameState === "running") {
			setGameState("ended")
			stockChart.stop()
		}
	}
	function sellFunc(percent: number) {
		if (stockChart && gameState === "running") {
			let count = player.sellPercent(stockChart.getCurrPrice, percent, stockChart.getTime())
			stockChart.addMarker("sell", count)
		}
	}
	function buyFunc(percent: number) {
		if (stockChart && gameState === "running") {
			let count = player.buyPercent(stockChart.getCurrPrice, percent, stockChart.getTime())
			stockChart.addMarker("buy", count)
		}
	}
	function start() {
		if (stockChart && gameState === "none") {
			setGameState("running")
			stockChart.start(onTerminate, onDelist)
		}
	}
	async function postResult(delistTime?: number) {
		if (!stockChart || !playerState) return

		const { transactionHistory, finaltotal, profitRate } = player.evalResult()
		const name = "(Anonymous) "+randName()+"_"+(Math.floor(Math.random() * 100))
		const result = {
			transactionHistory: transactionHistory,
			seed: stockChart.seed,
			chartgenVersion: "",
			variance: variance,
			scale: scale,
			score: finaltotal,
			initialMoney:startMoney,
			finaltotal : finaltotal,
			username:name
		} as IStockGameResult

		let percent = round(profitRate * 100, -2)
		if (delistTime) {
			result.delistAt = delistTime
			// alert(`상장폐지!, 수익률:${percent}%`)
			ToastHelper.InfoToast(`상장폐지!, 수익률:${percent}%`)
		}
		else{
			ToastHelper.InfoToast(`게임 종료, 수익률:${percent}%`)
		}
		setProcessing(true)
		

		await sleep(4000)

		AxiosApi.post("/stockgame/result",{
			result:result,username:name
		})
		.then(res=>{
			setProcessing(false)
			setClientResult(result)
			setServerResult(res.data)
			setModal(true)
			// console.log(res.data)
		})
		.catch(e=>console.error(e))
		
	}
	function displayNews(type: string, message: string, value: number) {
		if(window.innerWidth < 768) return

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
		if (type === "tran") {
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
		if (type === "tran-fail") {
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
		try {

			const data = (await AxiosApi.get(`/stockgame/generate?variance=${variance}&scale=${scale}`)).data
			if(!data) return
			// console.log(data)
			const width = window.innerWidth > 768 ? window.innerWidth * 0.6 : window.innerWidth*0.95
			const height = window.innerHeight * 0.5

			let layout = undefined
			let grid = undefined
			if (theme === "dark") {
				layout = {
					background: {
						type: ColorType.Solid,
						color: "#1d1d2d",
					},
					textColor: "#D9D9D9",
				}
				grid = {
					vertLines: {
						color: "#2B2B43",
					},
					horzLines: {
						color: "#363C4E",
					},
				}
			}
			const chart = createChart(document.getElementById("graph") as HTMLElement, {
				width: width ,
				height: height,
				crosshair: {
					mode: CrosshairMode.Normal,
				},
				layout: layout,
				grid: grid,
			})
			const { prices, seed, trend_changes, steep_increase, steep_decrease } = data

			let schart = new StockChart(prices, chart, setVal, setDayRecord, setStat, displayNews, player, String(seed))
			schart.init()
			setStockChart(schart)
		} catch (e) {
			// console.error(e)
			console.trace(e)
		}
	}

	useEffect(() => {
		if (!dataFetch.current) {
			dataFetch.current = true
			fetchstock()
		}
		setContext({ ...context, showToolbar: false })

		return () => {
			setContext({ ...context, showToolbar: true })
		}
	}, [])

	return (
		<>
			<div className={"root " +(modal?"scroll-lock":"")} id="root-stockgame" data-theme={theme}>
				{modal && <div className="shadow"></div>}

				{(modal && clientResult && serverResult) && 
				<ResultModal clientResult={clientResult} serverResult={serverResult}/>}
				<div className="section">
					<div id="score-board" className="subsection ">
						<ScoreBoard gameState={gameState} player={playerState} price={val} startFunc={start} stopFunc={stopChart} />
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
				{processing && <div id="processing">
					<img src="/res/img/ui/loading_purple.gif"></img><br></br>
					Processing Result....
				</div>}
				<div className="btn-toolbar">
					{gameState==="none"?<div className="start-btn" onClick={start}>거래 시작</div>:""}
					{gameState==="running"?<div className="stop-btn" onClick={stopChart}>전량 매도 후 거래 종료</div>:""}
				</div>
			</div>
		</>
	)
}

export default StockGame
