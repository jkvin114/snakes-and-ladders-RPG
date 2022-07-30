import { Action, ACTION_TYPE } from "./action/Action"
import { abilityToAction } from "./ActionAbilityConverter"
import { ActionSource, ACTION_SOURCE_TYPE } from "./action/ActionSource"
import { DelayedAction } from "./action/DelayedAction"
import type { MarbleGame } from "./Game"
import type { MarbleGameMap } from "./GameMap"
import {
	BuyoutAction,
	ClaimBuyoutAction,
	ClaimTollAction,
	InstantAction,
	PayMoneyAction,
	PayPercentMoneyAction,
	PayTollAction,
	TileAttackAction,
} from "./action/InstantAction"
import { MarblePlayer, MarblePlayerStat } from "./Player"
import { AskLoanAction, AskBuildAction, AskBuyoutAction, QueryAction } from "./action/QueryAction"
import { BuildableTile } from "./tile/BuildableTile"
import { chooseRandom, chooseRandomMultiple, distance, getTilesBewteen, PlayerType, ProtoPlayer, range } from "./util"
import { CALC_TYPE, randInt } from "../core/Util"
import { CARD_NAME } from "./FortuneCard"
import { ActionPackage } from "./action/ActionPackage"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { EVENT_TYPE } from "./Ability/EventType"
import { AbilityValues } from "./Ability/AbilityValues"
import { ITEM_REGISTRY } from "./ItemRegistry"

class PlayerMediator {
	map: MarbleGameMap
	game: MarbleGame
	players: MarblePlayer[]
	playerTurns: number[]
	retiredPlayers:number[]
	playerCount: number
	aiCount: number

