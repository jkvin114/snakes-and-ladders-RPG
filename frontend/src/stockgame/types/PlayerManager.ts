import { rel_diff } from "../util"
import { PlayerState } from "./PlayerState"
import Transaction from "./Transaction"

interface Share {
	price: number
	count: number
}
export default class PlayerManager {
	money: number
	private readonly initialMoney: number
	shares: Share[]
	transactions: Transaction[]
	shareCount: number
	totalProfit: number
	avgUnitPrice: number
	profitRate: number
	currProfit: number
	lastSharePrice: number
	private currDate: string
	setState: React.Dispatch<React.SetStateAction<PlayerState>>
	setTranHistory: React.Dispatch<React.SetStateAction<Transaction[]>>
	private readonly displayNews: (type: string, message: string, value: number) => void
	constructor(
		money: number,
		setState: React.Dispatch<React.SetStateAction<PlayerState>>,
		setTranHistory: React.Dispatch<React.SetStateAction<Transaction[]>>,
		displayNews: (type: string, message: string, value: number) => void
	) {
		this.money = money
		this.initialMoney = money
		this.shares = []
		this.transactions = []
		this.shareCount = 0
		this.totalProfit = 0
		this.avgUnitPrice = 0
		this.profitRate = 0
		this.currProfit = 0
		this.lastSharePrice = 0
		this.setState = setState
		this.setTranHistory = setTranHistory
		this.displayNews = displayNews
		this.currDate = ""
	}
	setDate(date: string) {
		this.currDate = date
	}
	/**
	 *
	 * @param sharePrice
	 *
	 * [수익률, 수익, 평단가]
	 */
	updateState(sharePrice: number) {
		const totalUnitPrice = this.shares.reduce((prev, curr) => {
			return prev + curr.count * curr.price
		}, 0)
		this.currProfit = sharePrice * this.shareCount - totalUnitPrice
		this.avgUnitPrice = this.shareCount === 0 ? 0 : totalUnitPrice / this.shareCount
		this.profitRate = rel_diff(totalUnitPrice, sharePrice * this.shareCount)

		this.setState({
			money: this.money,
			initialMoney: this.initialMoney,
			avgUnitPrice: this.avgUnitPrice,
			shares: this.shareCount,
			profit: this.currProfit,
			profitRate: this.profitRate,
			totalAsset: this.money + sharePrice * this.shareCount,
		})
		this.lastSharePrice = sharePrice
	}
	evalResult() {
		let finaltotal = this.money + this.lastSharePrice * this.shareCount
		return {
			finaltotal: finaltotal,
			profitRate: rel_diff(this.initialMoney, finaltotal),
		}
	}
	delist() {
		this.sellPercent(0, 1)
	}
	addTranHistory(tran: Transaction) {
		if (tran.shares === 0) {
			if (tran.type === "buy") this.displayNews("tran-fail", "더이상 매수할 수 없습니다", 0)
			else this.displayNews("tran-fail", "더이상 매도할 수 없습니다", 0)
			return
		}
		if (tran.type === "buy") this.displayNews("tran", tran.shares + "주 매수채결", 0)
		else this.displayNews("tran", tran.shares + "주 매도채결", 0)

		this.transactions.push(tran)
		this.setTranHistory([...this.transactions].reverse())
	}

	sellPercent(price: number, percent: number) {
		//console.log("sell" + price)
		let count =  Math.floor(this.shareCount * percent)
		this.sell(price,count)
		this.updateState(price)
		return count
	}
	buyPercent(price: number, percent: number) {
		let amt = this.buyableAmt(price, percent)
		//console.log("buy" + amt)
		this.buy(price, amt)
		this.updateState(price)
		return amt
	}

	buy(price: number, count: number) {
		count = Math.min(count, this.buyableAmt(price))
		this.shares.push({
			price: price,
			count: count,
		})
		this.shareCount += count
		this.money -= count * price

		this.addTranHistory({
			type: "buy",
			shares: count,
			money: count * price,
			date: this.currDate,
		})
	}
	buyableAmt(price: number, percent?: number) {
		if (percent === undefined) percent = 1
		return Math.floor((this.money * percent) / price)
	}
	/**
	 *
	 * @param price
	 * @param count
	 *
	 *
	 *  return 수익
	 */
	sell(price: number, count: number) {
		count = Math.min(this.shareCount, count)

		let soldCount = 0
		let shareIdx = 0
		let profit = 0
		let earning = 0
		while (soldCount < count) {
			const share = this.shares[shareIdx]
			let countleft = count - soldCount
			if (share.count <= countleft) {
				earning += share.count * price
				profit += share.count * (price - share.price)
				soldCount += share.count
				share.count = 0
			} else {
				earning += countleft * price
				profit += countleft * (price - share.price)
				soldCount += countleft
				share.count -= countleft
			}
			shareIdx++
		}
		this.addTranHistory({
			type: "sell",
			shares: count,
			money: earning,
			date: this.currDate,
		})
		this.shareCount -= count
		this.money += earning
		this.totalProfit += profit
		this.shares = this.shares.filter((s) => s.count > 0)
	}
}
