import { PlayerType, ProtoPlayer, shuffle } from "../core/Util"
import { Action, ACTION_TYPE, StateChangeAction } from "./action/Action"
import { abilityToAction } from "./ActionAbilityConverter"
import { ActionSource, ACTION_SOURCE_TYPE } from "./action/ActionSource"
import { ActionStack } from "./action/ActionStack"
import { DelayedAction, MoveAction, RollDiceAction } from "./action/DelayedAction"
import { DiceNumberGenerator } from "./DiceNumberGenerator"
import { MarbleGameMap, MONOPOLY } from "./GameMap"
import {
	BuyoutAction,
	ClaimBuyoutAction,
	ClaimTollAction,
	InstantAction,
	PayMoneyAction,
	TeleportAction,
} from "./action/InstantAction"
import { MarbleClientInterface } from "./MarbleClientInterface"
import { MarblePlayer, MarblePlayerStat } from "./Player"
import { PlayerMediator } from "./PlayerMediator"
import { BuildableTile } from "./tile/BuildableTile"
import { LandTile } from "./tile/LandTile"
import { BUILDING, Tile, TILE_TYPE } from "./tile/Tile"
import { backwardBy, distance, forwardBy, forwardDistance, getTilesBewteen, range } from "./util"
import { AskBuildAction, QueryAction, TileSelectionAction } from "./action/QueryAction"
import { TileFilter } from "./TileFilter"

const DELAY_ROLL_DICE = 1000

class MarbleGame {
	readonly map: MarbleGameMap

	cycle: number
	thisturn: number
	readonly isTeam: boolean
	totalnum: number
	olympicStage: number
	readonly mediator: PlayerMediator
	readonly SALARY = 100 * 10000
	readonly START_MONEY = 1000 * 10000

	totalturn: number
	actionStack: ActionStack
	playerTotal: number
	clientsReady: number
	begun: boolean
	clientInterface: MarbleClientInterface
	bankruptPlayers: number[]
	over: boolean
	readonly rname: string
	constructor(players: ProtoPlayer[], rname: string, isTeam: boolean) {
		this.isTeam = isTeam
		this.rname = rname
		this.map = new MarbleGameMap("god_hand")
		this.mediator = new PlayerMediator(this, this.map, players, this.START_MONEY)
		this.playerTotal = this.mediator.playerCount + this.mediator.aiCount
		this.clientInterface = new MarbleClientInterface(rname)
		this.clientsReady = 0
		this.begun = false
		this.thisturn = -1 //-1 before start
		this.actionStack = new ActionStack()
		this.bankruptPlayers = []
		this.over = false
	}
	setClientInterface(ci: MarbleClientInterface) {
		this.clientInterface = ci
		this.map.clientInterface = ci
	}
	thisPlayer() {
		return this.mediator.pOfTurn(this.thisturn)
	}
	nextAction() {
		return this.actionStack.pop()
	}
	canStart() {
		this.clientsReady += 1
		if (this.clientsReady < this.mediator.playerCount) {
			return false
		}

		return true
	}
	getInitialSetting() {
		return {
			players: this.mediator.getPlayerInitialSetting(),
			isTeam: this.isTeam,
		}
	}
	turnToNum(turn: number) {
		return this.mediator.playerTurns.indexOf(turn)
	}
	getDiceData(turn: number) {
		return this.mediator.pOfTurn(turn).getDiceData()
	}
	setTurns() {
		let turns = range(this.playerTotal - 1)
		this.mediator.setPlayerTurns(turns)
	}
	getNextTurn(): number {
		for (let i = 1; i <= 4; ++i) {
			let next = (this.thisturn + i) % this.playerTotal

			if (!this.bankruptPlayers.includes(next)) return next
		}
		return 0
	}

