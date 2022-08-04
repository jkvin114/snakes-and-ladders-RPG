import { ProtoPlayer, shuffle } from "../core/Util"
import { Action, ACTION_TYPE, EmptyAction, MOVETYPE, StateChangeAction } from "./action/Action"
import { ActionSource, ACTION_SOURCE_TYPE } from "./action/ActionSource"
import { ActionStack } from "./action/ActionStack"
import { MoveAction, RollDiceAction } from "./action/DelayedAction"
import { DiceNumberGenerator } from "./DiceNumberGenerator"
import { MarbleGameMap, MONOPOLY } from "./GameMap"
import {
	ActionModifier,
	ArriveTileAction,
	EarnMoneyAction,
	InstantAction,
	RequestMoveAction,
	TileAttackAction,
} from "./action/InstantAction"
import { MarbleClientInterface } from "./MarbleClientInterface"
import { MarblePlayer, MarblePlayerStat } from "./Player"
import { PlayerMediator } from "./PlayerMediator"
import { BuildableTile } from "./tile/BuildableTile"
import { LandTile } from "./tile/LandTile"
import { BUILDING, Tile, TILE_TYPE } from "./tile/Tile"
import {
	backwardBy,
	chooseRandom,
	cl,
	distance,
	forwardBy,
	forwardDistance,
	getTilesBewteen,
	range,
	sample,
} from "./util"
import {
	AskAttackDefenceCardAction,
	AskBuildAction,
	AskDefenceCardAction,
	AskGodHandSpecialAction,
	AskTollDefenceCardAction,
	LandSwapAction,
	MoveTileSelectionAction,
	ObtainCardAction,
	QueryAction,
	TileSelectionAction,
} from "./action/QueryAction"
import { TileFilter } from "./TileFilter"
import { ActionPackage } from "./action/ActionPackage"
import { AttackCard, CARD_NAME, CommandCard, DefenceCard, FortuneCardRegistry } from "./FortuneCard"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { EVENT_TYPE } from "./Ability/EventType"
import { isBlock } from "typescript"
import type { AbilityValues } from "./Ability/AbilityValues"

const DELAY_ROLL_DICE = 1000
const MAP = ["world", "god_hand"]
class MarbleGame {
	readonly map: MarbleGameMap

	cycle: number
	thisturn: number
	readonly isTeam: boolean
	totalnum: number
	olympicStage: number
	readonly mediator: PlayerMediator
	readonly SALARY = 150 * 10000
	readonly START_MONEY = 1000 * 10000
	// readonly START_MONEY = 70 * 10000
	totalturn: number
	actionStack: ActionStack
	playerTotal: number
	clientsReady: number
	begun: boolean
	clientInterface: MarbleClientInterface
	bankruptPlayers: number[]
	over: boolean
	readonly rname: string
	constructor(players: ProtoPlayer[], rname: string, isTeam: boolean, map: number) {
		this.isTeam = isTeam
		this.rname = rname
		this.map = new MarbleGameMap(MAP[map % MAP.length])
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
		this.mediator.registerAbilities()
	}
	getNextTurn(): number {
		for (let i = 1; i <= 4; ++i) {
			let next = (this.thisturn + i) % this.playerTotal

			if (!this.bankruptPlayers.includes(next)) return next
		}
		return 0
	}

