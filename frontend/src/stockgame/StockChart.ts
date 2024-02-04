import { IChartApi, IPriceLine, ISeriesApi, LineStyle, SeriesMarker, Time } from "lightweight-charts"
import { DayRecord, DisplayData, StatData } from "./types/DisplayData"
import { mean, rel_diff } from "./util"
import PlayerManager from "./types/PlayerManager"

type DateObj = {
	year: number
	month: number
	date: number
}
type CandleObj = {
	time: string
	open: number
	high: number
	low: number
	close: number
}
type ValueObj={
	time: string
	value:number
}
type MarkerObj={
	time:string
	position:string
	color:string
	shape:string
	text:string
}
function nextBusinessDay(time: DateObj): DateObj {
	var d = new Date()
	d.setUTCFullYear(time.year)
	d.setUTCMonth(time.month - 1)
	d.setUTCDate(time.date + 1)
	d.setUTCHours(0, 0, 0, 0)
	return {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth() + 1,
		date: d.getUTCDate(),
	}
}

function dateStr(dateObj: DateObj): string {
	const { year, month, date } = dateObj

	// Ensure that month and date are two digits
	const formattedMonth = month < 10 ? `0${month}` : `${month}`
	const formattedDate = date < 10 ? `0${date}` : `${date}`

	// Format the date as "yyyy-mm-dd"
	const formattedString = `${year}-${formattedMonth}-${formattedDate}`

	return formattedString
}
const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

function newCandle(value: number, date: DateObj): CandleObj {
	return {
		time: dateStr(date),
		open: value,
		high: value,
		low: value,
		close: value,
	}
}
function fullCandle(values: number[], date: DateObj): CandleObj {
	return {
		time: dateStr(date),
		open: values[0],
		high: Math.max(...values),
		low: Math.min(...values),
		close: values[values.length - 1],
	}
}

function updateCandle(value: number, candle: CandleObj): CandleObj {
	candle.close = value
	candle.high = Math.max(candle.high, value)
	candle.low = Math.min(candle.low, value)
	// console.log(candle)
	// return {
	// 	time:candle.time,
	// 	open:candle.open,
	// 	close:value,
	// 	high:Math.max(candle.high, value),
	// 	low:Math.min(candle.low, value)
	// }
	return candle
}
const ENTRIES_PER_DATE = 30
const INITIAL_DATES = 20
const INTERVAL_MS = 150
const MAX_LEN = 2000
const DATE_RECORD_LEN = 20
export default class StockChart {
	private readonly stockvalues: number[]
	private readonly graph: IChartApi
	private readonly setval: (data:DisplayData)=>void
	private readonly setDayRecord:(data:DayRecord[])=>void
	private readonly setStat: (data:StatData)=>void
	private readonly displayNews:(type:string,message:string,value:number)=>void
	private readonly player:PlayerManager
	private running: boolean
	private paused:boolean
	private records: {
		date: string
		value: number
		diff: number
	}[]
	private priceRecords :number[]
	private markers:MarkerObj[]
	private currPrice:number
	private currDate:DateObj
	private readonly candleSeries:ISeriesApi<any>
	private readonly smaLine5:ISeriesApi<any>
	private readonly smaLine20:ISeriesApi<any>
	private lastUnitAvgPriceLine:IPriceLine|undefined
	private lastUnitAvgPrice:number|undefined
	
	private minClosePrice:number
	private maxClosePrice:number

	private time:number
	private startTime:number
	seed:string
	constructor(stockvalues: number[], graph: IChartApi, setval: (data:DisplayData)=>void,setDayRecord:  (data:DayRecord[])=>void,
		setStat:  (data:StatData)=>void,displayNews:(type:string,message:string,value:number)=>void,player:PlayerManager,seed:string) {
		this.stockvalues = stockvalues
		this.graph = graph
		this.setval = setval
		this.setDayRecord=setDayRecord
		this.setStat=setStat
		this.displayNews=displayNews
		this.running = false
		this.paused=false
		this.records = []
		this.currPrice=-1
		this.priceRecords=[]
		this.markers=[]
		this.minClosePrice=Infinity
		this.maxClosePrice=-Infinity
		this.player=player
		this.time=0
		this.startTime = ENTRIES_PER_DATE * INITIAL_DATES
		this.currDate= {
			year: 2023,
			month: 12,
			date: 21,
		}
		this.seed=seed
		
		this.smaLine5 = this.graph.addLineSeries({
			color: 'green',
			lineWidth: 2,
			priceLineVisible: false,
			lastValueVisible: false,

		});
		this.smaLine20 = this.graph.addLineSeries({
			color: 'purple',
			lineWidth: 2,
			priceLineVisible: false,
			lastValueVisible: false,
		});
		this.candleSeries = this.graph.addCandlestickSeries({
			upColor: "#ff0000",
			downColor: "#0000ff",
			borderVisible: false,
			wickUpColor: "#ff0000",
			wickDownColor: "#0000ff",
		})

	}


