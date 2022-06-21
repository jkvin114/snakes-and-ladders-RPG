import { Player } from "../player/player"
import { EntityFilter } from "../entity/EntityFilter"
import { MAP ,singleMap} from "./MapStorage"
import * as ENUM from "../data/enum"
import { CALC_TYPE, Damage, randomBoolean} from "../core/Util"
import { ObstacleHelper } from "../core/helpers"
import { ClientPayloadInterface, ServerPayloadInterface } from "../data/PayloadInterface"

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
	onPendingActionComplete(info:ClientPayloadInterface.PendingAction){

	}
	onRollDice(moveDistance:number):{type:string,args?:any[]}{
		return {type:""}
	}
	canAttack(){
		return !(this.gamemap.muststop.includes(this.player.pos) && this.gamemap.store.includes(this.player.pos) && this.gamemap.respawn.includes(this.player.pos)) 
	}


	//타임아웃 악용방지 자동실행
	onPendingObsTimeout(pendingObs:number){
		if (pendingObs === 33) {
			ObstacleHelper.kidnap(this.player, randomBoolean())
		} 
	}
	onPendingObsComplete(info:ClientPayloadInterface.PendingObstacle){

		if (info.type === "kidnap" && info.booleanResult!=null) {
			ObstacleHelper.kidnap(this.player,info.booleanResult)
		} 
	}
	getPendingObs(pendingObs:number):ServerPayloadInterface.PendingObstacle{
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
		if (other.mapHandler instanceof OceanMapHandler) 
			return this.onMainWay === other.mapHandler.onMainWay

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

	onPendingActionComplete(info:ClientPayloadInterface.PendingAction): void {
		if (info.type === "submarine" && info.complete && typeof info.result==='number') {
			this.player.game.setPendingObs(this.player.game.getObstacleAt(info.result))
			this.player.game.playerForceMove(this.player, info.result, false,  ENUM.FORCEMOVE_TYPE.LEVITATE)
		}
		if (info.type === "ask_way2" && !info.result && typeof info.result==='boolean') {
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
		this.player.game.clientInterface.update("way", this.player.turn, false)
	}

	exitWay2(dice: number) {
		this.onMainWay = true

		this.player.pos = this.gamemap.way2_range.end - dice

		this.player.game.clientInterface.update("way", this.player.turn, true)
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
	onPendingObsComplete(info: ClientPayloadInterface.PendingObstacle): void {
		console.log("onPendingObsComplete"+info)
		if (info.type === "threaten" && info.booleanResult!==null) {
			ObstacleHelper.threaten(this.player,info.booleanResult)
		} else if (info.type === "sell_token") {
			let result=(info.objectResult as ClientPayloadInterface.TokenStoreResult)
			if (result.token > 0) {
				this.player.inven.sellToken(result.token,result.money)
			}
		} else if (info.type === "subway"){
			let result=(info.objectResult as ClientPayloadInterface.SubwayResult)

			this.selectSubway(result.type, result.price)
		}
		super.onPendingObsComplete(info)
	}

	getPendingObs(pendingObs: number): ServerPayloadInterface.PendingObstacle {
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
			this.rideSubway(dist)
			// if(this.player.game.instant){
				
			// }
			// else{
			// 	setTimeout(()=>{
			// 		this.rideSubway(dist)
			// 	},CasinoMapHandler.SUBWAY_DELAY)
			// }
			return {type:"subway",args:[dist]}
		}

		return super.onRollDice(moveDistance)
	}
	private rideSubway(dist:number){
		console.log("ridesubway"+this.player.turn)
		
		let effect=CasinoMapHandler.SUBWAY_EXPRESS
		if(this.subwayTicket===SUBWAY_TICKET.RAPID) effect=CasinoMapHandler.SUBWAY_RAPID
		if(this.subwayTicket===SUBWAY_TICKET.LOCAL) effect=CasinoMapHandler.SUBWAY_LOCAL
		this.player.game.clientInterface.visualEffect(this.player.pos,effect,-1)
		this.player.game.clientInterface.smoothTeleport(this.player.turn,this.player.pos,dist)
		this.player.moveByDice(dist)
	}

	//called on death
	private removeSubwayTicket() {
		this.subwayTicket = SUBWAY_TICKET.NONE
		this.isInSubway = false
		this.player.game.clientInterface.update("isInSubway", this.player.turn, false)
	}
	onBasicAttack(damage: Damage) {
		if(this.isInSubway)
			return damage.updateAttackDamage(CALC_TYPE.multiply, 0.6)
		else return damage
	}
	//이동시마다 지하철 안인지 밖인지 체크
	private checkSubway() {
		if (this.subwayTicket !==SUBWAY_TICKET.NONE && !this.isInSubwayRange()) {
			this.exitSubway()
		}
		if (this.isInSubwayRange()) {
			this.enterSubwayWithoutSelection()
		}
	}

	private isInSubwayRange() {
		return this.player.pos > this.gamemap.subway.start && this.player.pos < this.gamemap.subway.end
	}
	private exitSubway() {
		console.log("exitsubway" + this.player.turn)
		//단순 지하철구간에서 빠져나온 경우
		this.isInSubway = false
		this.player.game.clientInterface.update("subwayTicket", this.player.turn, -1)
		this.player.game.clientInterface.update("isInSubway", this.player.turn, false)
	}
	private enterSubwayWithoutSelection() {
		console.log("enterSubwayWithoutSelection"+this.player.turn)
		this.isInSubway = true //지하철 구간에 이동으로 들어온경우
		if (this.subwayTicket === SUBWAY_TICKET.NONE ) {
			//처음 들어왔을 경우에만 기본으로
			//처음 아니면 기존티켓 사용
			this.subwayTicket = SUBWAY_TICKET.LOCAL 
		}
		this.player.game.clientInterface.update("isInSubway", this.player.turn, true)
	}
	//지하철 선택칸 도착
	private enterSubwayNormal() {
		console.log("enterSubwayNormal"+this.player.turn)
		this.isInSubway = true
		if (this.subwayTicket === SUBWAY_TICKET.NONE ) {
			this.subwayTicket = SUBWAY_TICKET.LOCAL 
		}
		if (this.player.AI) {
			this.aiSubwaySelection()
		}
		this.player.game.clientInterface.update("isInSubway", this.player.turn, true)
	}
	private aiSubwaySelection() {
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

	private getSubwayPrices(): number[] {
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

export { PlayerMapHandler }
