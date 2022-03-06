import {PlayerClientInterface} from "./app"
import { Player } from "./player"
import {  MAP } from "./Game"
import * as ENUM from "./enum"
import { singleMap } from "./Util"
class PlayerMapData{
    nextdmg: number
//	adamage: number
	
	onMainWay: boolean //갈림길 체크시 샤용
	subwayTicket: number
	isInSubway: boolean
	gamemap:singleMap
	player:Player
    constructor(player:Player){
		this.player=player
        this.nextdmg = 0
	//	this.adamage = 0
		this.onMainWay = true //갈림길 체크시 샤용
		this.isInSubway = false		
        this.onMainWay = true //갈림길 체크시 샤용
		this.gamemap=MAP.get(this.player.mapId)
    }
	transfer(func:Function,...args:any[]){
        this.player.game.sendToClient(func,...args)
    }
    inSameWayWith(other:Player):boolean{
        return this.onMainWay ===  other.mapdata.onMainWay
    }
    onBeforeObs(){
      //  this.adamage = 0
    }
    onDeath(){
        this.removeSubwayTicket()
		this.nextdmg = 0
		this.onMainWay = true

    }
    isSubwayDice(){
        return this.subwayTicket >= 0 && this.isInSubway
    }
	getSubwayDice(){
		let diceShown=1
		let moveDistance=0
		if (this.subwayTicket === 2) {
			diceShown = 6
			moveDistance = 6
		} else if (this.subwayTicket === 1) {
			if (this.gamemap.subway.rapid.includes(this.player.pos)) {
				diceShown = 3
				moveDistance = 2
			} else {
				diceShown = 3
				moveDistance = 1
			}
		} else if (this.subwayTicket === 0) {
			diceShown = 1
			moveDistance = 1
		}

		if (this.player.pos + moveDistance > this.gamemap.subway.end) {
			moveDistance = this.gamemap.subway.end - this.player.pos
		}
		return {diceShown:diceShown,moveDistance:moveDistance}
	}
    //========================================================================================================

	getSubwayPrices(): number[] {
		let prices = this.gamemap.subway.prices.map((x) => x)
		if (this.subwayTicket >= 0) {
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

	//죽었을경우
	removeSubwayTicket() {
		this.subwayTicket = -1
		this.isInSubway = false
		this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, false,)
		
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
		console.log("enterSubwayWithoutSelection")
		this.isInSubway = true //지하철 구간에 이동으로 들어온경우
		if (this.subwayTicket === -1) {
			//처음 들어왔을 경우에만 기본으로
			//처음 아니면 기존티켓 사용
			this.subwayTicket = 0
		}
		this.transfer(PlayerClientInterface.update, "isInSubway", this.player.turn, true)

	}
	//지하철 선택칸 도착
	enterSubwayNormal() {
		console.log("enterSubwayNormal")
		this.isInSubway = true
		if (this.subwayTicket === -1) {
			this.subwayTicket = 0
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
		let first = this.player.game.playerSelector.getFirstPlayer().pos
		if (this.player.pos + 12 < first) {
			//1등과 격차 12~17: 급행
			this.subwayTicket = 1
		}
		if (this.player.pos + 17 < first) {
			//격차 17 이상:특급
			this.subwayTicket = 2
		}
		this.player.inven.changemoney(prices[this.subwayTicket], ENUM.CHANGE_MONEY_TYPE.SPEND)
	}

	needToAskWay2(moveDistance:number){
		return this.gamemap.way2_range !== null && this.checkWay2(moveDistance)
	}
	//이동시마다 지하철 안인지 밖인지 체크
	checkSubway() {
		if (this.subwayTicket >= 0 && !this.isInSubwayRange()) {
			this.exitSubway()
		}

		if (this.isInSubwayRange()) {
			this.enterSubwayWithoutSelection()
		}
	}
	//========================================================================================================

	checkWay2(dice: number): boolean {
		//갈림길 시작점 도착시
		try {
			if (this.player.pos + dice ===this.gamemap.way2_range.start) {
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
}
export default PlayerMapData