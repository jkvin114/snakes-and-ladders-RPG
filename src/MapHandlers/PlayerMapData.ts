import { PlayerClientInterface } from "../app"
import { Player } from "../player"
import { MAP } from "../Game"
import * as ENUM from "../enum"
import { CALC_TYPE, Damage, randomBoolean, singleMap } from "../Util"
import { EntityFilter } from "../EntityFilter"
import { ObstacleHelper } from "../helpers"

interface TwoWayMap {
	onMainWay: boolean //갈림길 체크시 샤용
	inSameWayWith(other: Player): boolean
	needToAskWay2(moveDistance: number): void
	checkWay2(dice: number): boolean
	goWay2(): void
	exitWay2(dice: number): void
	checkWay2OnForceMove(pos: number):void
}

abstract class PlayerMapHandler {
	nextdmg: number
	player: Player
	gamemap: singleMap
	constructor(player: Player) {
		this.player = player
		this.nextdmg = 0
	}
	transfer(func: Function, ...args: any[]) {
		this.player.mediator.sendToClient(func, ...args)
	}
	isTargetableFrom(other: Player) {
		return true
	}
	isOnMainWay() {
		return true
	}
	onDeath() {
		this.nextdmg = 0
	}
	onBeforeObs() {}
	onForceMove(pos: number) {}
	onArriveSquare(pos: number) {}
	onBasicAttack(damage: Damage) {
		return damage
	}
	applyObstacle(obs: number) {}
	onPendingActionComplete(info: {type:string,result:any,complete:boolean}){

	}
	onRollDice(moveDistance:number):{type:string,args?:any[]}{
		return {type:""}
	}


	//타임아웃 악용방지 자동실행
	onPendingObsTimeout(pendingObs:number){
		if (pendingObs === 33) {
			ObstacleHelper.kidnap(this.player, randomBoolean())
		} 
	}
	onPendingObsComplete(info:any){
		if (info.type === "kidnap") {
			ObstacleHelper.kidnap(this.player,info.result)
		} 
	}
	getPendingObs(pendingObs:number):{ name: string; argument: number | number[] }{
		return null
	}
	shouldStunDice(){
		return false
	}
	/**
	 *
	 * @returns died
	 */
	doMineDamage() {
		let died = false
		if (this.nextdmg !== 0) {
			died = this.player.doObstacleDamage(this.nextdmg, "explode")
			this.nextdmg = 0
		}
		return died
	}

	static create(player: Player, mapId: ENUM.MAP_TYPE): PlayerMapHandler {
		if (mapId === ENUM.MAP_TYPE.NORMAL) {
			return new DefaultMapHandler(player)
		} else if (mapId === ENUM.MAP_TYPE.OCEAN) {
			return new OceanMapHandler(player)
		} else if (mapId === ENUM.MAP_TYPE.CASINO) {
			return new CasinoMapHandler(player)
		}
		console.error("Invaild map id")
		return null
	}
}


class DefaultMapHandler extends PlayerMapHandler {
	constructor(player: Player) {
		super(player)
		this.gamemap = MAP.get(ENUM.MAP_TYPE.NORMAL)
	}
}

class OceanMapHandler extends PlayerMapHandler implements TwoWayMap {
	onMainWay: boolean
	constructor(player: Player) {
		super(player)
		this.gamemap = MAP.get(ENUM.MAP_TYPE.OCEAN)
		this.onMainWay = true //갈림길 체크시 샤용
	}
	isOnMainWay() {
		return this.onMainWay
	}
	isTargetableFrom(other: Player): boolean {
		return this.inSameWayWith(other)
	}