	onGameStart() {}
	onTurnStart() {
		if (this.over) return

		this.thisturn = this.getNextTurn()

		this.thisPlayer().onTurnStart()
		this.map.onTurnStart(this.thisturn)
		this.pushSingleAction(new StateChangeAction(ACTION_TYPE.END_TURN, this.thisturn))
		let pendingActions = this.thisPlayer().getPendingAction()
		if (pendingActions.length === 0) {
			this.pushSingleAction(new QueryAction(ACTION_TYPE.DICE_CHANCE, this.thisturn))
		} else {
			this.pushActions(new ActionPackage(this.thisturn).setMain(...pendingActions))
			this.thisPlayer().clearPendingAction()
		}

		if (this.thisturn === 0) this.totalturn += 1
	}
	getDiceModifiers(source: ActionSource, oddEven: number) {
		let dc = sample(this.thisPlayer().getDiceControlChance())
		let abilities = this.thisPlayer().sampleAbility(EVENT_TYPE.GENERATE_DICE_NUMBER, source)
		let isExactDc = false
		let isDouble = false
		let multiplier = 1
		let executed: ABILITY_NAME[] = []
		for (const name of abilities.keys()) {
			if (name === ABILITY_NAME.DICE_CONTROL_ACCURACY && dc) {
				isExactDc = true
				executed.push(name)
			}
			if (name === ABILITY_NAME.BACK_DICE) {
				multiplier *= -1
				executed.push(name)
			}
			if (name === ABILITY_NAME.MOVE_DOUBLE_ON_DICE) {
				multiplier *= 2
				executed.push(name)
			}
			if (name === ABILITY_NAME.DICE_DOUBLE && oddEven !== DiceNumberGenerator.ODD) {
				executed.push(name)
				isDouble = true
			}
		}

		this.executeAbility(
			executed.map((name) => {
				return { turn: this.thisturn, name: name }
			})
		)

		return {
			dc: dc,
			exactDc: isExactDc,
			isDouble: isDouble,
			multiplier: multiplier,
		}
	}
	throwDice(target: number, oddeven: number) {
		// let sample = this.mediator.getDiceAbilitySamples(this.thisturn)
		let source = new ActionSource()
		let modifiers = this.getDiceModifiers(source, oddeven)
		let multiplier = modifiers.multiplier

		const [dice1, dice2] = DiceNumberGenerator.generate(target, oddeven, modifiers)

		let isDouble = dice1 === dice2
		if (oddeven > 0) this.thisPlayer().useOddEven()
		let isTripleDouble = false
		if (isDouble) {
			if (this.thisPlayer().doubles >= 2) {
				isTripleDouble = true
			} else {
				this.thisPlayer().onDouble()

				this.pushSingleAction(new QueryAction(ACTION_TYPE.DICE_CHANCE, this.thisturn))
			}
		}
		let player = this.thisPlayer()

		let distance = multiplier * (dice1 + dice2)
		let actions = new ActionPackage(this.thisturn)
			.setMain(new RollDiceAction(this.thisturn, player.pos, distance, isTripleDouble))
			.applyThrowDiceAbility(this.thisturn, source, player.sampleAbility(EVENT_TYPE.THROW_DICE, source), dice1 + dice2)

		if (isTripleDouble) {
			actions.addAfter(new RequestMoveAction(this.thisturn, this.map.island, MOVETYPE.TELEPORT))
			player.onTripleDouble()
		} else {
			actions.addAfter(new RequestMoveAction(this.thisturn, forwardBy(player.pos, distance), MOVETYPE.WALK))
		}

		this.pushActions(actions)

		return {
			dice: [dice1, dice2],
			isDouble: isDouble,
			dc: modifiers.dc,
		}
	}

