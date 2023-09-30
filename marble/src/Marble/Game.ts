import { Action, ACTION_TYPE, EmptyAction, MOVETYPE, StateChangeAction } from "./action/Action"
import { ActionTrace, ActionTraceTag } from "./action/ActionTrace"
import { ActionStack } from "./action/ActionStack"
import { MoveAction, PullAction, RollDiceAction, TeleportAction } from "./action/DelayedAction"
import { DiceNumberGenerator } from "./DiceNumberGenerator"
import { MarbleGameMap, MONOPOLY } from "./GameMap"
import {
	ActionModifier,
	ArriveTileAction,
	AutoBuildAction,
	ClaimBuyoutAction,
	CreateBlackholeAction,
	EarnMoneyAction,
	GameOverAction,
	InstantAction,
	PrepareTravelAction,
	RequestMoveAction,
	SendMessageAction,
	TileAttackAction,
} from "./action/InstantAction"
import { MarbleGameEventObserver } from "./MarbleGameEventObserver"
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
	randInt,
	range,
	roundToNearest,
	sample,
	signedShortestDistance,
} from "./util"
import {
	AskAttackDefenceCardAction,
	AskBuildAction,
	AskDefenceCardAction,
	AskGodHandSpecialAction,
	AskIslandAction,
	AskTollDefenceCardAction,
	BlackholeTileSelectionAction,
	DiceChanceAction,
	LandSwapAction,
	MoveTileSelectionAction,
	MoveToPlayerSelectionAction,
	ObtainCardAction,
	QueryAction,
	TileSelectionAction,
} from "./action/QueryAction"
import { TileFilter } from "./tile/TileFilter"
import { ActionPackage } from "./action/ActionPackage"
import { AttackCard, CARD_NAME, CommandCard, DefenceCard, FortuneCardRegistry } from "./FortuneCard"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { EVENT_TYPE } from "./Ability/EventType"
import type { ServerRequestModel } from "../Model/ServerRequestModel"
import {
	ArriveBlackholeActionBuilder,
	ArriveIslandActionBuilder,
	ArriveOlympicActionBuilder,
	ArriveStartActionBuilder,
	ArriveTravelActionBuilder,
	CreateBlackholeActionBuilder,
	OnBuildActionBuilder,
	PassOrArriveStartActionBuilder,
	PassTravelActionBuilder,
	PrepareTravelActionBuilder,
	PullActionBuilder,
	SelectOlympicActionBuilder,
	ThrowDiceActionBuilder,
	TurnStartActionBuilder,
} from "./action/PackageBuilder"
import { ChooseBuildActionBuilder } from "./action/PackageBuilder/ChooseBuildActionBuilder"
import { ServerEventModel } from "../Model/ServerEventModel"
import { ActionSelector } from "./Agent/ActionSelector/ActionSelector"
import { PlayerState } from "./Agent/Utility/PlayerState"
import { GameResultStat } from "../Model/GameResultStat"
import GameState from "./Agent/Utility/GameState"
import SimpleVectorizer from "./Agent/Utility/Vectorize/SimpleVectorizer"
import TileFocusVectorizer from "./Agent/Utility/Vectorize/TileFocusVectorizer"
import { AbilityExecution } from "./Ability/Ability"
import { GameType } from "./enum"
import { ProtoPlayer } from "../Model/models"

const MAP = ["world", "god_hand"]
class MarbleGame {
	readonly map: MarbleGameMap
	//cycle: number
	thisturn: number
	readonly isTeam: boolean
	//olympicStage: number
	readonly mediator: PlayerMediator
	readonly SALARY = 150 * 10000
	readonly START_MONEY = 1000 * 10000
	readonly ISLAND_ESCAPE_MONEY = 100 * 10000
	readonly TURN_END = 30