	inSameWayWith(other: Player): boolean {
		if (other.mapHandler instanceof OceanMapHandler) return this.onMainWay === other.mapHandler.onMainWay

		return true
	}
	onDeath(): void {
		this.onMainWay = true
		super.onDeath()
	}
	onRollDice(moveDistance: number):{type:string,args?:any[]} {
		if(this.needToAskWay2(moveDistance)) return {type:"ask_way2"}

		return super.onRollDice(moveDistance)
	}
	needToAskWay2(moveDistance: number) {
		return this.gamemap.way2_range !== null && this.checkWay2(moveDistance)
	}
	onForceMove(pos: number) {
		this.checkWay2OnForceMove(pos)
		super.onForceMove(pos)
	}

	onPendingActionComplete(info: { type: string; result: any; complete: boolean }): void {
		if (info.type === "submarine" && info.complete) {
			this.player.game.playerForceMove(this.player, info.result, false, "levitate")
		}
		if (info.type === "ask_way2" && !info.result) {
			console.log("goWay2")
			this.goWay2()
		}
		super.onPendingActionComplete(info)
	}
	checkWay2(dice: number): boolean {
		//갈림길 시작점 도착시
		try {
			if (this.player.pos + dice === this.gamemap.way2_range.start) {
				return true
			}
			//way2 에서 마지막칸 도착시
			if (this.player.pos + dice === this.gamemap.way2_range.way_end) {
				this.exitWay2(dice)
				return false
			}
		} catch (e) {
			return false
		}
	}

	goWay2() {
		this.player.pos = this.gamemap.way2_range.way_start
		this.onMainWay = false
		this.transfer(PlayerClientInterface.update, "way", this.player.turn, false)
	}

	exitWay2(dice: number) {
		this.onMainWay = true

		this.player.pos = this.gamemap.way2_range.end - dice

		this.transfer(PlayerClientInterface.update, "way", this.player.turn, true)
	}

	checkWay2OnForceMove(pos: number) {
		let w2 = this.gamemap.way2_range

		if (!this.onMainWay) {
			if (pos < w2.way_start) {
				pos = w2.start - (w2.way_start - pos)
				this.onMainWay = true
			} else if (pos > w2.way_end) {
				pos = w2.end - (w2.way_end - pos)
				this.onMainWay = true
			}
		}
	}
}


enum SUBWAY_TICKET{
	NONE=-1,LOCAL=0,RAPID=1,EXPRESS=2
}

class CasinoMapHandler extends PlayerMapHandler {
	subwayTicket: number
	isInSubway: boolean
	private static readonly SUBWAY_LOCAL="subway_local"
	private static readonly SUBWAY_RAPID="subway_rapid"
	private static readonly SUBWAY_EXPRESS="subway_express"
	private static readonly SUBWAY_DELAY=400
	constructor(player: Player) {
		super(player)
		this.gamemap = MAP.get(ENUM.MAP_TYPE.CASINO)
		this.isInSubway = false
	}
	onDeath(): void {
		this.removeSubwayTicket()
		super.onDeath()
	}
	onForceMove(pos: number) {
		this.checkSubway()
		super.onForceMove(pos)
	}
	onArriveSquare(pos: number): void {
		this.checkSubway()
		super.onArriveSquare(pos)
	}
	applyObstacle(obs: number): void {
		if(obs===6){
			this.enterSubwayNormal()
		}
		super.onArriveSquare(obs)
	}
	onPendingObsTimeout(pendingObs: number): void {
		if (pendingObs === 63) {
			ObstacleHelper.threaten(this.player,randomBoolean())
		}
		if (pendingObs === 6) {
			this.selectSubway(SUBWAY_TICKET.LOCAL, 0)
		}
		super.onPendingObsTimeout(pendingObs)
	}
	onPendingObsComplete(info: any): void {
		console.log("onPendingObsComplete"+info)
		if (info.type === "threaten") {
			ObstacleHelper.threaten(this.player,info.result)
		} else if (info.type === "sell_token") {
			if (info.token > 0) {
				this.player.inven.sellToken(info)
			}
		} else if (info.type === "subway") {
			//console.log("subway")
			console.log(info)
			this.selectSubway(info.result, info.price)
		}
		super.onPendingObsComplete(info)
	}