	movingAvg(days:number){
		const prices = this.priceRecords.slice(-days,-1)
		return mean(prices)
	}
	
	addRecord(date: string, value: number, diff: number) {
		this.records.push({
			date: date,
			value: value,
			diff: diff,
		})
		if (this.records.length > DATE_RECORD_LEN) {
			this.records.shift()
		}
		this.priceRecords.push(value)
	}
	priceDiff(value: number, lastValue: number) {
		let diff = rel_diff(lastValue, value)
		if (lastValue === -1) diff = 0
		return diff
	}

	addMovingAvg(time:string){
		this.smaLine5.update({time:time,value :this.movingAvg(5)})
		this.smaLine20.update({time:time,value :this.movingAvg(20)})
	}

	addMarker(type:string,amount:number){
		if(type==="buy"){
			this.markers.push({time:dateStr(this.currDate),position:'belowBar',
			color:"#e91e63",shape:"arrowUp",text:amount+"주 매수"})
		}
		else if(type==="sell"){
			this.markers.push({time:dateStr(this.currDate),position:'aboveBar',
			color:"#2196F3",shape:"arrowDown",text:amount+"주 매도"})
		}
		else if(type==="end"){
			this.markers.push({time:dateStr(this.currDate),position:'aboveBar',
			color:"#ff5900",shape:"arrowDown",text:"거래 종료"})
		}
		this.candleSeries.setMarkers(this.markers as SeriesMarker<any>[])
	}
	stop() {
		// console.log("stop")
		this.running = false
	}
	pause(){
		this.running=false
		this.paused=true
	}

	get getCurrPrice(){
		return this.currPrice
	}
	get getDate(){
		return this.currDate
	}

	updateUnitAvg(value:number){
		if(value === this.lastUnitAvgPrice) return
		const avgPriceLine = {
			price: value,
			color: '#be1238',
			lineStyle: LineStyle.Solid,
			axisLabelVisible: true,
			title: '평단가',
		};
		this.lastUnitAvgPrice=value
		if(this.lastUnitAvgPriceLine) this.candleSeries.removePriceLine(this.lastUnitAvgPriceLine)
		this.lastUnitAvgPriceLine = this.candleSeries.createPriceLine(avgPriceLine)
	}
	onPriceChange(price:number){
		this.player.updateState(price)
		this.updateUnitAvg(this.player.avgUnitPrice)
	}
	init(){

		const split = this.startTime
		const initial = this.stockvalues.slice(0, split)
		let initialData = []
		let time = this.currDate
		
		
		
		let maxVal = -Infinity
		let minVal = Infinity
		let maxChange = -Infinity
		let minChange = Infinity

		let lastDayPrice = -1

		for (let i = 0; i < INITIAL_DATES; ++i) {
			console.log(i * ENTRIES_PER_DATE)
			const thisvalues = initial.slice(i * ENTRIES_PER_DATE, (i + 1) * ENTRIES_PER_DATE)
			const candle = fullCandle(thisvalues, time)
			if(candle.low <=0) continue
			initialData.push(candle)
	
			let diff = this.priceDiff(candle.close, lastDayPrice)		
			this.addRecord(candle.time, candle.close, diff)
			this.addMovingAvg(candle.time)

			maxChange = Math.max(maxChange,diff)
			minChange = Math.min(minChange,diff)
			maxVal = Math.max(maxVal,...thisvalues)
			minVal = Math.min(minVal,...thisvalues)
			this.minClosePrice = Math.min(this.minClosePrice,candle.close)
			this.maxClosePrice = Math.max(this.maxClosePrice,candle.close)
			lastDayPrice = candle.close
			time = nextBusinessDay(time)
		}
		this.currDate=time
		this.setval({
			value: lastDayPrice,
			lastDayValue: lastDayPrice,
			totalCount: 1,
			currCount: 0
			
		})
		this.setStat({
			minChange: minChange,
			maxChange: maxChange,
			minVal: minVal,
			maxVal: maxVal,
		})
		// console.log(initialData)
		this.candleSeries.setData(initialData)
		
		this.graph.timeScale().fitContent()
	}