	private onTripleDouble() {
		this.thisPlayer().onTripleDouble()

		// this.pushSingleAction(
		// 	new TeleportAction(
		// 		ACTION_TYPE.TELEPORT,
		// 		this.thisturn,
		// 		this.map.island
		// 	)
		// )
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
	requestWalkMove(turn: number, newpos: number, source: ActionSource) {
		// let newpos = forwardBy(pos, dist)
		let pos = this.mediator.pOfTurn(turn).pos

		newpos = this.checkPassedTiles(pos, newpos, this.mediator.pOfTurn(turn), source,MOVETYPE.WALK)
		newpos = this.checkPassedPlayers(pos, newpos, this.mediator.pOfTurn(turn), source)

		this.pushSingleAction(
			new MoveAction(ACTION_TYPE.WALK_MOVE, turn, pos, forwardDistance(pos, newpos)).setSource(source)
		)

		// return distance(pos, newpos)
	}
	/**
	 * 중간에 다를 영향으로 멈추지 않음(힐링발동,포춘카드이동,건장)
	 * @param pos
	 * @param dist
	 * @param turn
	 * @param source
	 */
	requestForceWalkMove(moverTurn: number, newpos: number, source: ActionSource) {
		let pos = this.mediator.pOfTurn(moverTurn).pos

		this.checkPassedTiles(pos, newpos, this.mediator.pOfTurn(moverTurn), source,MOVETYPE.FORCE_WALK)
		this.checkPassedPlayers(pos, newpos, this.mediator.pOfTurn(moverTurn), source)

		this.pushSingleAction(
			new MoveAction(ACTION_TYPE.WALK_MOVE, moverTurn, pos, forwardDistance(pos, newpos)).setSource(source)
		)
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
		this.pushSingleAction(new ArriveTileAction(turn, newpos).setSource(source))
		// this.arriveTile(newpos, turn, source)
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
		// this.arriveTile(pos, turn, source)
		this.pushSingleAction(new ArriveTileAction(turn, pos).setSource(source))
		this.clientInterface.teleportPlayer(turn, pos)
	}
	onPassStartTile(player: MarblePlayer, source: ActionSource) {
		let amount = this.SALARY
		this.pushActions(
			new ActionPackage(this.thisturn)
				.setMain(new EarnMoneyAction(player.turn, amount))
				.applyReceiveSalaryAbility(player.turn, source, player.sampleAbility(EVENT_TYPE.RECEIVE_SALARY, source))
		)
		player.onPassStartTile()
	}

	checkPassedTiles(oldpos: number, newpos: number, mover: MarblePlayer, source: ActionSource,type:MOVETYPE) {
		for (const tile of [...getTilesBewteen(oldpos, newpos), newpos]) {
			let block = this.map.onTilePass(this, tile, mover, source,type)
			if (block) return backwardBy(tile, 1)
		}
		return newpos
	}
	checkPassedPlayers(oldpos: number, newpos: number, mover: MarblePlayer, source: ActionSource) {
		for (const player of this.mediator.getPlayersBetween(oldpos, newpos)) {
			console.log(mover.turn+"pass"+player.turn)
			if (mover.turn === player.turn) continue
			let block = this.mediator.onPlayerPassOther(mover, player, oldpos, newpos, source)
			if (block) return player.pos
		}
		return newpos
	}
	checkPlayerMeet(moverTurn: number, pos: number, source: ActionSource) {
		let players = this.mediator.getPlayersInRange(this.mediator.pOfTurn(moverTurn).pos, 0)
		for (const p of players) {
			if (moverTurn === p.turn) continue
			this.mediator.onMeetPlayer(this.mediator.pOfTurn(moverTurn), p, pos, source)
		}
	}
	arriveTile(action: ArriveTileAction) {
		let pos = action.pos
		let moverTurn = action.turn
		let source = action.source
		let tile = this.map.tileAt(pos)
		
		if (tile instanceof BuildableTile) {
			this.arriveBuildableTile(tile, moverTurn, source)
		} else if (tile.type === TILE_TYPE.CARD) {
			this.arriveCardTile(moverTurn, source)
		} else if (tile.type === TILE_TYPE.TRAVEL) {
			this.arriveTravelTile(moverTurn, source)
		} else if (tile.type === TILE_TYPE.OLYMPIC) {
			this.arriveOlympicTile(moverTurn)
		} else if (tile.type === TILE_TYPE.START) {
			this.arriveStartTile(moverTurn, source)
		} else if (tile.type === TILE_TYPE.SPECIAL) {
			if (this.map.name === "god_hand") {
				this.arriveGodHandSpecialTile(tile, moverTurn, source)
			}
		} else if (tile.type === TILE_TYPE.ISLAND) {
			this.arriveIslandTile(moverTurn, source)
		}
		this.pushActions(new ActionPackage(this.thisturn))
	}
	forceEndTurn(turn: number) {
		this.actionStack.removeByTurnExcludeType(turn, [ACTION_TYPE.END_TURN])
	}

	cancelDiceChances(){
		this.actionStack.removeByType(ACTION_TYPE.DICE_CHANCE)
		this.actionStack.removeByType(ACTION_TYPE.DICE_CHANCE_NO_DOUBLE)
	}
	getCardModifier(player: MarblePlayer, source: ActionSource) {
		let abs = player.sampleAbility(EVENT_TYPE.DRAW_CARD, source)
		if (abs.has(ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD)) return ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD

		return ABILITY_NAME.NONE
	}

	drawCard(turn: number, affectingAbility: ABILITY_NAME, goldFortuneChance: number) {
		this.executeAbility([{ name: affectingAbility, turn: turn }])

		return FortuneCardRegistry.draw(goldFortuneChance, affectingAbility)
	}

	arriveCardTile(moverTurn: number, source: ActionSource) {
		let player = this.mediator.pOfTurn(moverTurn)

		let card = this.drawCard(moverTurn, this.getCardModifier(player, source), player.getGoldFortuneChance())
		this.pushSingleAction(new ObtainCardAction(moverTurn, card))
	}
	executeCardCommand(invoker: number, card: CommandCard) {
		// let source = new ActionSource(ACTION_SOURCE_TYPE.COMMAND_CARD)
		let currpos = this.mediator.pOfTurn(invoker).pos
		switch (card.name) {
			case CARD_NAME.GO_START:
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.start, MOVETYPE.FORCE_WALK))
				break
			case CARD_NAME.GO_OLYMPIC:
				if (this.map.olympicPos === -1) return
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.olympicPos, MOVETYPE.FORCE_WALK))
				break
			case CARD_NAME.OLYMPIC:
				this.arriveOlympicTile(invoker)
				break
			case CARD_NAME.GO_TRAVEL:
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.travel, MOVETYPE.FORCE_WALK))
				break
			case CARD_NAME.GO_ISLAND:
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.island, MOVETYPE.TELEPORT))

				break
			case CARD_NAME.DONATE_LAND:
				let myTiles = this.map.getTiles(this.mediator.pOfTurn(invoker), TileFilter.MY_LAND().setNoLandMark())
				if (myTiles.length === 0) return
				this.pushSingleAction(
					new TileSelectionAction(ACTION_TYPE.CHOOSE_DONATE_POSITION, invoker, myTiles, CARD_NAME.DONATE_LAND)
				)
				break
			case CARD_NAME.GO_SPECIAL:
				let tiles = this.map.getTiles(this.mediator.pOfTurn(invoker), new TileFilter().setSpecialOnly())
				if (tiles.length === 0) return
				this.pushSingleAction(
					new MoveTileSelectionAction( invoker, tiles, CARD_NAME.GO_SPECIAL,MOVETYPE.FORCE_WALK)
				)
				break
		}
	}
	useAttackCard(turn: number, card: AttackCard) {
		if (card.name === CARD_NAME.LAND_CHANGE) {
			let enemyTiles = this.map.getTiles(this.mediator.pOfTurn(turn), TileFilter.ENEMY_LAND().setNoLandMark())
			let myTiles = this.map.getTiles(this.mediator.pOfTurn(turn), TileFilter.MY_LAND().setNoLandMark())
			if (enemyTiles.length === 0 || myTiles.length === 0) return

			this.pushSingleAction(new LandSwapAction(turn, myTiles, enemyTiles))
		} else {
			let filter = TileFilter.ENEMY_LAND()

			if (card.name === CARD_NAME.EARTHQUAKE) filter.setNoLandMark().setLandTileOnly()
			else if (card.name === CARD_NAME.SELLOFF) filter.setNoLandMark()

			let targetTiles = this.map.getTiles(this.mediator.pOfTurn(turn), filter)

			if (targetTiles.length === 0) return

			this.pushSingleAction(new TileSelectionAction(ACTION_TYPE.CHOOSE_ATTACK_POSITION, turn, targetTiles, card.name))
		}
	}
	saveCard(turn: number, card: DefenceCard) {
		let ab = card.toAbility()
		if (ab === ABILITY_NAME.NONE) return
		this.mediator.pOfTurn(turn).saveCardAbility(ab)
		this.clientInterface.setSavedCard(turn, card.name, card.level)
	}

	arriveIslandTile(moverTurn: number, source: ActionSource) {
		this.cancelDiceChances()
	}
	arriveOlympicTile(moverTurn: number) {
		let targetTiles = this.map.getTiles(this.mediator.pOfTurn(moverTurn), TileFilter.MY_LAND())
		if (targetTiles.length === 0) return

		this.pushSingleAction(
			new TileSelectionAction(ACTION_TYPE.CHOOSE_OLYMPIC_POSITION, moverTurn, targetTiles, "olympic")
		)
	}
	arriveTravelTile(moverTurn: number, source: ActionSource) {
		let targetTiles = this.map.getTiles(this.mediator.pOfTurn(moverTurn), TileFilter.ALL_EXCLUDE_MY_POS())
		if (targetTiles.length === 0) return
		let player=this.mediator.pOfTurn(moverTurn)
		let abilities=player.sampleAbility(EVENT_TYPE.ARRIVE_TRAVEL,source)
		let action=new ActionPackage(this.thisturn)
		.setMain(new MoveTileSelectionAction(moverTurn, targetTiles, "travel",MOVETYPE.WALK))
		.applyAbilityArriveTravel(player,abilities,source)
		
		this.pushActions(action)

		this.cancelDiceChances()
	}
	arriveStartTile(moverTurn: number, source: ActionSource) {
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable()
		)
		if (targetTiles.length === 0) return

		this.pushSingleAction(
			new TileSelectionAction(ACTION_TYPE.CHOOSE_BUILD_POSITION, moverTurn, targetTiles, "start_build")
			.setSource(new ActionSource().addFlag("start_build"))
		)
	}
	arriveGodHandSpecialTile(tile: Tile, moverTurn: number, source: ActionSource) {
		const tileLiftStart = 0
		this.pushSingleAction(new AskGodHandSpecialAction(moverTurn, true))
	}
	chooseGodHandSpecialBuild(moverTurn: number) {
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.EMPTY_LANDTILE().setSameLineOnly(),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable().setSameLineOnly()
		)
		if (targetTiles.length === 0) return
		this.pushSingleAction(
			new TileSelectionAction(ACTION_TYPE.CHOOSE_BUILD_POSITION, moverTurn, targetTiles, "godhand_special_build")
		)
	}
	chooseGodHandSpecialLiftTile(moverTurn: number) {
		let targetTiles = this.map.getTiles(this.mediator.pOfTurn(moverTurn), new TileFilter().setSameLineOnly())
		if (targetTiles.length === 0) return
		this.pushSingleAction(
			new TileSelectionAction(ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT, moverTurn, targetTiles, "godhand_special_tile_lift")
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
	onSelectBuildPosition(turn: number, pos: number, source: ActionSource) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile) return

		this.pushActions(new ActionPackage(this.thisturn).setMain(this.getAskBuildAction(turn, tile, source)))
	}
	onSelectMovePosition(turn: number, pos: number, type: MOVETYPE) {
		this.pushSingleAction(new RequestMoveAction(turn, pos, type))
	}
	onSelectOlympicPosition(turn: number, pos: number, source: ActionSource) {
		this.map.setOlympic(pos)
	}

	onSelectTileLiftPosition(turn: number, pos: number, source: ActionSource) {
		this.map.liftTile(pos)
	}
	/**
	 *
	 * @param turn
	 * @param pos
	 * @param source
	 * @param name
	 * @param pos2 도시 체인지 전용(상대에게 줄 땅)
	 * @returns
	 */
	onSelectAttackPosition(turn: number, pos: number, source: ActionSource, name: string, pos2?: number) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile || !tile.owned()) return
		let tile2: BuildableTile | undefined = undefined

		if (pos2 && pos2 > -1) tile2 = this.map.buildableTileAt(pos2) //도시 체인지 전용

		this.mediator.attemptAttackTile(turn, tile, source, name, tile2)
	}
	onSelectDonatePosition(turn: number, pos: number, source: ActionSource) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile || !tile.owned()) return

		this.setLandOwner(tile, this.mediator.getRandomEnemy(turn))
	}
	attackTile(action: TileAttackAction) {
		if (action.name === CARD_NAME.SELLOFF) {
			this.map.clearTile(action.tile)
		}
		if (action.name === CARD_NAME.EARTHQUAKE) {
			this.map.removeOneBuild(action.tile)
		}
		if (action.name === CARD_NAME.PANDEMIC || action.name === CARD_NAME.BLACKOUT) {
			this.map.applyStatusEffect(action.tile, action.name, 5)
		}
		if (action.name === CARD_NAME.LAND_CHANGE && action.landChangeTile != null) {
			this.swapLand(action.landChangeTile, action.tile)
		}
	}
	getAskBuildAction(playerTurn: number, tile: BuildableTile, source: ActionSource): Action {
		let mainaction: Action = new EmptyAction()
		let player = this.mediator.pOfTurn(playerTurn)

		if (tile.owner !== -1 && !tile.isMoreBuildable()) return mainaction

		if (player.canBuildLandOfMinimumPrice(tile.getMinimumBuildPrice())) {
			let builds = tile.getBuildingAvaliability(player.cycleLevel)
			if (builds.length > 0)
				mainaction = new AskBuildAction(
					playerTurn,
					tile.position,
					builds,
					tile.getCurrentBuilds(),
					player.getBuildDiscount(),
					player.money
				).setSource(source)
		}
		return mainaction
	}
	modifyActionWith(action: ActionModifier) {
		let tomodify = this.actionStack.findById(action.actionToModify)
		if (!tomodify) return

		action.modify(tomodify)
	}
	handleBlockedAction(action: Action) {
		this.onActionBlock(action)
	}
	executeAction(action: InstantAction) {
		action.execute(this)
	}

	executeAbility(abilities: { name: ABILITY_NAME; turn: number }[]) {
		for (const ab of abilities) {
			this.mediator.executeAbility(ab.turn, ab.name)
			let data = this.mediator.pOfTurn(ab.turn).getAbilityStringOf(ab.name)
			if (!data) continue
			this.sendAbility(ab.turn, ab.name, data.name, data.desc, false)
		}
	}
	sendAbility(turn: number, name: ABILITY_NAME, itemName: string, desc: string, isblocked: boolean) {
		// console.log("sendability"+itemName)
		this.clientInterface.ability(turn, name, itemName, desc, isblocked)
	}
	indicateBlockedAbility(abilities: { name: ABILITY_NAME; turn: number }[]) {
		for (const ab of abilities) {
			let data = this.mediator.pOfTurn(ab.turn).getAbilityStringOf(ab.name)
			if (!data) continue
			this.clientInterface.ability(ab.turn, ab.name, data.name, data.desc, true)
		}
	}
	addPendingAction(actions:Action[]){
		actions.forEach((a)=>{
			this.mediator.pOfTurn(a.turn).addPendingAction(a)
		})
	}
	pushActions(actions: ActionPackage | null) {
		if (!actions) return

		console.log(actions.executedAbilities)
		this.executeAbility(actions.executedAbilities)
		this.indicateBlockedAbility(actions.blockedAbilities)


		this.actionStack.pushAll(actions.after)
		if (actions.blocksMain) {
			//	this.onActionBlock(actions.main)
		} else if(actions.shouldPutMainToPending){
			this.addPendingAction(actions.main)
		}
		else{
			this.actionStack.pushAll(actions.main)
		}

		this.actionStack.pushAll(actions.before)
	}
	useDefenceCard(turn: number, action: AskDefenceCardAction) {
		this.mediator.pOfTurn(turn).useCard()
		this.sendAbility(turn, action.cardname as ABILITY_NAME, "", "", false)

		this.clientInterface.setSavedCard(turn, "", 0)
		if (action instanceof AskTollDefenceCardAction) {
			this.pushSingleAction(new ActionModifier(turn, action.toBlock, ActionModifier.TYPE_SET_VALUE, action.after))
		} else if (action instanceof AskAttackDefenceCardAction) {
			this.pushSingleAction(new ActionModifier(turn, action.toBlock, ActionModifier.TYPE_BLOCK))
		}
	}
	pushSingleAction(action: Action) {
		if (action.type === ACTION_TYPE.GAMEOVER) {
			this.actionStack.removeByTurn(action.turn)
		}

		this.actionStack.push(action)
	}
	onActionBlock(blockedAction: Action) {
		cl(blockedAction.type + " blocked")
	}

	buildAt(tile: BuildableTile, builds: BUILDING[], player: number): number {
		return this.map.buildAt(tile, builds, player)
	}
	receiveMoney(player: number, amount: number) {
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

		let source = new ActionSource()
		this.onBuild(owner, tile, builds, source)
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
		this.onBuild(player, tile, buildings, source)
	}

	onBuild(player: MarblePlayer, tile: BuildableTile, builds: BUILDING[], source: ActionSource) {
		let event: Map<ABILITY_NAME, AbilityValues>
		if (builds.includes(BUILDING.LANDMARK)) {
			event = player.sampleAbility(EVENT_TYPE.BUILD_LANDMARK, source)
		} else {
			event = player.sampleAbility(EVENT_TYPE.BUILD, source)
		}
		this.pushActions(new ActionPackage(this.thisturn).applyAbilityOnBuild(player.turn, tile, event, source))
	}

	attemptDirectBuyout(buyer: number, pos: number, price: number) {
		let tile = this.map.tileAt(pos)
		if (!(tile instanceof BuildableTile) || tile.owner === -1) return
		this.mediator.attemptBuyOut(buyer, tile.owner, tile, price, new ActionSource())
	}
	// getAvaliableBuild(player: MarblePlayer, tile: BuildableTile, event: ActionSource): BUILDING[] {
	// //	return player.getAvaliableBuild(tile.getBuildables(), event)
	// }
	landBuyOut(buyer: MarblePlayer, landOwner: MarblePlayer, tile: BuildableTile) {
		this.setLandOwner(tile, buyer)
	}
	/**
	 *
	 * @param tile1 invoker`s original land
	 * @param tile2 invoker`s desired land
	 */
	swapLand(tile1: BuildableTile, tile2: BuildableTile) {
		let invoker = this.mediator.pOfTurn(tile1.owner)
		let victim = this.mediator.pOfTurn(tile2.owner)

		this.map.setLandOwner(tile2, invoker.turn)
		this.map.setLandOwner(tile1, victim.turn)

		victim.ownedLands.delete(tile2.position)
		invoker.ownedLands.delete(tile1.position)

		this.clientInterface.setLandOwner(tile2.position, invoker.turn)
		this.clientInterface.setLandOwner(tile1.position, victim.turn)

		victim.ownedLands.add(tile1.position)
		invoker.ownedLands.add(tile2.position)

		this.checkMonopoly(tile2, invoker)
		this.checkMonopoly(tile1, victim)
	}
	setLandOwner(tile: BuildableTile, player: MarblePlayer) {
		let originalOwner = tile.owner
		this.map.setLandOwner(tile, player.turn)

		if (originalOwner > -1) {
			this.mediator.pOfTurn(originalOwner).ownedLands.delete(tile.position)
		}
		this.clientInterface.setLandOwner(tile.position, player.turn)

		player.ownedLands.add(tile.position)

		if (tile instanceof LandTile && tile.landMark) {
			this.mediator.pOfTurn(originalOwner).ownedLandMarks.delete(tile.position)
			player.ownedLandMarks.add(tile.position)
		}
		this.checkMonopoly(tile, player)
	}
	onConfirmLoan(player: number, receiver: number, loanamount: number, result: boolean) {
		if (result) this.mediator.onLoanConfirm(loanamount, player, receiver)
		else this.mediator.playerBankrupt(player, receiver, loanamount + this.mediator.pOfTurn(player).money)
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
			this.mediator.onMonopolyChance(invoker, monopolyAlert.pos)
		}
	}

	gameOverWithMonopoly(winner: number, monopoly: MONOPOLY) {
		this.over = true
		this.pushSingleAction(new StateChangeAction(ACTION_TYPE.GAMEOVER, winner))
		this.clientInterface.gameOverWithMonopoly(winner, monopoly)
	}

	bankrupt(player: MarblePlayer) {
		// player.bankrupt()

		this.forceEndTurn(player.turn)

		this.clientInterface.bankrupt(player.turn)
		this.bankruptPlayers.push(player.turn)
		let left = this.mediator.getNonRetiredPlayers()

		let toremove = this.map.onPlayerRetire(player)

		if (left.length === 1) this.gameoverWithBankrupt(left[0].turn)
	}
	gameoverWithBankrupt(winner: number) {
		this.clientInterface.gameoverWithBankrupt(winner)
		this.over = true
		this.pushSingleAction(new StateChangeAction(ACTION_TYPE.GAMEOVER, winner))
	}
}

export { MarbleGame }