	constructor(game: MarbleGame, map: MarbleGameMap, playerlist: ProtoPlayer[], startmoney: number) {
		this.game = game
		this.map = map
		this.playerCount = 0
		this.aiCount = 0
		this.players = []
		this.retiredPlayers=[]

		for (let i = 0; i < playerlist.length; ++i) {
			const p = playerlist[i]
			let champ = p.champ === -1 ? randInt(9) : p.champ

			if (p.type === PlayerType.AI) {
				this.players.push(
					new MarblePlayer(i, p.name, champ, p.team, true, startmoney, new MarblePlayerStat([50, 50, 50, 80, 50]))
				)
				this.aiCount += 1
			} else if (p.type === PlayerType.PLAYER_CONNECED) {
				this.players.push(
					new MarblePlayer(i, p.name, champ, p.team, false, startmoney, new MarblePlayerStat([50, 50, 50, 80, 50]))
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
				card:player.getSavedCard(),
				abilities:player.getAbilityString()
			}
		})
	}
	setPlayerTurns(turns: number[]) {
		this.playerTurns = turns
		this.players.forEach((p, i) => p.setTurn(turns[i]))
		this.players.forEach((p) => {
			p.saveCardAbility(ABILITY_NAME.ANGEL_CARD)
			let abs:[ABILITY_NAME, AbilityValues][]=[]
			let codes=chooseRandomMultiple(range(7),5)
			

			for(const c of codes){
				let item=ITEM_REGISTRY.get(c)
				
				if(!item) continue
				abs.push(item)
			}
			p.registerPermanentAbilities(abs)

		})

	}
	areEnemy(p1: number, p2: number) {
		return p1 !== p2
	}
	getEnemiesOf(turn: number) {
		let list: number[] = []
		for (let i = 0; i < this.players.length; ++i) {
			if (this.areEnemy(i, turn)) list.push(i)
		}
		return list
	}
	getRandomEnemy(turn: number) {
		return this.pOfTurn(chooseRandom(this.getEnemiesOf(turn).filter((turn)=>!this.retiredPlayers.includes(turn))))
	}
	getToll(defences: any, offences: any, tile: BuildableTile, discount: number): number {
		return tile.getToll() * discount
	}
	calculateBuyOutPrice(defences: any, offences: any, original: number, discount: number): number {
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
	getNonRetiredPlayers() {
		return this.players.filter((p) => !p.retired)
	}
	playerRetire(turn:number){
		this.retiredPlayers.push(turn)
	}
	/**
	 * 다른플레이어에게 도착
	 * @param mover
	 * @param stayed
	 * @param source
	 */
	onMeetPlayer(mover: MarblePlayer, stayed: MarblePlayer, pos: number, source: ActionSource) {
		console.log(mover.turn+"meet"+stayed.turn)
		let offences = mover.sampleAbility(EVENT_TYPE.ARRIVE_TO_ENEMY,source)
		let defences = stayed.sampleAbility(EVENT_TYPE.ENEMY_ARRIVE_TO_ME,source)
		let actions = new ActionPackage().applyAbilityArriveToPlayer(mover.turn,source,offences,defences,stayed.turn)
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

		this.game.pushActions(abilityToAction(source, event).setMain(this.game.getAskBuildAction(playerTurn, tile, source)))
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
		this.map.ownerArrive(tile)
		this.game.pushActions(abilityToAction(source, event).setMain(this.game.getAskBuildAction(playerTurn, tile, source)))
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
		stk.push(new ClaimTollAction(playerTurn, new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE), tile))

		if (tile.canBuyOut()) {
			stk.push(new ClaimBuyoutAction(playerTurn, new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE), tile))
		}
		this.game.pushActions(abilityToAction(source, defences, offences).setMain(...stk))
	}
	/**
	 * 최종 통행료 계산/
	 * 통행료면제/할인/추가징수/방어카드 체크
	 * @param ownerTurn
	 * @param payerTurn
	 * @param tile
	 * @param moveType
	 */
	claimToll(payerTurn: number, ownerTurn: number, tile: BuildableTile, moveType: ActionSource) {
		let payer = this.pOfTurn(payerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let defences = payer.sampleAbility(EVENT_TYPE.TOLL_CLAIMED,moveType) 
		let offences = landOwner.sampleAbility(EVENT_TYPE.CLAIM_TOLL,moveType) 
		let baseToll = tile.getToll() * payer.getTollDiscount()
		this.map.onAfterClaimToll(tile)
		let ap = new ActionPackage()
			.setMain(new PayTollAction(payerTurn, ownerTurn, new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE), baseToll))
			.applyClaimTollAbility(ownerTurn,moveType, offences, defences,payerTurn)

		// let actions = abilityToAction(moveType, defences, offences)
		// let toll = this.getToll(defences, offences, tile,payer.getTollDiscount())
		// this.game.map.onAfterClaimToll(tile)

		// if(toll > 0)
		// 	actions.setMain(new PayMoneyAction(payerTurn, ownerTurn,new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE),toll))

		this.game.pushActions(ap)
	}
	earnMoney(playerTurn: number, amount: number) {
		let player = this.pOfTurn(playerTurn)
		player.earnMoney(amount)
		this.game.clientInterface.payMoney(-1, playerTurn, amount)
		this.game.clientInterface.changeMoney(player.turn, player.money)
	}

	payMoneyTo(payer: MarblePlayer, receiver: MarblePlayer, amount: number) {
		payer.takeMoney(amount)
		receiver.earnMoney(amount)
		this.game.clientInterface.payMoney(payer.turn, receiver.turn, amount)
		this.game.clientInterface.changeMoney(payer.turn, payer.money)
		this.game.clientInterface.changeMoney(receiver.turn, receiver.money)
	}
	payMoneyToBank(payer: MarblePlayer, amount: number) {
		payer.takeMoney(amount)
		this.game.clientInterface.payMoney(payer.turn, -1, amount)
		this.game.clientInterface.changeMoney(payer.turn, payer.money)
	}
	payPecentMoney(action:PayPercentMoneyAction){
		let payer = this.pOfTurn(action.turn)
		let receiver = this.pOfTurn(action.receiver)

		this.payMoneyTo(payer, receiver, action.getAmount(payer.money))
	}
	payMoney(payerturn: number, receiverturn: number, amt: number, source: ActionSource) {
		if (amt === 0) return

		let payer = this.pOfTurn(payerturn)
		let receiver = this.pOfTurn(receiverturn)

		if (payer.money < amt) {
			if (payer.canLoan(amt))
				this.game.pushSingleAction(new AskLoanAction(payer.turn, source, amt - payer.money, receiverturn))
			else {
				this.playerBankrupt(payerturn,receiverturn,amt)
			}
		} else {
			this.payMoneyTo(payer, receiver, amt)
		}
	}
	onLoanConfirm(amount: number, payerturn: number, receiverturn: number) {
		let payer = this.pOfTurn(payerturn)
		let receiver = this.pOfTurn(receiverturn)
		this.earnMoney(payer.turn, amount)
		this.payMoneyTo(payer, receiver, payer.money)
		payer.onLoan()
	}
	/**
	 * 
	 * @param playerTurn 
	 * @param receiverturn 
	 * @param amount 총 통행료
	 */
	playerBankrupt(playerTurn:number,receiverturn:number,amount:number)
	{
		let payer = this.pOfTurn(playerTurn)
		let receiver = this.pOfTurn(receiverturn)
		this.payMoneyTo(payer, receiver, amount)
		payer.bankrupt()
		this.playerRetire(payer.turn)
		this.game.bankrupt(payer)
	}
	/**
	 * 인수창 띄우기 직전
	 * @param buyerTurn
	 * @param ownerTurn
	 * @param tile
	 * @param source
	 */
	claimBuyOut(buyerTurn: number, ownerTurn: number, tile: BuildableTile, source: ActionSource) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let offences = buyer.sampleAbility(EVENT_TYPE.BUYOUT_PRICE_CLAIMED,source)
		let defences = landOwner.sampleAbility(EVENT_TYPE.CLAIM_BUYOUT_PRICE,source)

		let originalPrice = tile.getBuyOutPrice()
		let basePrice = originalPrice * buyer.getBuyoutDiscount()
		// let price = this.calculateBuyOutPrice(defences, offences, originalPrice,)
		// let actions = abilityToAction(source, defences, offences)

		// if (buyer.money < price) return //인수비용부족

		this.game.pushActions(
			new ActionPackage()
				.setMain(
					new AskBuyoutAction(
						buyerTurn,
						new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE),
						tile.position,
						basePrice,
						originalPrice
					)
				)
				.applyAbilityClaimBuyout(buyerTurn,source, offences, defences, buyer.money)
		)
	}

	attemptBuyOut(buyerTurn: number, ownerTurn: number, tile: BuildableTile, price: number, source: ActionSource) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		let offences = buyer.buyOutOffence(source)
		let defences = landOwner.buyOutDefence(source)
		let actions = abilityToAction(source, defences, offences)

		this.game.pushActions(actions.setMain(new BuyoutAction(buyerTurn, source, tile, price)))
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
	 * @param secondTile 도시 체인지 전용(상대에게 줄 땅)
	 */
	attemptAttackTile(
		attackerTurn: number,
		tile: BuildableTile,
		source: ActionSource,
		name: string,
		secondTile?: BuildableTile
	) {
		let attacker = this.pOfTurn(attackerTurn)
		let landOwner = this.pOfTurn(tile.owner)

		let offences = attacker.sampleAbility(EVENT_TYPE.DO_ATTACK,source)
		let defences = landOwner.sampleAbility(EVENT_TYPE.BEING_ATTACKED,source)
		// let actions = abilityToAction(source, defences, offences)
		let actions=new ActionPackage()
		if (name === CARD_NAME.LAND_CHANGE) {
			if (!secondTile) return
			actions.setMain(new TileAttackAction(attackerTurn, source, tile, name).setLandChangeTile(secondTile))
		} else {
			actions.setMain(new TileAttackAction(attackerTurn, source, tile, name))
		}
		actions.applyAttemptAttackAbility(attackerTurn,source,offences,defences,name,tile.owner)
		this.game.pushActions(actions)
	}
	executeAbility(turn:number,name:ABILITY_NAME){
		this.pOfTurn(turn).useAbility(name)
	}
	onMonopolyAlert(player: MarblePlayer, spots: number[]) {
		// console.log("alert monopoly")
		// console.log(spots)
		let offences = player.monopolyAlertOffence(spots)
		let defences = this.getOtherPlayers(player.turn).map((p: MarblePlayer) => p.monopolyAlertDefence(spots))

		let actions = abilityToAction(null, offences, defences[0])
		this.game.pushActions(actions)
	}
}
export { PlayerMediator }
