import { Action, ACTION_TYPE } from "./action/Action"
import { abilityToAction } from "./ActionAbilityConverter"
import { ActionSource, ACTION_SOURCE_TYPE } from "./action/ActionSource"
import { DelayedAction } from "./action/DelayedAction"
import type { MarbleGame } from "./Game"
import type { MarbleGameMap } from "./GameMap"
import { BuyoutAction, ClaimBuyoutAction, ClaimTollAction ,InstantAction,PayMoneyAction, TileAttackAction} from "./action/InstantAction"
import { MarblePlayer, MarblePlayerStat } from "./Player"
import { AskLoanAction, AskBuildAction, AskBuyoutAction, QueryAction } from "./action/QueryAction"
import { BuildableTile } from "./tile/BuildableTile"
import { chooseRandom, distance, getTilesBewteen, PlayerType, ProtoPlayer } from "./util"
import { CALC_TYPE, randInt } from "../core/Util"
import { CARD_NAME } from "./FortuneCard"

class PlayerMediator {
	map: MarbleGameMap
	game: MarbleGame
	players: MarblePlayer[]
	playerTurns: number[]

	playerCount: number
	aiCount: number

	constructor(game: MarbleGame, map: MarbleGameMap, playerlist: ProtoPlayer[],startmoney:number) {
		this.game = game
		this.map = map
		this.playerCount = 0
		this.aiCount = 0
		this.players = []

		for (let i=0;i<playerlist.length;++i) {
            const p=playerlist[i]
			let champ=(p.champ === -1)? randInt(9):p.champ

			if (p.type === PlayerType.AI) {
				this.players.push(
					new MarblePlayer(i,
						p.name,
						champ,
						p.team,
						true,
						startmoney,
						new MarblePlayerStat([50, 50, 50, 50, 50])
					)
				)
				this.aiCount += 1
			} else if (p.type === PlayerType.PLAYER_CONNECED) {
				this.players.push(
					new MarblePlayer(i,
						p.name,
						champ,
						p.team,
						false,
						startmoney,
						new MarblePlayerStat([50, 50, 50, 50, 50])
					)
				)
				this.playerCount += 1
			}
		}
		this.playerTurns = [0, 1, 2, 3]

		
	}
	getPlayerInitialSetting() {
		return this.players.map((player) => {
			return {
				turn: player.turn,
				team: player.team,
				name: player.name,
				char: player.char,
				money: player.money,
			}
		})
	}
	getDiceAbilitySamples(player: number): { dc: boolean; exactdc: boolean; double: boolean; backdice: boolean } {
		return {
			dc: true,//this.players[player].sampleAbility("dice_control"),
			exactdc: Math.random()>0.5,//this.players[player].sampleAbility("dice_control_accuracy"),
			double: this.players[player].sampleAbility("double"),
			backdice: this.players[player].sampleAbility("backdice"),
		}
	}
	setPlayerTurns(turns: number[]) {
		this.playerTurns = turns
		this.players.forEach((p, i) => p.setTurn(turns[i]))
	}
	areEnemy(p1: number, p2: number) {
		return p1 !== p2
	}
	getEnemiesOf(turn:number){
		let list:number[]=[]
		for(let i=0;i<this.players.length;++i){
			if(this.areEnemy(i,turn)) list.push(i)
		}
		return list
	}
	getRandomEnemy(turn:number){
		return this.pOfTurn(chooseRandom(this.getEnemiesOf(turn)))
	}
	getToll(defences: any, offences: any, tile: BuildableTile,discount:number): number {
		return tile.getToll() * discount
	}
	calculateBuyOutPrice(defences: any, offences: any, original:number,discount:number): number {
		return original * discount
	}

