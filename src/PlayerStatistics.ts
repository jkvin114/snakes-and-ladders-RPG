import { STAT } from "./enum"
import { Player } from "./player"
import * as Util from "./Util"
class PlayerStatistics {
	stats: number[]
	//0.damagetakenbychamp 1. damagetakenbyobs  2.damagedealt
	//3.healamt  4.moneyearned  5.moneyspent   6.moneytaken  7.damagereduced
	//8 timesrevived 9 timesforcemoved 10 basicattackused  11 timesexecuted
	player: Player
	positionRecord: number[]
	itemRecord: { item_id: number; count: number; turn: number }[]
	moneyRecord: number[]
	constructor(player: Player) {
		this.player = player
		this.stats = Util.makeArrayOf(0, 12)
		
		//record positions for every turn
		this.positionRecord = [0]

		//record gold earned for every turn
		this.moneyRecord = [0]
		//record when and what item the player bought
		this.itemRecord = []
	//	this.transfer(PlayerClientInterface.changeHP,null)
	}
	

	add(type: number, amt: number) {
		this.stats[type] += amt
	}
	addItemRecord(data: { item_id: number; count: number; turn: number }) {
		this.itemRecord.push(data)
	}
	addPositionRecord(data: number) {
		this.positionRecord.push(data)
	}
	addMoneyRecord() {
		this.moneyRecord.push(this.stats[STAT.MONEY_EARNED])
	}
}
export default PlayerStatistics
