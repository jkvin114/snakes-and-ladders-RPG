import {  ACTION_TYPE,  MOVETYPE } from "./action/Action"
import { ActionTrace } from "./action/ActionTrace"
import type { MarbleGame } from "./Game"
import type { MarbleGameMap } from "./GameMap"
import {
	PayPercentMoneyAction,
	TileAttackAction,
} from "./action/InstantAction"
import { MarblePlayer, MarblePlayerStat } from "./Player"
import { AskLoanAction } from "./action/QueryAction"
import { BuildableTile } from "./tile/BuildableTile"
import { chooseRandom, chooseRandomMultiple, distance, getTilesBewteen, PlayerType, ProtoPlayer, randInt, range } from "./util"
import { CARD_NAME } from "./FortuneCard"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { AbilityValues } from "./Ability/AbilityValues"
import { ITEM_REGISTRY } from "./ItemRegistry"
import { ServerPayloadInterface } from "./ServerPayloadInterface"
import { ArriveEmptyLandActionBuilder } from "./action/PackageBuilder/ArriveEmptyLandActionBuilder"
import { ArriveEnemyLandActionBuilder } from "./action/PackageBuilder/ArriveEnemyLandActionBuilder"
import { ArriveMyLandActionBuilder } from "./action/PackageBuilder/ArriveMyLandActionBuilder"
import { AttemptAttackActionBuilder } from "./action/PackageBuilder/AttemptAttackActionBuilder"
import { BuyoutActionBuilder } from "./action/PackageBuilder/BuyoutActionBuilder"
import { ClaimBuyoutActionBuilder } from "./action/PackageBuilder/ClaimBuyoutActionBuilder"
import { ClaimTollActionBuilder } from "./action/PackageBuilder/ClaimTollActionBuilder"
import { MeetPlayerActionBuilder } from "./action/PackageBuilder/MeetPlayerActionBuilder"
import { MonopolyChanceActionBuilder } from "./action/PackageBuilder/MonopolyChanceActionBuilder"
import { PassPlayerActionBuilder } from "./action/PackageBuilder/PassPlayerActionBuilder"

class PlayerMediator {
	map: MarbleGameMap
	game: MarbleGame
	players: MarblePlayer[]
	playerTurns: number[]
	retiredPlayers: Set<number>
	playerCount: number
	aiCount: number