	pOfTurn(turn: number): MarblePlayer {
		return this.players[this.playerTurns[turn]]
	}
	getPlayersInRange(center: number, rad: number): MarblePlayer[] {
		return this.players.filter((p) => distance(center, p.pos) <= rad)
	}
	/**
	 * 두 지점 사이의 플레이어 반환(위치 순서대로)
	 * @param start
	 * @param end
	 * @returns
	 */
	getPlayersBetween(start: number, end: number): MarblePlayer[] {
		let tiles = getTilesBewteen(start, end)
		let players: MarblePlayer[] = []
		for (const pos of tiles) {
			players.concat(this.players.filter((p) => p.pos === pos))
		}
		return players
	}
	getOtherPlayers(me: number): MarblePlayer[] {
		return this.players.filter((p) => p.turn !== me)
	}
	getNonRetiredPlayers(){
		return this.players.filter((p) => !p.retired)
	}
	/**
	 * 다른플레이어에게 도착
	 * @param mover
	 * @param stayed
	 * @param source
	 */
	onMeetPlayer(mover: MarblePlayer, stayed: MarblePlayer, pos: number, source: ActionSource) {
		let defences = mover.onArriveToEnemy(source)
		let offences = stayed.onEnemyArriveToMe(source)
		let actions = abilityToAction(source, defences, offences)
		this.game.pushActions(actions)
	}
	/**
	 *
	 * @param mover
	 * @param stayed
	 * @param oldpos
	 * @param newpos
	 * @param source
	 * @returns blocks
	 */
	onPlayerPassOther(
		mover: MarblePlayer,
		stayed: MarblePlayer,
		oldpos: number,
		newpos: number,
		source: ActionSource
	): boolean {
		let defences = mover.onPassEnemy(stayed, oldpos, newpos, source)
		let offences = stayed.onEnemyPassesMe(mover, oldpos, newpos, source)
		let actions = abilityToAction(source, defences, offences)
		this.game.pushActions(actions)
		return false
	}
	/**
	 * 빈땅에 도착
	 * @param player
	 * @param tile
	 * @param source
	 */
	onArriveEmptyLand(playerTurn: number, tile: BuildableTile, source: ActionSource) {
		let player = this.pOfTurn(playerTurn)

		let event = player.onArriveEmptyLand(tile, source)

		this.game.pushActions(abilityToAction(source, event).setMain(this.game.getAskBuildAction(playerTurn,tile,source)))
	}
	/**
	 * 내땅에 도착
	 * @param player
	 * @param tile
	 * @param source
	 */
	onArriveMyLand(playerTurn: number, tile: BuildableTile, source: ActionSource) {
		let player = this.pOfTurn(playerTurn)

		let event = player.onArriveMyLand(tile, source)

		this.game.pushActions(abilityToAction(source, event).setMain(this.game.getAskBuildAction(playerTurn,tile,source)) )
	}