	onTurnStart() {
		if (this.over) return

		this.thisturn = this.getNextTurn()
		this.totalturn += 1

		this.thisPlayer().onTurnStart()
		this.pushSingleAction(
			new StateChangeAction(ACTION_TYPE.END_TURN, this.thisturn, new ActionSource(ACTION_SOURCE_TYPE.GAMELOOP))
		)
		let pendingActions=this.thisPlayer().getPendingAction()
		if(pendingActions.length===0){
			this.pushSingleAction(
				new QueryAction(ACTION_TYPE.DICE_CHANCE, this.thisturn, new ActionSource(ACTION_SOURCE_TYPE.GAMELOOP))
			)
		}
		else{
			this.pushActions(null,pendingActions)
			this.thisPlayer().clearPendingAction()
		}
		
	}
	throwDice(target: number, oddeven: number) {
		let sample = this.mediator.getDiceAbilitySamples(this.thisturn)
		let dice = DiceNumberGenerator.generate(target, sample.dc, sample.exactdc, sample.double, oddeven)
		let isDouble = dice[0] === dice[1]
		if (oddeven > 0) this.thisPlayer().useOddEven()
		let isTripleDouble = false
		if (isDouble) {
			if (this.thisPlayer().doubles >= 2) {
				isTripleDouble = true
			} else {
				this.thisPlayer().onDouble()

				this.pushSingleAction(
					new QueryAction(
						ACTION_TYPE.DICE_CHANCE,
						this.thisturn,
						new ActionSource(ACTION_SOURCE_TYPE.GAMELOOP).setName("double")
					)
				)
			}
		}
		let player = this.thisPlayer()

		this.pushSingleAction(
			new RollDiceAction(
				this.thisturn,
				new ActionSource(ACTION_SOURCE_TYPE.DICE),
				player.pos,
				dice[0] + dice[1],
				isTripleDouble
			)
		)

		return {
			dice: dice,
			isDouble: isDouble,
		}
	}
	onTripleDouble() {
		this.thisPlayer().onTripleDouble()

		this.pushSingleAction(
			new TeleportAction(
				ACTION_TYPE.TELEPORT,
				this.thisturn,
				new ActionSource(ACTION_SOURCE_TYPE.THREE_DOUBLES),
				this.map.island
			)
		)
	}

	// afterDice(dice: number) {

	// 	//this.onWalkMove(player.pos, dice, player.turn, new ActionSource(ACTION_SOURCE_TYPE.DICE))
	// }

