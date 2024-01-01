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
const INITIAL_DATES = 15
const INTERVAL_MS = 200
const MAX_LEN = 2500
const DATE_RECORD_LEN = 20
export default class StockChart {
	private readonly stockvalues: number[]
	private readonly graph: IChartApi
	private readonly setval: React.Dispatch<React.SetStateAction<DisplayData>>
	private readonly setDayRecord: React.Dispatch<React.SetStateAction<DayRecord[]>>
	private readonly setStat: React.Dispatch<React.SetStateAction<StatData>>
	private readonly displayNews:(type:string,message:string,value:number)=>void
	private readonly player:PlayerManager
	private running: boolean
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
	constructor(stockvalues: number[], graph: IChartApi, setval: React.Dispatch<React.SetStateAction<DisplayData>>,setDayRecord: React.Dispatch<React.SetStateAction<DayRecord[]>>,
		setStat: React.Dispatch<React.SetStateAction<StatData>>,displayNews:(type:string,message:string,value:number)=>void,player:PlayerManager) {
		this.stockvalues = stockvalues
		this.graph = graph
		this.setval = setval
		this.setDayRecord=setDayRecord
		this.setStat=setStat
		this.displayNews=displayNews
		this.running = false
		this.records = []
		this.currPrice=-1
		this.priceRecords=[]
		this.markers=[]
		this.minClosePrice=Infinity
		this.maxClosePrice=-Infinity
		this.player=player
		this.currDate= {
			year: 2023,
			month: 12,
			date: 21,
		}
		
		this.smaLine5 = this.graph.addLineSeries({
			color: '#39ec39',
			lineWidth: 2,
			priceLineVisible: false,
			lastValueVisible: false,

		});
		this.smaLine20 = this.graph.addLineSeries({
			color: '#fd68ee',
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
		console.log(date)
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
		else{
			this.markers.push({time:dateStr(this.currDate),position:'aboveBar',
			color:"#2196F3",shape:"arrowDown",text:amount+"주 매도"})
		}
		this.candleSeries.setMarkers(this.markers as SeriesMarker<any>[])
	}
	stop() {
		// console.log("stop")
		this.running = false
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

		let split = ENTRIES_PER_DATE * INITIAL_DATES
		const initial = this.stockvalues.slice(0, split)
		let initialData = []
		let time = this.currDate
		
		
		
		let maxVal = -Infinity
		let minVal = Infinity
		let maxChange = -Infinity
		let minChange = Infinity

		let lastDayPrice = -1

		for (let i = 0; i < INITIAL_DATES; ++i) {
			
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


	async start(onTerminate: Function, onDelist: Function) {
		if(this.running) return

		let split = ENTRIES_PER_DATE * INITIAL_DATES
		const initial = this.stockvalues.slice(0, split)
		const values = this.stockvalues.slice(split, Math.min(this.stockvalues.length, split + MAX_LEN))
		let time = this.currDate
		this.player.setDate(dateStr(time))
		let maxVal = -Infinity
		let minVal = Infinity
		let maxChange = -Infinity
		let minChange = Infinity

		let lastDayPrice = -1

		let pos = 0

		this.currPrice = initial[initial.length - 1]
		let candle = newCandle(this.currPrice, time)
		lastDayPrice = initial[initial.length - 2]
		let delisted = false
		this.running = true
		while (pos < values.length) {
			if (pos % 2 === 1) {
				pos++
				continue
			}

			let val = values[pos]
			this.currPrice = Math.max(0,val)
			
			maxVal = Math.max(maxVal,val)
			minVal = Math.min(minVal,val)
			if (pos % ENTRIES_PER_DATE === 0) {
				
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

				await sleep(INTERVAL_MS)
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
				currCount: pos
			})
			this.onPriceChange(val)
			if (this.currPrice <= 0) {
				onDelist()
				delisted = true
				break
			}
			if (!this.running) {
				break
			}

			await sleep(INTERVAL_MS)
			pos++
		}
		if (!delisted) onTerminate()
	}
}