	constructor(game: MarbleGame, map: MarbleGameMap, playerlist: ProtoPlayer[], startmoney: number) {
		this.game = game
		this.map = map
		this.playerCount = 0
		this.aiCount = 0
		this.players = []
		this.retiredPlayers = new Set<number>()

		for (let i = 0; i < playerlist.length; ++i) {
			const p = playerlist[i]
			let champ = p.champ === -1 ? randInt(9) : p.champ

			if (p.type === PlayerType.AI) {
				this.players.push(
					new MarblePlayer(i, p.name, champ, p.team, true, startmoney,
						 new MarblePlayerStat([80, 80, 80, 110, 80]))
				)
				this.aiCount += 1
			} else if (p.type === PlayerType.PLAYER_CONNECED) {
				this.players.push(
					new MarblePlayer(i, p.name, champ, p.team, false, startmoney,
						 new MarblePlayerStat([80, 80, 80, 110, 80]))
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
				card: player.getSavedCard(),
				abilities: player.getAbilityString(),
			}
		})
	}
	setPlayerTurns(turns: number[]) {
		this.playerTurns = turns
		this.players.forEach((p, i) => {
			p.setTurn(turns[i])
			p.cycleLevel = this.game.map.cycleStart
		})
	}
	registerAbilities(itemSetting: ServerPayloadInterface.ItemSetting) {
		this.players.forEach((p) => {
			p.saveCardAbility(ABILITY_NAME.ANGEL_CARD)
			let abs: [ABILITY_NAME, AbilityValues][] = []
			let randitems: number[] = itemSetting.items.filter((item) => item.selected).map((item) => item.code)

			let codes = chooseRandomMultiple(randitems, itemSetting.randomCount).sort((a: number, b: number) => a - b)
			codes.push(...itemSetting.items.filter((item) => item.locked).map((item) => item.code))

			for (const c of codes) {
				let item = ITEM_REGISTRY.get(c)

				if (!item) continue
				abs.push([item[0], item[1]])
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
			if (this.players[i].retired) continue
			if (this.areEnemy(i, turn)) list.push(i)
		}
		return list
	}
	getRandomEnemy(turn: number) {
		return this.pOfTurn(chooseRandom(this.getEnemiesOf(turn).filter((turn) => !this.retiredPlayers.has(turn))))
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
		return this.players.filter((p) => distance(center, p.pos) <= rad && !p.retired)
	}
	getPlayersAt(positions: number[]): MarblePlayer[] {
		let set = new Set<number>(positions)
		return this.players.filter((p) => set.has(p.pos) && !p.retired)
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
			players.push(...this.players.filter((p) => p.pos === pos && !p.retired))
		}
		return players
	}
	getOtherPlayers(me: number): MarblePlayer[] {
		return this.players.filter((p) => p.turn !== me && !p.retired)
	}
	getNonRetiredPlayers() {
		return this.players.filter((p) => !p.retired)
	}
	playerRetire(turn: number) {
		this.retiredPlayers.add(turn)
	}
	upgradePlayerAbility(): [ABILITY_NAME, number][] {
		let upgraded: any = []
		for (const p of this.players) {
			let list = p.upgradeAbility()
			for (const a of list) upgraded.push([a, p.turn])
		}
		return upgraded
	}
	/**
	 * 다른플레이어에게 도착
	 * @param mover
	 * @param stayed
	 * @param source
	 */
	onMeetPlayer(mover: MarblePlayer, stayed: MarblePlayer, pos: number, source: ActionTrace, movetype: MOVETYPE) {
		this.game.pushActions(
			new MeetPlayerActionBuilder(this.game, source, mover, pos, movetype).setDefender(stayed).build()
		)
	}

	/**
	 *
	 * @param moverTurn
	 * @param pos
	 * @param source
	 * @param movetype
	 * @returns overrideArrival 플리이어 만난 후 타일에 도착 무시하는지 여부(잘가북)
	 */
	checkPlayerMeet(moverTurn: number, pos: number, source: ActionTrace, movetype: MOVETYPE) {
		let players = this.getPlayersInRange(this.pOfTurn(moverTurn).pos, 0)
		let builder = new MeetPlayerActionBuilder(this.game, source, this.pOfTurn(moverTurn), pos, movetype)
		for (const p of players) {
			if (moverTurn === p.turn) continue
			builder.addStayed(p)
		}
		this.game.pushActions(builder.build())

		return builder.overrideArrival
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
		source: ActionTrace,
		movetype: MOVETYPE
	): boolean {
		let actions = new PassPlayerActionBuilder(this.game, source, mover, oldpos, newpos, movetype).setDefender(stayed)
		this.game.pushActions(actions.build())
		return actions.stopMover
	}
	/**
	 * 빈땅에 도착
	 * @param player
	 * @param tile
	 * @param source
	 */
	onArriveEmptyLand(playerTurn: number, tile: BuildableTile, source: ActionTrace) {
		let player = this.pOfTurn(playerTurn)

		this.game.pushActions(new ArriveEmptyLandActionBuilder(this.game, source, player, tile).build())
	}
	/**
	 * 내땅에 도착
	 * @param player
	 * @param tile
	 * @param source
	 */
	onArriveMyLand(playerTurn: number, tile: BuildableTile, source: ActionTrace) {
		let player = this.pOfTurn(playerTurn)

		this.map.ownerArrive(tile)
		this.game.pushActions(new ArriveMyLandActionBuilder(this.game, source, player, tile).build())
	}

	/**
	 * 다른플레이어 땅 도착
	 * 도착시 발동 아이템, 통행료지불, 인수 가능시 인수
	 * @param player player
	 * @param landOwner player
	 * @param tile
	 * @param source
	 */
	onArriveEnemyLand(playerTurn: number, ownerTurn: number, tile: BuildableTile, source: ActionTrace) {
		let player = this.pOfTurn(playerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		// let toll=new ClaimTollAction(playerTurn, tile)
		// let buyout=new EmptyAction()
		// if (tile.canBuyOut()) {
		// 	buyout=new ClaimBuyoutAction(playerTurn, tile)
		// }
		this.game.pushActions(
			new ArriveEnemyLandActionBuilder(this.game, source, player, tile).setDefender(landOwner).build()
		)
	}
	/**
	 * 최종 통행료 계산/
	 * 통행료면제/할인/추가징수/방어카드 체크
	 * @param ownerTurn
	 * @param payerTurn
	 * @param tile
	 * @param source
	 */
	claimToll(payerTurn: number, ownerTurn: number, tile: BuildableTile, source: ActionTrace) {
		let payer = this.pOfTurn(payerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		// let defences = payer.sampleAbility(EVENT_TYPE.TOLL_CLAIMED, source)
		// let offences = landOwner.sampleAbility(EVENT_TYPE.CLAIM_TOLL, source)
		let baseToll = tile.getToll() * payer.getTollDiscount()
		this.map.onAfterClaimToll(tile)
		let ap = new ClaimTollActionBuilder(this.game, source, landOwner, tile, baseToll).setDefender(payer).build()

		// new ActionPackage(this.game,source)
		// 	.addMain(new PayTollAction(payerTurn, ownerTurn, baseToll))
		// 	.applyClaimTollAbility(ownerTurn, offences, defences, payerTurn,tile)

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
		this.game.eventEmitter.payMoney(-1, playerTurn, amount, "earn")
		this.game.eventEmitter.changeMoney(player.turn, player.money)
	}

	payMoneyTo(payer: MarblePlayer, receiver: MarblePlayer, amount: number, type: string) {
		payer.takeMoney(amount)
		receiver.earnMoney(amount)
		this.game.eventEmitter.payMoney(payer.turn, receiver.turn, amount, type)
		this.game.eventEmitter.changeMoney(payer.turn, payer.money)
		this.game.eventEmitter.changeMoney(receiver.turn, receiver.money)
	}
	payMoneyToBank(payer: MarblePlayer, amount: number) {
		payer.takeMoney(amount)
		this.game.eventEmitter.payMoney(payer.turn, -1, amount, "pay_to_bank")
		this.game.eventEmitter.changeMoney(payer.turn, payer.money)
	}
	payPecentMoney(action: PayPercentMoneyAction) {
		let payer = this.pOfTurn(action.turn)
		let receiver = this.pOfTurn(action.receiver)

		this.payMoneyTo(payer, receiver, action.getAmount(payer.money), "percent")
	}
	payMoney(payerturn: number, receiverturn: number, amt: number, source: ActionTrace, type: string) {
		if (amt === 0) return

		let payer = this.pOfTurn(payerturn)
		let receiver = this.pOfTurn(receiverturn)

		if (payer.money < amt) {
			if (payer.canLoan(amt))
				this.game.pushSingleAction(new AskLoanAction(payer.turn, amt - payer.money, receiverturn), source)
			else {
				this.playerBankrupt(payerturn, receiverturn, amt)
			}
		} else {
			this.payMoneyTo(payer, receiver, amt, type)
		}
	}
	onLoanConfirm(amount: number, payerturn: number, receiverturn: number) {
		let payer = this.pOfTurn(payerturn)
		let receiver = this.pOfTurn(receiverturn)
		// this.earnMoney(payer.turn, amount)
		this.payMoneyTo(payer, receiver, payer.money + amount, "toll")
		payer.onLoan()
	}
	/**
	 *
	 * @param playerTurn
	 * @param receiverturn
	 * @param amount 총 통행료
	 */
	playerBankrupt(playerTurn: number, receiverturn: number, amount: number) {
		let payer = this.pOfTurn(playerTurn)
		let receiver = this.pOfTurn(receiverturn)
		this.payMoneyTo(payer, receiver, amount, "toll")
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
	claimBuyOut(buyerTurn: number, tile: BuildableTile, source: ActionTrace) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(tile.owner)

		let pkg = new ClaimBuyoutActionBuilder(this.game, source, landOwner, tile).setDefender(buyer).build()
		this.game.pushActions(pkg)
	}

	attemptBuyOut(buyerTurn: number, ownerTurn: number, tile: BuildableTile, price: number, source: ActionTrace) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)

		this.game.pushActions(new BuyoutActionBuilder(this.game, source, buyer, tile, price).setDefender(landOwner).build())
	}
	buyOut(buyerTurn: number, ownerTurn: number, price: number, tile: BuildableTile, source: ActionTrace) {
		let buyer = this.pOfTurn(buyerTurn)
		let landOwner = this.pOfTurn(ownerTurn)
		this.game.eventEmitter.buyout(buyer.turn, tile.position)

		this.payMoney(buyerTurn, ownerTurn, price, source, "buyout")
		this.game.landBuyOut(buyer, landOwner, tile)
		this.game.pushSingleAction(this.game.getAskBuildAction(buyerTurn, tile, source), source)
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
		source: ActionTrace,
		name: string,
		secondTile?: BuildableTile
	) {
		let attacker = this.pOfTurn(attackerTurn)
		let landOwner = this.pOfTurn(tile.owner)

		// let offences = attacker.sampleAbility(EVENT_TYPE.DO_ATTACK, source)
		// let defences = landOwner.sampleAbility(EVENT_TYPE.BEING_ATTACKED, source)
		// let actions = abilityToAction(source, defences, offences)
		let builder = new AttemptAttackActionBuilder(this.game, source, attacker, name, tile)
		// new ActionPackage(this.game,source)
		if (name === CARD_NAME.LAND_CHANGE) {
			if (!secondTile) return
			builder.setMain(new TileAttackAction(attackerTurn, tile, name).setLandChangeTile(secondTile))
		} else {
			builder.setMain(new TileAttackAction(attackerTurn, tile, name))
		}
		// actions.applyAttemptAttackAbility(attackerTurn, offences, defences, name, tile.owner)
		this.game.pushActions(builder.setDefender(landOwner).build())
	}
	executeAbility(turn: number, name: ABILITY_NAME) {
		this.pOfTurn(turn).useAbility(name)
	}
	onMonopolyChance(player: MarblePlayer, spots: number[]) {
		// console.log("alert monopoly")
		// console.log(spots)
		let source = new ActionTrace(ACTION_TYPE.EMPTY)
		// let offences = player.sampleAbility(EVENT_TYPE.MONOPOLY_CHANCE,source)
		// let defences = this.getOtherPlayers(player.turn).map((p: MarblePlayer) => p.sampleAbility(EVENT_TYPE.MONOPOLY_ALERT,source))

		this.game.pushActions(new MonopolyChanceActionBuilder(this.game, source, player, spots).build())
	}
}
export { PlayerMediator }