	getPendingObs(pendingObs: number): { name: string; argument: number | number[] } {
		if (pendingObs === 63) {
			return {name:"server:pending_obs:threaten",argument:0}
		}
		//떡상
		else if (pendingObs === 67) {
			return {name:"server:pending_obs:sell_token",argument:this.player.inven.token}
		} //지하철
		else if (pendingObs === 6) {
			return {name:"server:pending_obs:subway",argument:this.getSubwayPrices()}
		}
		return super.getPendingObs(pendingObs)
	}

	shouldStunDice(): boolean {
		return super.shouldStunDice()
	}
	onRollDice(moveDistance: number):{type:string,args?:any[]} {
		if(this.subwayTicket !==SUBWAY_TICKET.NONE && this.isInSubway) {
			let dist=this.getSubwayDice()

			if(this.player.game.instant){
				this.rideSubway(dist)
			}
			else{
				setTimeout(()=>{
					this.rideSubway(dist)
				},CasinoMapHandler.SUBWAY_DELAY)
			}
			return {type:"subway",args:[dist]}
		}

		return super.onRollDice(moveDistance)
	}
	rideSubway(dist:number){
		console.log("ridesubway"+this.player.turn)
		
		let effect=CasinoMapHandler.SUBWAY_EXPRESS
		if(this.subwayTicket===SUBWAY_TICKET.RAPID) effect=CasinoMapHandler.SUBWAY_RAPID
		if(this.subwayTicket===SUBWAY_TICKET.LOCAL) effect=CasinoMapHandler.SUBWAY_LOCAL
		this.transfer(PlayerClientInterface.visualEffect,this.player.turn,effect,-1)
		this.transfer(PlayerClientInterface.smoothTeleport,this.player.turn,this.player.pos,dist)
		this.player.moveByDice(dist)
	}