	// readonly START_MONEY = 70 * 10000
	totalturn: number
	private actionStack: ActionStack
	playerTotal: number
	clientsReady: number
	begun: boolean
	eventEmitter: MarbleGameEventObserver
	bankruptPlayers: number[]
	over: boolean
	totalBet: number
	state:GameState
	private readonly debug:boolean
	private saveStateVector:boolean
	private stateVectors:number[][]
	readonly rname: string
	readonly gametype:GameType
	constructor(players: ProtoPlayer[], rname: string, isTeam: boolean, map: number,gametype:GameType) {
		this.isTeam = isTeam
		this.rname = rname
		this.map = new MarbleGameMap(MAP[map % MAP.length])
		this.state=new GameState(new SimpleVectorizer())
		this.gametype=gametype
		this.mediator = new PlayerMediator(this, this.map, players, this.START_MONEY)
		this.playerTotal = this.mediator.playerCount + this.mediator.aiCount
		this.eventEmitter = new MarbleGameEventObserver(rname)
		this.clientsReady = 0
		this.begun = false
		this.thisturn = -1 //-1 before start
		this.actionStack = new ActionStack()
		this.bankruptPlayers = []
		this.over = false
		this.totalBet = this.playerTotal * this.START_MONEY
		// this.test()
		this.totalturn=0
		this.saveStateVector=false
		this.stateVectors=[]

		this.debug=false
	}
	test() {}
	setClientInterface(ci: MarbleGameEventObserver) {
		this.eventEmitter = ci
		this.map.eventEmitter = ci
	}
	setSaveVector(){
		this.saveStateVector=true
	}
	thisPlayer() {
		return this.mediator.pOfTurn(this.thisturn)
	}
	nextAction() {
		if(this.debug)
			this.eventEmitter.debugActionStack(this.actionStack.serialize())
		
		let action = this.actionStack.pop()
		if (action?.indicateAbilityOnPop && action.valid) {
			this.executeAbility([action.getReservedAbility()])
		}
		return action
	}
	actionAtDepth(depth: number) {
		return this.actionStack.at(depth)
	}
	hasPriorityAction(): boolean {
		return this.actionStack.priorityStack.length > 0
	}
	getPriorityActions(): InstantAction[] {
		return this.actionStack.popAllPriorityActions()
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
	setItems(itemSetting: ServerEventModel.ItemSetting) {
		try {
			this.mediator.registerAbilities(itemSetting)
		} catch (e) {
			console.error(e)
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
		// this.mediator.registerAbilities()
	}
	setAutoPlay(turn:number,auto:boolean){
		if(this.gametype!==GameType.NORMAL) return false
		if(this.mediator.pOfTurn(turn).AI) return false

		this.mediator.pOfTurn(turn).isAuto=auto
		return true
	}
	getNextTurn(): number {
		for (let i = 1; i <= 4; ++i) {
			let next = (this.thisturn + i) % this.playerTotal

			if (!this.bankruptPlayers.includes(next)) return next
		}
		return 0
	}

	getPlayerAgent(turn:number):ActionSelector{
		return this.mediator.getPlayerAgent(turn)
	}
	isAI(turn:number):boolean{
		return this.mediator.pOfTurn(turn).AI || this.mediator.pOfTurn(turn).isAuto
	}

	checkTurnEnd(): boolean {
		if (this.totalturn >= this.TURN_END) {
			let winner=this.mediator.getWinnerOnTurnEnd()

			//currently treated as game over with bankrupt(with multiplier 1)
			let scores=this.getPlayerWinScores(winner, 1)
			let windata=new GameOverAction(winner,"turn_end",scores)
			this.eventEmitter.gameoverWithBankrupt(winner,scores , 1,this.getResultStat(windata))
			this.over = true
			this.pushSingleAction(windata, new ActionTrace(ACTION_TYPE.EMPTY))

			return true
		}
		return false
	}

	updateState(){
		this.state.totalturn=this.totalturn
		this.state.totalBet=this.totalBet
		this.mediator.updatePlayerStates(this.state.players)
		this.map.updatePlayerStates(this.state.players,this.mediator.players)
		this.map.updateTileState(this.state)
		if(this.saveStateVector)
			this.stateVectors.push(this.state.toVector())

	}
	onGameStart() {}
	onTurnStart() {
		if (this.over) return
		let lastturn=this.thisturn
		this.thisturn = this.getNextTurn()

		this.thisPlayer().onTurnStart()
		this.map.onTurnStart(this.thisturn)
		this.pushSingleAction(
			new StateChangeAction(ACTION_TYPE.END_TURN, this.thisturn),
			new ActionTrace(ACTION_TYPE.TURN_START)
		)

		let pkg = new TurnStartActionBuilder(this, new ActionTrace(ACTION_TYPE.TURN_START), this.thisPlayer()).build()

		this.thisPlayer().clearPendingAction()
		this.pushActions(pkg)

		if (this.thisturn < lastturn) {
			this.totalturn += 1
			if (this.totalturn === 6) this.mediator.upgradePlayerAbility()
		}
		if (this.checkTurnEnd()) return
	}
	incrementTotalBet(amount: number) {
		this.totalBet += amount
	}
	runSimpleInstantAction(type: ACTION_TYPE) {
		if (type === ACTION_TYPE.REMOVE_BLACKHOLE) this.eventEmitter.removeBlackHole()
	}

	getDiceModifiers(source: ActionTrace, oddEven: number) {
		let dc = sample(this.thisPlayer().getDiceControlChance())
		let abilities = this.thisPlayer().sampleAbility(EVENT_TYPE.GENERATE_DICE_NUMBER, source)
		let isExactDc = false
		let isDouble = false
		let multiplier = 1
		let executed: ABILITY_NAME[] = [ABILITY_NAME.NONE, ABILITY_NAME.NONE, ABILITY_NAME.NONE, ABILITY_NAME.NONE]
		for (const name of abilities.keys()) {
			if (name === ABILITY_NAME.DICE_CONTROL_ACCURACY && dc) {
				isExactDc = true
				executed[0] = name
			}
			if (name === ABILITY_NAME.BACK_DICE) {
				multiplier *= -1
				executed[1] = name
			}
			if (name === ABILITY_NAME.MOVE_DOUBLE_ON_DICE) {
				multiplier *= 2
				executed[2] = name
			} //더블능력 두개중 하나만 발동함
			if (
				(name === ABILITY_NAME.DICE_DOUBLE || name === ABILITY_NAME.FIRST_TURN_DOUBLE) &&
				oddEven !== DiceNumberGenerator.ODD &&
				!isDouble
			) {
				executed[3] = name
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
	throwDice(target: number, oddeven: number, action: DiceChanceAction) {

		

		let modifiers = this.getDiceModifiers(action.source, oddeven)
		let multiplier = modifiers.multiplier
		let player = this.thisPlayer()
		if (oddeven > 0) player.useOddEven()

		const [dice1, dice2] = DiceNumberGenerator.generate(target, oddeven, modifiers)
		return this.onThrowDice(dice1, dice2, multiplier, modifiers.dc, action)
	}

	onThrowDice(dice1: number, dice2: number, multiplier: number, dc: boolean, action: DiceChanceAction) {
		let isDouble = dice1 === dice2 && action.type === ACTION_TYPE.DICE_CHANCE

		let player = this.thisPlayer()
		let isTripleDouble = false
		if (isDouble) {
			if (player.doubles >= 2) {
				isTripleDouble = true
				player.resetDoubleCount()
			} else {
				player.onDouble()

				this.pushSingleAction(new DiceChanceAction(this.thisturn), action.source)
			}
		}

		let distance = multiplier * (dice1 + dice2)
		let actions = new ThrowDiceActionBuilder(
			this,
			action.source,
			this.thisPlayer(),
			{
				dice: [dice1, dice2],
				isDouble: isDouble,
				dc: dc,
			},
			distance,
			isTripleDouble
		).build()

		this.pushActions(actions)
		return {
			dice: [dice1, dice2],
			isDouble: isDouble,
			dc: dc,
		}
	}

	requestMove(turn: number, pos: number, source: ActionTrace, moveType: MOVETYPE) {
		let player = this.mediator.pOfTurn(turn)

		// source.reset()
		if (moveType === MOVETYPE.FORCE_WALK) this.requestForceWalkMove(turn, pos, source)
		if (moveType === MOVETYPE.WALK || moveType === MOVETYPE.TRAVEL) this.requestWalkMove(turn, pos, source, moveType)
		if (moveType === MOVETYPE.TELEPORT || moveType === MOVETYPE.BLACKHOLE)
			this.pushSingleAction(new TeleportAction(turn, pos, moveType), source)
		if (moveType === MOVETYPE.PULL) this.requestPullMove(turn, pos, source)
	}
	createBlackHole(blackpos: number, whitepos: number) {
		this.eventEmitter.createBlackHole(blackpos, whitepos)
		this.map.removeBlackHole()
		this.map.setBlackHole(blackpos, whitepos)
	}
	/**
	 * 중간에 다른 영향으로 멈출수 있음(주사위,세계여행)
	 * @param pos
	 * @param dist
	 * @param turn
	 * @param source
	 * @returns updated distance
	 */
	requestWalkMove(turn: number, newpos: number, source: ActionTrace, movetype: MOVETYPE) {
		let pos = this.mediator.pOfTurn(turn).pos

		this.pushSingleAction(
			new MoveAction(ACTION_TYPE.WALK_MOVE, turn, pos, forwardDistance(pos, newpos), movetype),
			source
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
	requestForceWalkMove(moverTurn: number, newpos: number, source: ActionTrace) {
		let pos = this.mediator.pOfTurn(moverTurn).pos
		if (this.thisturn !== moverTurn) this.mediator.pOfTurn(moverTurn).clearPendingAction()

		this.pushSingleAction(
			new MoveAction(ACTION_TYPE.FORCE_WALK_MOVE, moverTurn, pos, forwardDistance(pos, newpos), MOVETYPE.FORCE_WALK),
			source
		)
	}

	/**
	 * 끌어당김으로 움직이는 경우
	 * @param moverTurn
	 * @param newpos
	 * @param source
	 */
	requestPullMove(moverTurn: number, newpos: number, source: ActionTrace) {
		let pos = this.mediator.pOfTurn(moverTurn).pos
		if (this.thisturn !== moverTurn) this.mediator.pOfTurn(moverTurn).clearPendingAction()

		source.reset().setName("pull")
		this.pushSingleAction(
			new MoveAction(ACTION_TYPE.FORCE_WALK_MOVE, moverTurn, pos, signedShortestDistance(pos, newpos), MOVETYPE.PULL),
			source
		)
	}
	checkWalkMoveBlock(newpos: number, player: MarblePlayer, source: ActionTrace, moveType: MOVETYPE): number {
		let override = false
		if (player.hasEffect("bubble_root")) {
			source.addTag(ActionTraceTag.BUBBLE_ROOT)
			this.clearPlayerEffect(player.turn, "bubble_root")
			newpos = player.pos
		}

		newpos = this.checkPassedTiles(player.pos, newpos, player, source, moveType)
		newpos = this.checkPassedPlayers(player.pos, newpos, player, source, moveType)

		//override = this.checkBlackHole(player, newpos, source)

		return newpos
	}
	checkTeleportBlock(player: MarblePlayer, pos: number, source: ActionTrace): number {
		let override = false
		if (player.hasEffect("bubble_root")) {
			this.clearPlayerEffect(player.turn, "bubble_root")
			source.addTag(ActionTraceTag.BUBBLE_ROOT)
			pos = player.pos
		}

		return pos
	}
	checkBlackHole(player: MarblePlayer, pos: number, source: ActionTrace): boolean {
		if (this.map.blackholeTile !== pos) return false

		this.pushActions(new ArriveBlackholeActionBuilder(this, source, player, pos, this.map.whiteholeTile).build())
		this.map.removeBlackHole()

		return true
	}
	/**
	 * 걸어서 이동(주사위,세계여행,힐링,포춘카드,끌어당김)
	 * @param turn
	 * @param distance
	 * @param source
	 */
	walkMovePlayer(turn: number, from: number, distance: number, source: ActionTrace, movetype: MOVETYPE) {
		let player = this.mediator.pOfTurn(turn)

		const newpos = this.checkWalkMoveBlock(forwardBy(from, distance), player, source, movetype)
		if (movetype === MOVETYPE.PULL) distance = signedShortestDistance(from, newpos)
		else distance = forwardDistance(from, newpos)

		this.eventEmitter.walkMovePlayer(turn, from, distance, movetype)
		player.moveBy(distance)

		this.onPlayerMove(player, newpos, source, movetype)

		return distance
		// this.arriveTile(newpos, turn, source)
	}
	/**
	 * 날아서 이동(3더블 무인도, 잘가북,라인이동)
	 * 플레이어/타일 지나쳤을때 효과 없음
	 * @param turn
	 * @param pos
	 * @param source
	 */
	teleportPlayer(turn: number, pos: number, source: ActionTrace, movetype: MOVETYPE) {
		let player = this.mediator.pOfTurn(turn)
		const newpos = this.checkTeleportBlock(player, pos, source)

		player.moveTo(newpos)

		if (this.thisturn !== turn) player.clearPendingAction()
		this.eventEmitter.teleportPlayer(turn, newpos, movetype)

		this.onPlayerMove(player, newpos, source, movetype)
	}

	onPlayerMove(player: MarblePlayer, newpos: number, source: ActionTrace, movetype: MOVETYPE) {
		let action = new ArriveTileAction(player.turn, newpos)
		this.pushSingleAction(action, source)

		//도착 안하면 arrivatileaction 취소
		if (
			this.mediator.checkPlayerMeet(player.turn, newpos, source, movetype) ||
			this.checkBlackHole(player, newpos, source)
		) {
			this.actionStack.findById(action.getId())?.off()
		}
	}
	attemptIslandEscape(paid: boolean, turn: number, source: ActionTrace, price: number) {
		let dice1 = randInt(6) + 1
		let dice2 = randInt(6) + 1
		let player = this.mediator.pOfTurn(turn)
		source.reset()
		let data = {
			dice: [dice1, dice2],
			dc: false,
			isDouble: dice1 === dice2,
		}
		if (paid) {
			this.mediator.payMoneyToBank(player, price)
		}
		if (paid || dice1 === dice2) {
			this.pushActions(new ThrowDiceActionBuilder(this, source, player, data, dice1 + dice2, false).build())
			player.escapeIsland()
		} else {
			this.pushSingleAction(new RollDiceAction(turn, data), source)
			player.stayOnIsland()
			if (player.shouldEscapeIsland()) {
				player.escapeIsland()
			} else {
				player.addPendingAction(
					new AskIslandAction(turn, player.money > this.ISLAND_ESCAPE_MONEY, this.ISLAND_ESCAPE_MONEY)
				)
			}
		}

		this.eventEmitter.throwDice(turn, data)
	}
	applyPlayerEffect(turn: number, effect: string) {
		this.mediator.pOfTurn(turn).applyEffect(effect)
		this.eventEmitter.setPlayerEffect(turn, effect, this.mediator.pOfTurn(turn).pos, true)
	}
	clearPlayerEffect(turn: number, effect: string) {
		this.mediator.pOfTurn(turn).clearEffect(effect)
		this.eventEmitter.setPlayerEffect(turn, effect, 0, false)
	}
	onPassOrArriveStartTile(player: MarblePlayer, source: ActionTrace) {
		this.pushActions(new PassOrArriveStartActionBuilder(this, source, player, this.SALARY).build())
		player.onPassStartTile()
	}
	onPassTravelTile(player: MarblePlayer, source: ActionTrace) {
		this.pushActions(new PassTravelActionBuilder(this, source, player).build())
	}
	checkPassedTiles(oldpos: number, newpos: number, mover: MarblePlayer, source: ActionTrace, type: MOVETYPE) {
		for (const tile of [...getTilesBewteen(oldpos, newpos), newpos]) {
			let block = this.map.onTilePass(this, tile, mover, source, type, tile === newpos)
			if (block) return backwardBy(tile, 1)
		}
		return newpos
	}
	checkPassedPlayers(oldpos: number, newpos: number, mover: MarblePlayer, source: ActionTrace, movetype: MOVETYPE) {
		for (const player of this.mediator.getPlayersBetween(oldpos, newpos)) {
			//	console.log(mover.turn + "pass" + player.turn)
			if (mover.turn === player.turn) continue
			let block = this.mediator.onPlayerPassOther(mover, player, oldpos, newpos, source, movetype)
			if (block) return player.pos
		}
		return newpos
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
			this.arriveOlympicTile(moverTurn, source)
		} else if (tile.type === TILE_TYPE.START) {
			this.arriveStartTile(moverTurn, source)
		} else if (tile.type === TILE_TYPE.SPECIAL) {
			if (this.map.name === "god_hand") {
				this.arriveGodHandSpecialTile(tile, moverTurn, source)
			}
		} else if (tile.type === TILE_TYPE.ISLAND) {
			this.arriveIslandTile(moverTurn, source)
		}
		//this.pushActions(new ActionPackage(this, source))
	}
	forceEndTurn(turn: number) {
		this.actionStack.removeByTurnExcludeType(turn, [ACTION_TYPE.END_TURN])
	}

	cancelDiceChances(turn: number) {
		this.mediator.pOfTurn(turn).resetDoubleCount()
		this.actionStack.removeByTurnAndType(turn, ACTION_TYPE.DICE_CHANCE)
		this.actionStack.removeByTurnAndType(turn, ACTION_TYPE.DICE_CHANCE_NO_DOUBLE)
	}
	getCardModifier(player: MarblePlayer, source: ActionTrace) {
		let abs = player.sampleAbility(EVENT_TYPE.DRAW_CARD, source)
		if (abs.has(ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD)) return ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD

		return ABILITY_NAME.NONE
	}

	drawCard(turn: number, affectingAbility: ABILITY_NAME, goldFortuneChance: number) {
		this.executeAbility([{ name: affectingAbility, turn: turn }])

		return FortuneCardRegistry.draw(goldFortuneChance, affectingAbility)
	}

	arriveCardTile(moverTurn: number, source: ActionTrace) {
		let player = this.mediator.pOfTurn(moverTurn)

		let card = this.drawCard(moverTurn, this.getCardModifier(player, source), player.getGoldFortuneChance())
		this.pushSingleAction(new ObtainCardAction(moverTurn, card), source)
	}
	executeCardCommand(invoker: number, card: CommandCard, source: ActionTrace) {
		// let source = new ActionSource(ACTION_SOURCE_TYPE.COMMAND_CARD)
		let currpos = this.mediator.pOfTurn(invoker).pos
		switch (card.name) {
			case CARD_NAME.GO_START:
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.start, MOVETYPE.FORCE_WALK), source)
				break
			case CARD_NAME.GO_OLYMPIC:
				if (this.map.olympicPos === -1) this.pushMessageAction(invoker, "forcemove_to_tile")
				else this.pushSingleAction(new RequestMoveAction(invoker, this.map.olympicPos, MOVETYPE.FORCE_WALK), source)
				break
			case CARD_NAME.OLYMPIC:
				this.arriveOlympicTile(invoker, source)
				break
			case CARD_NAME.GO_TRAVEL:
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.travel, MOVETYPE.FORCE_WALK), source)
				break
			case CARD_NAME.GO_ISLAND:
				this.pushSingleAction(new RequestMoveAction(invoker, this.map.island, MOVETYPE.TELEPORT), source)

				break
			case CARD_NAME.DONATE_LAND:
				let myTiles = this.map.getTiles(this.mediator.pOfTurn(invoker), TileFilter.MY_LAND().setNoLandMark())
				if (myTiles.length === 0) this.pushMessageAction(invoker, "donate_to_tile")
				else
					this.pushSingleAction(
						new TileSelectionAction(ACTION_TYPE.CHOOSE_DONATE_POSITION, invoker, myTiles, CARD_NAME.DONATE_LAND),
						source
					)
				break
			case CARD_NAME.GO_SPECIAL:
				let tiles = this.map.getTiles(this.mediator.pOfTurn(invoker), new TileFilter().setSpecialOnly())
				if (tiles.length === 0) this.pushMessageAction(invoker, "move_to_tile")
				else
					this.pushSingleAction(
						new MoveTileSelectionAction(invoker, tiles, MOVETYPE.FORCE_WALK, CARD_NAME.GO_SPECIAL),
						source
					)
				break
		}
	}
	private messageAction(turn: number, message: string) {
		return new SendMessageAction(turn, message)
	}
	private pushMessageAction(turn: number, message: string) {
		this.pushSingleAction(this.messageAction(turn, message), new ActionTrace(ACTION_TYPE.MESSAGE))
	}
	useAttackCard(turn: number, card: AttackCard, source: ActionTrace) {
		if (card.name === CARD_NAME.LAND_CHANGE) {
			let enemyTiles = this.map.getTiles(this.mediator.pOfTurn(turn), TileFilter.ENEMY_LAND().setNoLandMark())
			let myTiles = this.map.getTiles(this.mediator.pOfTurn(turn), TileFilter.MY_LAND().setNoLandMark())
			if (enemyTiles.length === 0 || myTiles.length === 0) this.pushMessageAction(turn, "attack_no_tile")
			else this.pushSingleAction(new LandSwapAction(turn, myTiles, enemyTiles), source)
		} else {
			let filter = TileFilter.ENEMY_LAND()

			if (card.name === CARD_NAME.EARTHQUAKE) filter.setNoLandMark().setLandTileOnly()
			else if (card.name === CARD_NAME.SELLOFF) filter.setNoLandMark()

			let targetTiles = this.map.getTiles(this.mediator.pOfTurn(turn), filter)

			if (targetTiles.length === 0) this.pushMessageAction(turn, "attack_no_tile")
			else
				this.pushSingleAction(
					new TileSelectionAction(ACTION_TYPE.CHOOSE_ATTACK_POSITION, turn, targetTiles, card.name),
					source
				)
		}
	}
	saveCard(turn: number, card: DefenceCard) {
		let ab = card.toAbility()
		if (ab === ABILITY_NAME.NONE) return
		this.mediator.pOfTurn(turn).saveCardAbility(ab)
		this.eventEmitter.setSavedCard(turn, card.name, card.level)
	}

	arriveIslandTile(moverTurn: number, source: ActionTrace) {
		this.cancelDiceChances(moverTurn)
		this.pushActions(new ArriveIslandActionBuilder(this, source, this.mediator.pOfTurn(moverTurn)).build())
	}
	arriveOlympicTile(moverTurn: number, source: ActionTrace) {
		let targetTiles = this.map.getTiles(this.mediator.pOfTurn(moverTurn), TileFilter.MY_LAND())
		if (targetTiles.length === 0) this.pushMessageAction(moverTurn, "choose_no_tile")
		else
			this.pushActions(
				new ArriveOlympicActionBuilder(this, source, this.mediator.pOfTurn(moverTurn), targetTiles).build()
			)
	}
	arriveTravelTile(moverTurn: number, source: ActionTrace) {
		this.cancelDiceChances(moverTurn)

		let player = this.mediator.pOfTurn(moverTurn)
		source = source.reset().addTag(ActionTraceTag.TRAVEL)

		this.pushActions(new ArriveTravelActionBuilder(this, source, player).build())
	}
	requestTravel(action: PrepareTravelAction) {
		let moverTurn = action.turn
		this.cancelDiceChances(moverTurn)

		let player = this.mediator.pOfTurn(moverTurn)
		let targetTiles = this.map.getTiles(player, new TileFilter().setExclude([this.map.travel, player.pos]))
		if (targetTiles.length === 0) return

		let source = action.source.reset().addTag(ActionTraceTag.TRAVEL)

		this.pushActions(new PrepareTravelActionBuilder(this, source, player, targetTiles).build())
	}
	arriveStartTile(moverTurn: number, source: ActionTrace) {
		this.pushActions(new ArriveStartActionBuilder(this, source, this.mediator.pOfTurn(moverTurn)).build())
	}
	arriveGodHandSpecialTile(tile: Tile, moverTurn: number, source: ActionTrace) {
		const tileLiftStart = 0
		this.pushSingleAction(new AskGodHandSpecialAction(moverTurn, true), source)
	}
	chooseGodHandSpecialBuild(moverTurn: number, source: ActionTrace) {
		let targetTiles = this.map.getTiles(
			this.mediator.pOfTurn(moverTurn),
			TileFilter.EMPTY_LANDTILE().setSameLineOnly(),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable().setSameLineOnly()
		)
		if (targetTiles.length === 0) this.pushMessageAction(moverTurn, "choose_no_tile")
		else
			this.pushSingleAction(
				new TileSelectionAction(ACTION_TYPE.CHOOSE_BUILD_POSITION, moverTurn, targetTiles, "godhand_special_build"),
				source
			)
	}
	chooseGodHandSpecialLiftTile(moverTurn: number, source: ActionTrace) {
		let targetTiles = this.map.getTiles(this.mediator.pOfTurn(moverTurn), new TileFilter().setSameLineOnly())
		if (targetTiles.length === 0) return
		this.pushSingleAction(
			new TileSelectionAction(
				ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT,
				moverTurn,
				targetTiles,
				"godhand_special_tile_lift"
			),
			source
		)
	}
	arriveBuildableTile(tile: BuildableTile, moverTurn: number, source: ActionTrace) {
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
	onSelectBuildPosition(turn: number, pos: number, source: ActionTrace) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile) return

		this.pushActions(new ActionPackage(source).addMain(this.getAskBuildAction(turn, tile, source)))
	}
	onSelectMovePosition(turn: number, pos: number, action: MoveTileSelectionAction) {
		this.pushSingleAction(new RequestMoveAction(turn, pos, action.moveType), action.source)
	}
	onBeforeAskMoveTile(sourceAction: MoveTileSelectionAction) {
		if (sourceAction instanceof MoveToPlayerSelectionAction) {
			let targets = sourceAction.targetPlayers
			sourceAction.setPositions(targets.map((turn) => this.mediator.pOfTurn(turn).pos))
		}
	}
	onSelectOlympicPosition(turn: number, pos: number, source: ActionTrace) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile) return
		this.map.setOlympic(pos)
		this.pushActions(new SelectOlympicActionBuilder(this, source, this.mediator.pOfTurn(turn), tile).build())
	}

	onSelectTileLiftPosition(turn: number, pos: number, source: ActionTrace) {
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
	onSelectAttackPosition(turn: number, pos: number, source: ActionTrace, name: string, pos2?: number) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile || !tile.owned()) return
		let tile2: BuildableTile | undefined = undefined

		if (pos2 && pos2 > -1) tile2 = this.map.buildableTileAt(pos2) //도시 체인지 전용

		this.mediator.attemptAttackTile(turn, tile, source, name, tile2)
	}
	onSelectDonatePosition(turn: number, pos: number, source: ActionTrace) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile || !tile.owned()) return
		this.eventEmitter.indicateDefence("change", pos)
		this.setLandOwner(tile, this.mediator.getRandomEnemy(turn))
	}
	onSelectBlackholePosition(turn: number, pos: number, action: TileSelectionAction) {
		if (action instanceof BlackholeTileSelectionAction)
			this.pushActions(
				new CreateBlackholeActionBuilder(
					this,
					action.source,
					this.mediator.pOfTurn(turn),
					pos,
					action.whitehole
				).build()
			)
		// this.pushSingleAction(new CreateBlackholeAction(turn,pos,action.whitehole),action.source)
	}
	onSelectBuyoutPosition(turn: number, pos: number, action: TileSelectionAction) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile) return
		this.mediator.claimBuyOut(turn, tile, action.source)
	}
	attackTile(action: TileAttackAction) {
		if (action.name === CARD_NAME.SELLOFF) {
			this.map.clearTile(action.tile)
			this.eventEmitter.indicateDefence("selloff", action.tile.position)
		}
		if (action.name === CARD_NAME.EARTHQUAKE) {
			this.map.removeOneBuild(action.tile)
			this.eventEmitter.indicateDefence("attack", action.tile.position)
		}
		if (action.name === CARD_NAME.PANDEMIC || action.name === CARD_NAME.BLACKOUT) {
			this.map.applyStatusEffect(action.tile, action.name, 5)
			this.eventEmitter.indicateDefence("attack", action.tile.position)
		}
		if (action.name === CARD_NAME.LAND_CHANGE && action.landChangeTile != null) {
			this.swapLand(action.landChangeTile, action.tile)
			this.eventEmitter.indicateDefence("change", action.landChangeTile.position)
			this.eventEmitter.indicateDefence("change", action.tile.position)
		}
	}
	getAskBuildAction(playerTurn: number, tile: BuildableTile, source: ActionTrace): Action {
		return new ChooseBuildActionBuilder(this, source, this.mediator.pOfTurn(playerTurn), tile).build().main[0]
	}
	pullPlayers(invoker: number, action: PullAction) {
		let players = this.mediator.getPlayersAt(action.targetTiles)
		for (const p of players) {
			if (p.turn === invoker) continue

			this.pushActions(
				new PullActionBuilder(this, action.source, this.mediator.pOfTurn(invoker), action.pos).setDefender(p).build()
			)
		}
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

	executeAbility(abilities:AbilityExecution[]) {
		for (const ab of abilities) {
			if (ab.name === ABILITY_NAME.NONE) continue
			this.mediator.executeAbility(ab.turn, ab.name)
			let data = this.mediator.pOfTurn(ab.turn).getAbilityStringOf(ab)
			if (!data) continue
			this.sendAbility(ab.turn, ab.name, data.name, data.desc, false)
		}
	}
	sendAbility(turn: number, name: ABILITY_NAME, itemName: string, desc: string, isblocked: boolean) {
		// console.log("sendability"+itemName)
		this.eventEmitter.ability(turn, name, itemName, desc, isblocked)
	}
	indicateBlockedAbility(abilities: AbilityExecution[]) {
		for (const ab of abilities) {
			let data = this.mediator.pOfTurn(ab.turn).getAbilityStringOf(ab)
			if (!data) continue
			this.eventEmitter.ability(ab.turn, ab.name, data.name, data.desc, true)
		}
	}
	addPendingAction(actions: Action[]) {
		actions.forEach((a) => {
			this.mediator.pOfTurn(a.turn).addPendingAction(a)
		})
	}
	pushActions(actions: ActionPackage | null) {
		if (!actions) return

		this.executeAbility(actions.executedAbilities)
		this.indicateBlockedAbility(actions.blockedAbilities)

		this.actionStack.pushAll(...actions.after)
		if (actions.blocksMain) {
			this.onActionBlock(actions.main[0])
		} else if (actions.shouldPutMainToPending) {
			this.addPendingAction(actions.main)
		} else {
			this.actionStack.pushAll(...actions.main)
		}
		// let befores=[]
		// for(const action of actions.before){
		// 	if(action instanceof InstantAction && action.priority===Action.PRIORITY_IMMEDIATE){
		// 		this.executeAction(action)
		// 	}
		// 	else befores.push(action)
		// }
		this.actionStack.pushAll(...actions.before)
		//this.actionStack.iterate()
	}
	useDefenceCard(turn: number, action: AskDefenceCardAction) {
		this.mediator.pOfTurn(turn).useCard()
		this.sendAbility(turn, action.cardname as ABILITY_NAME, "", "", action.willIgnored)

		this.eventEmitter.setSavedCard(turn, "", 0)

		if (action.willIgnored) {
			this.executeAbility([{ name: action.ignoredBy, turn: action.attacker }])
		} else {
			if (action instanceof AskTollDefenceCardAction) {
				this.eventEmitter.indicateDefence(action.cardname, this.mediator.pOfTurn(turn).pos)
				this.pushSingleAction(
					new ActionModifier(turn, action.toBlock, ActionModifier.TYPE_SET_VALUE, action.after),
					action.source
				)
			} else if (action instanceof AskAttackDefenceCardAction) {
				this.eventEmitter.indicateDefence(action.cardname, action.attackTargetTile)
				this.pushSingleAction(new ActionModifier(turn, action.toBlock, ActionModifier.TYPE_BLOCK), action.source)
			}
		}
		// this.actionStack.iterate()
	}

	pushSingleAction(action: Action, trace: ActionTrace) {
		if (action.type === ACTION_TYPE.GAMEOVER) {
			this.actionStack.removeByTurn(action.turn)
		}
		// if(action.priority===Action.PRIORITY_IMMEDIATE){
		// 	this.executeAction(action as InstantAction)
		// 	return
		// }

		this.actionStack.pushAll(action.setPrevActionTrace(trace))
		//this.actionStack.iterate()
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
	directBuild(player: number, builds: BUILDING[], pos: number, discount: number, source: ActionTrace) {
		if (builds.length === 0) return
		let tile = this.map.tileAt(pos)
		if (!(tile instanceof BuildableTile)) return
		let owner = this.mediator.players[player]

		if (tile.owner !== owner.turn) this.setLandOwner(tile, owner)

		let price = this.buildAt(tile, builds, player)
		this.mediator.payMoneyToBank(owner, price * discount)

		this.onBuild(owner, tile, builds, source, false)
	}
	/**
	 * 자동건설 : 뉴타운 니르바나 등
	 * @param player
	 * @param pos
	 * @param buildings
	 * @param source
	 * @returns
	 */
	autoBuild(turn: number, pos: number, buildings: BUILDING[], source: ActionTrace) {
		let player = this.mediator.pOfTurn(turn)

		if (buildings.length === 0) return
		let tile = this.map.tileAt(pos)

		if (!(tile instanceof BuildableTile)) return

		if (tile.owner !== turn) this.setLandOwner(tile, player)

		this.buildAt(tile, buildings, turn)
		this.onBuild(player, tile, buildings, source, true)
	}

	onBuild(player: MarblePlayer, tile: BuildableTile, builds: BUILDING[], source: ActionTrace, isAuto: boolean) {
		let action = new OnBuildActionBuilder(this, source, player, tile, builds, isAuto)
		this.pushActions(action.build())
		if (!action.indicateMainBuild) return
		this.eventEmitter.build(tile.position, builds, player.turn)
		this.eventEmitter.updateToll(tile.position, tile.getDisplayedToll(), tile.getMultiplier())
	}
	addMultiplierToTile(pos: number, count: number) {
		this.map.addSingleTileMultiplier(pos, count)
	}
	stealMultiplier(invoker: number, pos: number, dest: number) {
		this.map.stealMultiplier(this.mediator.pOfTurn(invoker), pos, dest)
	}
	modifyLand(pos: number, type: string, val: number) {
		if (type === "lock") {
			this.map.setMultiplierLock(pos)
			this.eventEmitter.modifyLand(pos, type, val)
		}
	}
	attemptDirectBuyout(buyer: number, pos: number, price: number, source: ActionTrace) {
		let tile = this.map.buildableTileAt(pos)
		if (!tile || tile.owner === -1) return
		this.mediator.attemptBuyOut(buyer, tile.owner, tile, price, source)
	}
	landBuyOut(buyer: MarblePlayer, landOwner: MarblePlayer, tile: BuildableTile) {
		this.setLandOwner(tile, buyer)
	}
	getOtherPlayerPositions(invoker: MarblePlayer): number[] {
		return this.mediator.getOtherPlayers(invoker.turn).map((p) => p.pos)
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

		this.eventEmitter.setLandOwner(tile2.position, invoker.turn)
		this.eventEmitter.setLandOwner(tile1.position, victim.turn)

		victim.ownedLands.add(tile1.position)
		invoker.ownedLands.add(tile2.position)

		this.checkMonopoly(tile2, invoker)
		this.checkMonopoly(tile1, victim)
	}
	setPositionOwner(pos: number, turn: number) {
		let tile = this.map.tileAt(pos)
		if (tile instanceof BuildableTile) this.setLandOwner(tile, this.mediator.pOfTurn(turn))
	}
	setLandOwner(tile: BuildableTile, player: MarblePlayer) {
		let originalOwner = tile.owner
		this.map.setLandOwner(tile, player.turn)

		if (originalOwner > -1) {
			this.mediator.pOfTurn(originalOwner).ownedLands.delete(tile.position)
		}
		this.eventEmitter.setLandOwner(tile.position, player.turn)

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
			invoker.addMonopolyChancePos(monopolyAlert.pos,monopolyAlert.type)
			this.eventEmitter.monopolyAlert(invoker.turn, monopolyAlert.type, monopolyAlert.pos)
			this.mediator.onMonopolyChance(invoker, monopolyAlert.pos)
		}
	}
	getPlayerWinScores(winner: number, multiplier: number) {
		return this.mediator.getPlayerBets(winner, multiplier).map((amt) => Math.floor(amt / 20000))
	}

	gameOverWithMonopoly(winner: number, monopoly: MONOPOLY) {
		this.over = true
		let mul = 2
		let winType="triple"
		if (monopoly === MONOPOLY.LINE) {
			mul = 3
			winType="line"
		}
		else if (monopoly === MONOPOLY.SIGHT) {
			mul = 5
			winType="sight"
		}
		let scores=this.getPlayerWinScores(winner, mul)
		let windata=new GameOverAction(winner,winType,scores)
		this.eventEmitter.gameOverWithMonopoly(winner, monopoly, scores, mul,this.getResultStat(windata))
		this.pushSingleAction(windata, new ActionTrace(ACTION_TYPE.EMPTY))
	}

	bankrupt(player: MarblePlayer) {
		// player.bankrupt()

		this.forceEndTurn(player.turn)

		this.eventEmitter.bankrupt(player.turn)
		this.bankruptPlayers.push(player.turn)
		let left = this.mediator.getNonRetiredPlayers()

		let toremove = this.map.onPlayerRetire(player)

		if (left.length === 1) this.gameoverWithBankrupt(left[0].turn)
	}
	gameoverWithBankrupt(winner: number) {
		let scores=this.getPlayerWinScores(winner, this.map.bankruptWinMultiplier)
		let windata=new GameOverAction(winner,"bankrupt",scores)
		this.eventEmitter.gameoverWithBankrupt(
			winner,scores,
			this.map.bankruptWinMultiplier,
			this.getResultStat(windata)
		)
		this.over = true
		this.pushSingleAction(windata, new ActionTrace(ACTION_TYPE.EMPTY))
	}
	getSimulationResultStat(windata:GameOverAction):GameResultStat{
		return {
			winner:windata.turn,
			winType:windata.winType,
			rewards:windata.rewards,
			totalturn:this.totalturn,
			stateVectors:this.getStateVectors(windata.rewards)
		}
	}
	getResultStat(windata:GameOverAction){
		let playerstats=this.mediator.players.map(p=>p.getResultStat())
		for(let i=0;i<playerstats.length;++i){
			if(i<windata.rewards.length)
				playerstats[i].score=windata.rewards[i]
		}
		
		return {
			winner:windata.turn,
			winType:windata.winType,
			totalturn:this.totalturn,
			map:this.map.name,
			isTeam:this.isTeam,
			version:1,
			players:playerstats,
			createdAt:null,updatedAt:null
		}
	}

	getStateVectors(rewards:number[]):number[][]{
		if(!this.saveStateVector)  return this.stateVectors
		let rew=rewards.slice(0,this.playerTotal).map(r=>roundToNearest(r/1000,-2))
		for(const vec of this.stateVectors){
			vec.push(this.totalturn,rew[0])
		}
		return this.stateVectors
	}
}

export { MarbleGame }