	getTime(){
		return this.time + this.startTime
	}

	displayRemainingChart(start:number){
		if(this.running || this.paused) return
		this.addMarker("end",0)
		let end = this.startTime + MAX_LEN
		let mod = start %ENTRIES_PER_DATE
		start -= mod
		const values  = this.stockvalues.slice(start, end)
		let time = this.currDate

		for (let i=0;i<=Math.floor(values.length / ENTRIES_PER_DATE);++i) {
			
			const thisvalues = values.slice(i * ENTRIES_PER_DATE, (i + 1) * ENTRIES_PER_DATE)
			const candle = fullCandle(thisvalues, time)
			// data.push()
			// this.addMovingAvg(candle.time)
			time = nextBusinessDay(time)
			this.candleSeries.update({...candle})
			//상장폐지되면 차트 그만 표시함
			if(candle.low <=0) break
		}

		// this.candleSeries.setData(data)
		
		this.graph.timeScale().fitContent()
	}

	async start(onTerminate: Function, onDelist: Function) {
		if(this.running) return

		const split = this.startTime
		const initial = this.stockvalues.slice(0, split)
		const values = this.stockvalues.slice(split, Math.min(this.stockvalues.length, split + MAX_LEN))
		let time = this.currDate
		this.player.setDate(dateStr(time))
		let maxVal = -Infinity
		let minVal = Infinity
		let maxChange = -Infinity
		let minChange = Infinity

		let lastDayPrice = -1

		this.time = 0

		this.currPrice = initial[initial.length - 1]
		let candle = newCandle(this.currPrice, time)
		lastDayPrice = initial[initial.length - 2]
		let delisted = false
		this.running = true
		while (this.time < values.length) {
			if (this.time % 2 >=1) {
				this.time++
				continue
			}

			let val = values[this.time]
			this.currPrice = Math.max(0,val)
			
			maxVal = Math.max(maxVal,val)
			minVal = Math.min(minVal,val)
			if (this.time % ENTRIES_PER_DATE === 0) {
				
				let diff = this.priceDiff(candle.close, lastDayPrice)		
				this.addRecord(candle.time, candle.close, diff)
				this.addMovingAvg(candle.time)
				this.setDayRecord([...this.records].reverse())
				
				maxChange = Math.max(maxChange,diff)
				minChange = Math.min(minChange,diff)
				
				lastDayPrice = candle.close
				time = nextBusinessDay(time)
				this.currDate=time
				this.player.setDate(dateStr(time))
				candle = newCandle(this.currPrice, time)
				
				this.setStat({
					minChange: minChange,
					maxChange: maxChange,
					minVal: minVal,
					maxVal: maxVal,
				})
				if(candle.close > this.maxClosePrice){
					this.maxClosePrice = candle.close
					this.displayNews("maxcloseprice",dateStr(time),candle.close)
				}
				if(candle.close < this.minClosePrice){
					this.minClosePrice = candle.close
					this.displayNews("mincloseprice",dateStr(time),candle.close)
				}

				await sleep(INTERVAL_MS * 2)
			}else if(this.time % ENTRIES_PER_DATE === 2) {
				await sleep(INTERVAL_MS * 5)
			} else {
				candle = updateCandle(val, candle)
			}

			this.candleSeries.update({
				...candle
			})
			

			this.setval({
				value: val,
				lastDayValue: lastDayPrice,
				totalCount: values.length,
				currCount: this.time
			})
			this.onPriceChange(val)
			if (this.currPrice <= 0) {
				onDelist()
				delisted = true
				break
			}
			if (!this.running) {
				this.displayRemainingChart(this.getTime())
				break
			}

			await sleep(INTERVAL_MS)
			this.time++
		}
		if (!delisted) onTerminate()
	}
}