	//called on death
	removeSubwayTicket() {
		this.subwayTicket = SUBWAY_TICKET.NONE
		this.isInSubway = false
		this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, false)
	}
	onBasicAttack(damage: Damage) {
		return damage.updateAttackDamage(CALC_TYPE.multiply, 0.6)
	}
	//이동시마다 지하철 안인지 밖인지 체크
	checkSubway() {
		if (this.subwayTicket !==SUBWAY_TICKET.NONE && !this.isInSubwayRange()) {
			this.exitSubway()
		}
		if (this.isInSubwayRange()) {
			this.enterSubwayWithoutSelection()
		}
	}

	isInSubwayRange() {
		return this.player.pos > this.gamemap.subway.start && this.player.pos < this.gamemap.subway.end
	}
	exitSubway() {
		console.log("exitsubway" + this.player.turn)
		//단순 지하철구간에서 빠져나온 경우
		this.isInSubway = false
		this.transfer(PlayerClientInterface.update, "subwayTicket", this.player.turn, -1)
		this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, false)
	}
	enterSubwayWithoutSelection() {
		console.log("enterSubwayWithoutSelection"+this.player.turn)
		this.isInSubway = true //지하철 구간에 이동으로 들어온경우
		if (this.subwayTicket === SUBWAY_TICKET.NONE ) {
			//처음 들어왔을 경우에만 기본으로
			//처음 아니면 기존티켓 사용
			this.subwayTicket = SUBWAY_TICKET.LOCAL 
		}
		this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, true)
	}
	//지하철 선택칸 도착
	enterSubwayNormal() {
		console.log("enterSubwayNormal"+this.player.turn)
		this.isInSubway = true
		if (this.subwayTicket === SUBWAY_TICKET.NONE ) {
			this.subwayTicket = SUBWAY_TICKET.LOCAL 
		}
		if (this.player.AI) {
			this.aiSubwaySelection()
		}
		this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, true)
	}
	aiSubwaySelection() {
		let prices = this.getSubwayPrices()

		for (let i = 2; i >= 0; --i) {
			if (this.player.inven.money / 1.5 > prices[i] || prices[i] === 0) {
				//돈 여유 있는 선에서 가장 좋은 티켓구입/가격 0일시 바로구입
				this.subwayTicket = i
				break
			}
		}
		let first = this.player.mediator.selectBestOneFrom(EntityFilter.ALL_PLAYER(this.player))(function () {
			return this.pos
		}).pos
		if (this.player.pos + 12 < first) {
			//1등과 격차 12~17: 급행
			this.subwayTicket = SUBWAY_TICKET.RAPID 
		}
		if (this.player.pos + 17 < first) {
			//격차 17 이상:특급
			this.subwayTicket = SUBWAY_TICKET.EXPRESS
		}
		this.player.inven.changemoney(prices[this.subwayTicket], ENUM.CHANGE_MONEY_TYPE.SPEND)
	}

	getSubwayPrices(): number[] {
		let prices = this.gamemap.subway.prices.map((x) => x)
		if (this.subwayTicket !==SUBWAY_TICKET.NONE) {
			prices[this.subwayTicket] = 0 //티켓 이미있으면 무료
		}

		if (this.player.thisLevelDeathCount >= 3) {
			return prices.map((p) => Math.max(0, p - 50))
		} else if (this.player.thisLevelDeathCount >= 2) {
			return prices.map((p) => Math.max(0, p - 25))
		}
		return prices
	}
	selectSubway(type: number, price: number) {
		this.subwayTicket = type
		
		if (price > 0) this.player.inven.changemoney(-1 * price, ENUM.CHANGE_MONEY_TYPE.SPEND)
	}
	getSubwayDice() {
	//	let diceShown = 1
		let moveDistance = 0
		if (this.subwayTicket === SUBWAY_TICKET.EXPRESS ) {
		//	diceShown = 6
			moveDistance = 6
		} else if (this.subwayTicket === SUBWAY_TICKET.RAPID) {
			if (this.gamemap.subway.rapid.includes(this.player.pos)) {
			//	diceShown = 3
				moveDistance = 2
			} else {
			//	diceShown = 3
				moveDistance = 1
			}
		} else if (this.subwayTicket === SUBWAY_TICKET.LOCAL ) {
		//	diceShown = 1
			moveDistance = 1
		}

		if (this.player.pos + moveDistance > this.gamemap.subway.end) {
			moveDistance = this.gamemap.subway.end - this.player.pos
		}
		console.log("movedistance"+moveDistance)
		return moveDistance 
	}
}

// class PlayerMapData{
//     nextdmg: number
// //	adamage: number

// 	onMainWay: boolean //갈림길 체크시 샤용
// 	subwayTicket: number
// 	isInSubway: boolean
// 	gamemap:singleMap
// 	player:Player
//     constructor(player:Player){
// 		this.player=player
//         this.nextdmg = 0
// 	//	this.adamage = 0
// 		this.onMainWay = true //갈림길 체크시 샤용
// 		this.isInSubway = false
// 		this.gamemap=MAP.get(this.player.mapId)
//     }
// 	transfer(func:Function,...args:any[]){
//         this.player.mediator.sendToClient(func,...args)
//     }
//     // inSameWayWith(other:Player):boolean{
//     //     return this.onMainWay ===  other.mapHandler.onMainWay
//     // }

//     // onDeath(){
//     //     this.removeSubwayTicket()
// 	// 	this.nextdmg = 0
// 	// 	this.onMainWay = true
//     // }
//     // isSubwayDice(){
//     //     return this.subwayTicket >= 0 && this.isInSubway
//     // }

//     //========================================================================================================

// 	//죽었을경우
// 	// removeSubwayTicket() {
// 	// 	this.subwayTicket = -1
// 	// 	this.isInSubway = false
// 	// 	this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, false,)

// 	// }

// 	//========================================================================================================

// }
export { PlayerMapHandler }