	/**
	 * 다른플레이어 땅 도착
	 * 도착시 발동 아이템, 통행료지불, 인수 가능시 인수
	 * @param player player
	 * @param landOwner player
	 * @param tile
	 * @param source
	 */
	onArriveEnemyLand(playerTurn: number, ownerTurn: number, tile: BuildableTile, source: ActionSource) {
		let player = this.pOfTurn(playerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let defences = player.onArriveEnemyLand(tile, source)
		let offences = landOwner.onEnemyArriveMyLand(player, tile, source)

		let stk: Action[] = []
		stk.push(new ClaimTollAction(playerTurn, new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE),tile))

		if (tile.canBuyOut()) {
			stk.push(
				new ClaimBuyoutAction(playerTurn, new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE),tile)
			)
		}
		this.game.pushActions(abilityToAction(source, defences, offences).setMain(...stk))
	}
	/**
	 * 최종 통행료 계산/
	 * 통행료면제/할인/추가징수/방어카드 체크
	 * @param payer player
	 * @param landOwner player
	 * @param tile
	 * @param moveType
	 */
	claimToll(payerTurn: number, ownerTurn: number, tile: BuildableTile, moveType: ActionSource) {
		let payer = this.pOfTurn(payerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let defences = payer.getTollDefence(tile, moveType)
		let offences = landOwner.getTollOffence(payer, tile, moveType)

		let actions = abilityToAction(moveType, defences, offences)
		let toll = this.getToll(defences, offences, tile,payer.getTollDiscount())
		this.game.map.onAfterClaimToll(tile)
		
		if(toll > 0)
			actions.setMain(new PayMoneyAction(payerTurn, ownerTurn,new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE),toll))

		this.game.pushActions(actions)
	}
	earnMoney(player:MarblePlayer,amount:number){
		player.earnMoney(amount)
		this.game.clientInterface.changeMoney(player.turn,player.money)
	}

    payMoneyTo(payer: MarblePlayer, receiver: MarblePlayer,amount:number){
        payer.takeMoney(amount)
        receiver.earnMoney(amount)
        this.game.clientInterface.payMoney(payer.turn,receiver.turn,amount)
		this.game.clientInterface.changeMoney(payer.turn,payer.money)
		this.game.clientInterface.changeMoney(receiver.turn,receiver.money)
    }
    payMoneyToBank(payer: MarblePlayer,amount:number){
        payer.takeMoney(amount)
        this.game.clientInterface.payMoney(payer.turn,-1,amount)
		this.game.clientInterface.changeMoney(payer.turn,payer.money)
    }
	payMoney(payerturn: number, receiverturn: number, amt: number, source: ActionSource) {
        let payer=this.pOfTurn(payerturn)
        let receiver=this.pOfTurn(receiverturn)

		if (payer.money < amt) {
			if (payer.canLoan(amt))
				this.game.pushSingleAction(
					new AskLoanAction(payer.turn, source,amt-payer.money,receiverturn)
				)
			else {
				this.game.bankrupt(payer)
                this.payMoneyTo(payer,receiver,amt)
			}
		} else {
			this.payMoneyTo(payer,receiver,amt)
		}
	}
	onLoanConfirm(amount:number,payerturn:number,receiverturn:number){
		let payer=this.pOfTurn(payerturn)
        let receiver=this.pOfTurn(receiverturn)
		this.earnMoney(payer,amount)
        this.payMoneyTo(payer,receiver,payer.money)
		payer.onLoan()
	}
	/**
	 * 인수창 띄우기 직전
	 *
	 * @param buyer
	 * @param landOwner
	 * @param tile
	 * @param source
	 */
	claimBuyOut(buyerTurn: number, ownerTurn: number, tile: BuildableTile, source: ActionSource) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let offences = buyer.buyOutPriceOffence(tile)
		let defences = landOwner.buyOutPriceDefence(buyer, tile)

		let originalPrice=tile.getBuyOutPrice()
		let price = this.calculateBuyOutPrice(defences, offences, originalPrice,buyer.getBuyoutDiscount())
		let actions = abilityToAction(source, defences, offences)

		if (buyer.money < price) return //인수비용부족

		this.game.pushActions(actions.setMain(new AskBuyoutAction(buyerTurn, new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE), tile.position,price,originalPrice)))
	}

	attemptBuyOut(buyerTurn: number, ownerTurn: number,tile:BuildableTile, price:number,source: ActionSource) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let offences = buyer.buyOutOffence(source)
		let defences = landOwner.buyOutDefence(source)
		let actions = abilityToAction(source, defences, offences)

		this.game.pushActions(actions.setMain(new BuyoutAction(buyerTurn, source,tile,price)))
	}
	buyOut(buyerTurn: number, ownerTurn: number, price: number, tile: BuildableTile, source: ActionSource) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		if (tile.isMoreBuildable()) {
			let builds = tile.getBuildingAvaliability(buyer.cycleLevel)
			this.game.pushSingleAction(
				new AskBuildAction(
					buyerTurn,
					source,
					tile.position,
					builds,
					tile.getCurrentBuilds(),
					buyer.getBuildDiscount(),
					buyer.money
				)
			)
		}

		this.payMoney(buyerTurn, ownerTurn, price, new ActionSource(ACTION_SOURCE_TYPE.BUYOUT))
		this.game.landBuyOut(buyer, landOwner, tile)
	}
	/**
	 * 
	 * @param attackerTurn 
	 * @param tile 도시 체인지:(상대에게 받을 땅)
	 * @param source 
	 * @param name 
	 * @param myTile 도시 체인지 전용(상대에게 줄 땅)
	 */
	attemptAttackTile(attackerTurn:number,tile:BuildableTile,source:ActionSource,name:string,secondTile?:BuildableTile){
		let attacker = this.pOfTurn(attackerTurn)
		let landOwner = this.pOfTurn(tile.owner)
		
		let offences = attacker.tileAttackOffence(tile)
		let defences = landOwner.tileAttackDefence(tile)
		let actions = abilityToAction(source, defences, offences)
		if(name===CARD_NAME.LAND_CHANGE){
			if(!secondTile) return

			actions.setMain(new TileAttackAction(attackerTurn, source,tile,name).setLandChangeTile(secondTile))
		}
		else{
			actions.setMain(new TileAttackAction(attackerTurn, source,tile,name))
		}
		this.game.pushActions(actions)
	}
	onMonopolyAlert(player: MarblePlayer, spots: number[]) {
		console.log("alert monopoly")
		console.log(spots)
		let offences = player.monopolyAlertOffence(spots)
		let defences = this.getOtherPlayers(player.turn).map((p: MarblePlayer) => p.monopolyAlertDefence(spots))

		let actions = abilityToAction(null, offences, ...defences)
		this.game.pushActions(actions)
	}
}
export{PlayerMediator}