	/**
	 * 중간에 다른 영향으로 멈출수 있음(주사위,세계여행)
	 * @param pos
	 * @param dist
	 * @param turn
	 * @param source
	 * @returns updated distance
	 */
	requestWalkMove(pos: number, dist: number, turn: number, source: ActionSource) {
		let newpos = forwardBy(pos, dist)

		newpos = this.checkPassedTiles(pos, newpos, this.mediator.pOfTurn(turn), source)
		newpos = this.checkPassedPlayers(pos, newpos, this.mediator.pOfTurn(turn), source)

		this.pushSingleAction(new MoveAction(ACTION_TYPE.WALK_MOVE, turn, source, pos, distance(pos, newpos)))

		// return distance(pos, newpos)
	}
	/**
	 * 중간에 다를 영향으로 멈추지 않음(힐링발동,포춘카드이동,건장)
	 * @param pos
	 * @param dist
	 * @param turn
	 * @param source
	 */
	requestForceWalkMove(pos: number, dist: number, turn: number, source: ActionSource) {
		let newpos = forwardBy(pos, dist)

		this.checkPassedTiles(pos, newpos, this.mediator.pOfTurn(turn), source)
		this.checkPassedPlayers(pos, newpos, this.mediator.pOfTurn(turn), source)

		this.pushSingleAction(new MoveAction(ACTION_TYPE.WALK_MOVE, turn, source, pos, dist))
	}
	/**
	 * 걸어서 이동(주사위,세계여행,힐링,포춘카드)
	 * 월급 등 타일 지나쳤을때 받는 효과 모두 받음
	 * 플레이어 지나쳤을때 효과도 받음
	 * @param turn
	 * @param distance
	 * @param source
	 */
	movePlayer(turn: number, distance: number, source: ActionSource) {
		let oldpos = this.mediator.pOfTurn(turn).pos
		this.mediator.pOfTurn(turn).moveBy(distance)
		let newpos = this.mediator.pOfTurn(turn).pos

		this.checkPlayerMeet(turn, newpos, source)
		this.arriveTile(newpos, turn, source)
	}
	/**
	 * 날아서 이동(3더블 무인도, 잘가북,라인이동)
	 * 플레이어/타일 지나쳤을때 효과 없음
	 * @param turn
	 * @param pos
	 * @param source
	 */
	teleportPlayer(turn: number, pos: number, source: ActionSource) {
		this.mediator.pOfTurn(turn).moveTo(pos)

		this.checkPlayerMeet(turn, pos, source)
		this.arriveTile(pos, turn, source)
	}
	checkPassedTiles(oldpos: number, newpos: number, mover: MarblePlayer, source: ActionSource) {
		for (const tile of [...getTilesBewteen(oldpos, newpos), newpos]) {
			let block = this.map.onTilePass(this, tile, mover, source)
			if (block) return tile
		}
		return newpos
	}
	checkPassedPlayers(oldpos: number, newpos: number, mover: MarblePlayer, source: ActionSource) {
		for (const player of this.mediator.getPlayersBetween(oldpos, newpos)) {
			let block = this.mediator.onPlayerPassOther(mover, player, oldpos, newpos, source)
			if (block) return player.pos
		}
		return newpos
	}
	checkPlayerMeet(moverTurn: number, pos: number, source: ActionSource) {
		let players = this.mediator.getPlayersInRange(this.mediator.pOfTurn(moverTurn).pos, 0)
		for (const p of players) {
			this.mediator.onMeetPlayer(this.mediator.pOfTurn(moverTurn), p, pos, source)
		}
	}
	arriveTile(pos: number, moverTurn: number, source: ActionSource) {
		let tile = this.map.tileAt(pos)
		if (tile instanceof BuildableTile) {
			this.arriveBuildableTile(tile, moverTurn, source)
		} else if (tile.type === TILE_TYPE.CARD) {

		} else if (tile.type === TILE_TYPE.TRAVEL) {
			this.arriveTravelTile(moverTurn,source)
		} else if (tile.type === TILE_TYPE.OLYMPIC) {
			this.arriveOlympicTile(moverTurn,source)
		} else if (tile.type === TILE_TYPE.START) {
			this.arriveStartTile(moverTurn,source)
		} else if (tile.type === TILE_TYPE.SPECIAL) {
			if (this.map.name === "god_hand") {
				this.arriveGodHandSpecialTile(tile, moverTurn, source)
			}
		}
	}
	forceEndTurn(turn:number){
		this.actionStack.removeByTurnExcludeType(turn,[ACTION_TYPE.END_TURN])
	}
	arriveOlympicTile(moverTurn:number,source:ActionSource){
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.MY_LAND()
		)
		this.pushSingleAction(
			new TileSelectionAction(
				ACTION_TYPE.CHOOSE_OLYMPIC_POSITION,
				moverTurn,
				new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_OLYMPIC_TILE),
				targetTiles
			)
		)
	}
	arriveTravelTile(moverTurn: number,source: ActionSource){
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.ALL_EXCLUDE_MY_POS()
		)
		this.mediator.pOfTurn(moverTurn).addPendingAction(
			new TileSelectionAction(
				ACTION_TYPE.CHOOSE_MOVE_POSITION,
				moverTurn,
				new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TRAVEL_TILE),
				targetTiles
			)
		)
		this.forceEndTurn(moverTurn)

		

	}
	arriveStartTile(moverTurn: number,source: ActionSource){
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable()
		)
		if(targetTiles.length === 0) return

		this.pushSingleAction(
			new TileSelectionAction(
				ACTION_TYPE.CHOOSE_BUILD_POSITION,
				moverTurn,
				new ActionSource(ACTION_SOURCE_TYPE.START_TILE_BUILD),
				targetTiles
			)
		)
	}
	arriveGodHandSpecialTile(tile: Tile, moverTurn: number, source: ActionSource) {
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.EMPTY_LANDTILE().setSameLineOnly(),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable().setSameLineOnly()
		)

		this.pushSingleAction(
			new TileSelectionAction(
				ACTION_TYPE.CHOOSE_BUILD_POSITION,
				moverTurn,
				new ActionSource(ACTION_SOURCE_TYPE.GOD_HAND_SPECIAL_BUILD),
				targetTiles
			)
		)
	}
	arriveBuildableTile(tile: BuildableTile, moverTurn: number, source: ActionSource) {
		//empty land
		if (tile.isEmpty()) {
			this.mediator.onArriveEmptyLand(moverTurn, tile, source)
		}
		//enemy land
		else if (this.mediator.areEnemy(tile.owner, moverTurn)) {
			this.mediator.onArriveEnemyLand(moverTurn, tile.owner, tile, source)
		}
		//my land
		else if (tile.owner === moverTurn) {
			this.mediator.onArriveMyLand(moverTurn, tile, source)
			//this.arriveMyLand(tile, moverTurn,source)
		}
	}
	onSelectBuildPosition(turn:number,pos:number,source:ActionSource){
		let tile=this.map.tileAt(pos)
		if(tile instanceof BuildableTile)
			this.pushActions(null,this.getAskBuildAction(turn,tile,source))
	}
	onSelectMovePosition(turn:number,pos:number,source:ActionSource){
		let oldpos=this.mediator.pOfTurn(turn).pos
		let dist=forwardDistance(oldpos,pos)
		if(source.eventType===ACTION_SOURCE_TYPE.ARRIVE_TRAVEL_TILE){
			this.requestForceWalkMove(oldpos,dist,turn,new ActionSource(ACTION_SOURCE_TYPE.TRAVEL))
		}

	}
	onSelectOlympicPosition(turn:number,pos:number,source:ActionSource){
		this.map.setOlympic(pos)
		this.clientInterface.setOlympic(pos)
	}
	getAskBuildAction(playerTurn: number, tile: BuildableTile, source: ActionSource) {
		let mainaction: Action[] | undefined = undefined
		let player = this.mediator.pOfTurn(playerTurn)

		if(tile.owner !== -1 && !tile.isMoreBuildable()) return mainaction

		if (player.canBuildLandOfMinimumPrice(tile.getMinimumBuildPrice())) {
			let builds = tile.getBuildingAvaliability(player.cycleLevel)
			mainaction = [
				new AskBuildAction(
					playerTurn,
					new ActionSource(ACTION_SOURCE_TYPE.ARRIVE_TILE),
					tile.position,
					builds,
					tile.getCurrentBuilds(),
					player.getBuildDiscount(),
					player.money
				),
			]
		}
		return mainaction
	}

	executeAction(action: Action) {
		if (action instanceof ClaimTollAction) {
			this.mediator.claimToll(action.turn, action.tile.owner, action.tile, action.source)
		} else if (action instanceof ClaimBuyoutAction) {
			this.mediator.claimBuyOut(action.turn, action.tile.owner, action.tile, action.source)
		} else if (action instanceof PayMoneyAction) {
			this.mediator.payMoney(action.turn, action.receiver, action.amount, action.source)
		} else if (action instanceof TeleportAction) {
			this.clientInterface.teleportPlayer(action.turn, action.pos)
			this.teleportPlayer(action.turn, action.pos, action.source)
		} else if (action instanceof BuyoutAction) {
			this.clientInterface.buyout(action.turn, action.tile.position)
			this.mediator.buyOut(action.turn, action.tile.owner, action.price, action.tile, action.source)
		}
	}
	pushActions(actions: [Action[], Action[], boolean] | null, main?: Action[]) {
		if (!actions) {
			if (main != null) this.actionStack.pushAll(main)
			return
		}

		if (actions[1] != null) this.actionStack.pushAll(actions[1])
		if (main != null)
			if (actions[2]) {
				this.onActionBlock(main)
			} else {
				this.actionStack.pushAll(main)
			}
		if (actions[0] != null) this.actionStack.pushAll(actions[0])
	}
	pushSingleAction(action: Action) {
		if (action.type === ACTION_TYPE.GAMEOVER) {
			this.actionStack.removeByTurn(action.turn)
		}

		this.actionStack.push(action)
	}
	onActionBlock(blockedAction: Action[]) {}

	buildAt(tile: BuildableTile, builds: BUILDING[], player: number): number {
		return this.map.buildAt(tile, builds, player)
	}
	receiveMoney(player: MarblePlayer, amount: number) {
		this.mediator.earnMoney(player, amount)
	}
	/**
	 * 직접건설(직접 선택해서 건설):땅도착, 출발지건설,특수지역건설
	 * @param player
	 * @param builds
	 * @param pos
	 * @param discount
	 * @returns
	 */
	directBuild(player: number, builds: BUILDING[], pos: number, discount: number) {
		if (builds.length === 0) return
		let tile = this.map.tileAt(pos)
		if (!(tile instanceof BuildableTile)) return
		let owner = this.mediator.players[player]

		if (tile.owner !== owner.turn) this.setLandOwner(tile, owner)

		let price = this.buildAt(tile, builds, player)
		this.mediator.payMoneyToBank(owner, price * discount)

		let source = new ActionSource(ACTION_SOURCE_TYPE.BUILD_DIRECT)
		let event
		if (builds.includes(BUILDING.LANDMARK)) {
			event = owner.onBuildLandMark(tile, source)
		} else {
			event = owner.onBuild(tile, source)
		}
		this.pushActions(abilityToAction(source, event))
	}
	/**
	 * 자동건설 : 뉴타운 니르바나 등
	 * @param player
	 * @param pos
	 * @param buildings
	 * @param source
	 * @returns
	 */
	autoBuild(player: MarblePlayer, pos: number, buildings: BUILDING[], source: ActionSource) {
		if (buildings.length === 0) return
		let tile = this.map.tileAt(pos)
		if (!(tile instanceof BuildableTile)) return

		if (tile.owner !== player.turn) this.setLandOwner(tile, player)

		this.buildAt(tile, buildings, player.turn)

		let event
		if (buildings.includes(BUILDING.LANDMARK)) {
			event = player.onBuildLandMark(tile, source)
		} else {
			event = player.onBuild(tile, source)
		}
		this.pushActions(abilityToAction(source, event))
	}

	attemptDirectBuyout(buyer: number, pos: number, price: number) {
		let tile = this.map.tileAt(pos)
		if (!(tile instanceof BuildableTile) || tile.owner === -1) return
		this.mediator.attemptBuyOut(buyer, tile.owner, tile, price, new ActionSource(ACTION_SOURCE_TYPE.BUYOUT_DIRECT))
	}
	// getAvaliableBuild(player: MarblePlayer, tile: BuildableTile, event: ActionSource): BUILDING[] {
	// //	return player.getAvaliableBuild(tile.getBuildables(), event)
	// }
	landBuyOut(buyer: MarblePlayer, landOwner: MarblePlayer, tile: BuildableTile) {
		this.setLandOwner(tile, buyer)
	}
	setLandOwner(tile: BuildableTile, player: MarblePlayer) {
		let originalOwner = tile.owner
		this.map.setLandOwner(tile, player.turn)

		if (originalOwner > -1) {
			this.mediator.pOfTurn(originalOwner).ownedLands.delete(tile.position)
			this.clientInterface.setLandOwner(tile.position, player.turn)
		}

		player.ownedLands.add(tile.position)

		if (tile instanceof LandTile && tile.landMark) {
			this.mediator.pOfTurn(originalOwner).ownedLandMarks.delete(tile.position)
			player.ownedLandMarks.add(tile.position)
		}
		this.checkMonopoly(tile, player)
	}
	onConfirmLoan(player: number, receiver: number, amount: number, result: boolean) {
		if (result) this.mediator.onLoanConfirm(amount, player, receiver)
		else this.bankrupt(this.mediator.players[player])
	}
	checkMonopoly(tile: BuildableTile, invoker: MarblePlayer) {
		let monopoly = this.map.checkMonopoly(tile, invoker.turn)
		if (monopoly !== MONOPOLY.NONE) {
			this.gameOverWithMonopoly(invoker.turn, monopoly)
			return
		}
		let monopolyAlert = this.map.checkMonopolyAlert(tile, invoker.turn)

		if (monopolyAlert.type !== MONOPOLY.NONE) {
			this.clientInterface.monopolyAlert(invoker.turn, monopolyAlert.type, monopolyAlert.pos)
			this.mediator.onMonopolyAlert(invoker, monopolyAlert.pos)
		}
	}

	gameOverWithMonopoly(winner: number, monopoly: MONOPOLY) {
		this.over = true
		this.pushSingleAction(
			new StateChangeAction(ACTION_TYPE.GAMEOVER, winner, new ActionSource(ACTION_SOURCE_TYPE.GAMELOOP))
		)
		this.clientInterface.gameOverWithMonopoly(winner, monopoly)
	}

	bankrupt(player: MarblePlayer) {
		player.bankrupt()
		this.forceEndTurn(player.turn)

		this.clientInterface.bankrupt(player.turn)
		this.bankruptPlayers.push(player.turn)
		let left = this.mediator.getNonRetiredPlayers()

		let toremove=this.map.onPlayerRetire(player)

		this.clientInterface.clearBuildings(toremove)

		if (left.length === 1) this.gameoverWithBankrupt(left[0].turn)

	}
	gameoverWithBankrupt(winner: number) {
		this.clientInterface.gameoverWithBankrupt(winner)
		this.over = true
		this.pushSingleAction(
			new StateChangeAction(ACTION_TYPE.GAMEOVER, winner, new ActionSource(ACTION_SOURCE_TYPE.GAMELOOP))
		)
	}
}

export { MarbleGame }
