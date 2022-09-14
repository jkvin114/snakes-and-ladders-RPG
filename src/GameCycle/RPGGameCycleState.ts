// import { this.clientInterface } from "../app"
import SETTINGS = require("../../res/globalsettings.json")

import { Game } from "../Game"
import { GameSetting } from "../GameSetting"
import { GAME_CYCLE } from "./StateEnum"
import { ClientInputEventInterface, ServerGameEventInterface } from "../data/PayloadInterface"
import { ARRIVE_SQUARE_RESULT_TYPE, INIT_SKILL_RESULT } from "../data/enum"
import { PlayerType, ProtoPlayer, randInt, sleep } from "../core/Util"
import { GameEventObserver } from "../GameEventObserver"

class EventResult {
	result: boolean
	state?: GameCycleState
	constructor(result: boolean, state?: GameCycleState) {
		this.result = result
		this.state = state
	}
}

class GameLoop {
	private idleTimeout: NodeJS.Timeout
	game: Game
	private state: GameCycleState
	gameover: boolean
	readonly rname: string
	private idleTimeoutTurn: number
	private gameOverCallBack: Function
	private eventEmitter: GameEventObserver
	private resetTimeout: NodeJS.Timeout | null

	constructor(game: Game) {
		this.game = game
		this.gameover = false
		this.rname = this.game.rname
		this.gameOverCallBack
		this.idleTimeoutTurn = -1
		this.eventEmitter = new GameEventObserver(this.rname)
		this.restartResetTimeout()
	}
	setOnGameOver(gameOverCallBack: Function) {
		this.gameOverCallBack = gameOverCallBack
		return this
	}

	restartResetTimeout() {
		if (this.resetTimeout != null) clearTimeout(this.resetTimeout)
		this.resetTimeout = setTimeout(() => {
			this.onGameover(false)
		}, SETTINGS.resetTimeout)
	}

	startTurn() {
		this.setGameCycle(new GameInitializer(this.game))
		this.startNextTurn(false)
		return this
	}
	startSimulation() {
		this.setGameCycle(new GameInitializer(this.game))
		return this
	}
	/**
	 *
	 * @param cycle
	 * @returns should pass
	 */
	setGameCycle(cycle: GameCycleState): boolean {
		if (!this.game) return false
		if (!cycle) return false
		if (this.state != null) {
			this.state.onDestroy()
			if (this.state.shouldStopTimeoutOnDestroy()) this.stopTimeout()
		}
		this.state = cycle
		if (this.state.shouldPass()) {
			setTimeout(this.startNextTurn.bind(this), SETTINGS.delay_state_pass)
			return true
		}
		if (this.state.shouldStartTimeoutOnCreate()) {
			this.idleTimeoutTurn = this.startTimeOut(this.state.getOnTimeout())
		}

		//	console.log("thisgamecycle " + this.state.id)
		return false
	}
	nextGameCycle(): boolean {
		return this.setGameCycle(this.state.getNext())
	}
	static create(
		mapid: number,
		rname: string,
		setting: ClientInputEventInterface.GameSetting,
		instant: boolean,
		isTeam: boolean,
		playerlist: ProtoPlayer[]
	): GameLoop {
		return GameLoop.createWithSetting(mapid, rname, new GameSetting(setting, instant, isTeam), playerlist)
	}
	static createWithSetting(mapid: number, rname: string, setting: GameSetting, playerlist: ProtoPlayer[]): GameLoop {
		let game = new Game(mapid, rname, setting)
		for (let i = 0; i < playerlist.length; ++i) {
			let team = playerlist[i].team
			let p = playerlist[i]

			if (p.champ === -1) p.champ = randInt(SETTINGS.characters.length)

			if (p.type === PlayerType.PLAYER_CONNECED) {
				game.addPlayer(team, p.champ, p.name)
			} else if (p.type === PlayerType.AI) {
				game.addAI(
					team,
					p.champ,
					SETTINGS.characters[Number(p.champ)].name + "_Bot(" + String(game.totalnum + 1) + "P) "
				)
			}
		}
		return new GameLoop(game)
	}
	setClientInterface(ci: GameEventObserver) {
		this.game.eventEmitter = ci
		this.game.entityMediator.eventEmitter = ci
		this.eventEmitter = ci
	}
	user_update<T>(turn: number, type: string, data: T) {
		this.game.user_update(turn, type, data)
		//console.log("user_update"+type)
	}
	user_storeComplete(data: ClientInputEventInterface.ItemBought) {
		if (!this.game) return
		this.game.userCompleteStore(data)
	}
	user_reconnect(turn: number) {
		if (!this.game || !this.game.begun) return
		//console.log("reconnect" + turn)
		if (this.game.disconnectedPlayers.has(turn)) {
			this.eventEmitter.update("reconnect", turn, 0)
			this.game.disconnectedPlayers.delete(turn)
			this.restartResetTimeout()
		}
		if (turn === this.idleTimeoutTurn) {
			//this.stopTimeout()
			//	console.log("----------------------reconnect" + turn)
		}
	}
	user_disconnect(turn: number) {
		if (!this.game || !this.game.begun) return
		this.game.disconnectedPlayers.add(turn)
		this.eventEmitter.update("disconnect", turn, 0)
	}
	getOnTimeout() {
		return (() => {
			if (!this.game) return
			this.eventEmitter.forceNextturn(this.state.crypt_turn)
			this.startNextTurn(true)
		}).bind(this)
	}
	startTimeOut(additional: Function): number {
		if (!this.idleTimeout) {
			//	console.log("starttimeout" + this.state.turn)
			this.eventEmitter.startTimeout(this.game.thisCryptTurn(), SETTINGS.idleTimeout)

			this.idleTimeout = setTimeout(() => {
				if (!this.game) return
				this.eventEmitter.forceNextturn(this.state.crypt_turn)
				this.startNextTurn(true)
				if (additional != null) additional()
			}, SETTINGS.idleTimeout)
		}
		return this.game.thisturn
	}
	stopTimeout() {
		//console.log("stoptimeout" + this.state.turn)
		if (this.idleTimeout != null && this.state != null && this.idleTimeoutTurn === this.state.turn) {
			this.eventEmitter.stopTimeout(this.game.thisCryptTurn())
			clearTimeout(this.idleTimeout)
			this.idleTimeout = null
		}
	}
	async startNextTurn(isTimeout: boolean) {
		if (!this.game) return
		this.stopTimeout()
		this.setGameCycle(this.state.getTurnTerminator())
		await sleep(SETTINGS.delay_next_turn)
		if (!this.game) return
		this.setGameCycle(this.state.getTurnInitializer())
		this.nextGameCycle()
		//	console.log("nextturn" + this.state.id)
		if (this.state.id === GAME_CYCLE.BEFORE_OBS.ROOTED) {
			this.afterDice(0)
		} else if (this.state.id === GAME_CYCLE.BEFORE_OBS.AI_THROW_DICE) {
			let data: ServerGameEventInterface.DiceRoll = this.state.getData()
			this.eventEmitter.rollDice(data)
			this.afterDice(data.actualdice)
		}
	}
	user_pressDice(dicenum: number, crypt_turn: string): ServerGameEventInterface.DiceRoll {
		//	console.log("user_pressDice")
		this.restartResetTimeout()
		if (this.state.crypt_turn !== crypt_turn) return null
		let result = this.state.onUserPressDice(dicenum)
		if (!result.result) return null

		this.setGameCycle(result.state)
		//this.idleTimeoutTurn = this.startTimeOut(this.state.getOnTimeout())
		let diceRoll: ServerGameEventInterface.DiceRoll = this.state.getData()
		this.afterDice(diceRoll.actualdice)
		return diceRoll
	}
	async afterDice(movedistance: number) {
		await sleep(SETTINGS.delay_on_dice + Math.abs(movedistance) * SETTINGS.delay_per_dice)
		//	console.log("afterDice   " + movedistance)
		if (!this.game) return
		this.nextGameCycle()
		if (this.state.gameover) {
			this.onGameover(true)
			return
		}
		//	console.log("afterDice2")

		if (!(this.state instanceof ArriveSquare)) {
			this.startNextTurn(false)
			console.error("invalid game cycle state, should be ArriveSquare but received" + this.state.id)
			return
		}

		await this.state.getPromise()
		if (!this.game) return
		//	console.log("afterDice3")
		if (this.nextGameCycle()) return

		if (this.state instanceof WaitingSkill) {
		} else if (this.state.id === GAME_CYCLE.SKILL.AI_SKILL) {
			await this.state.getPromise()
			if (!this.game) return
			this.startNextTurn(false)
		} else if (
			this.state.id === GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE ||
			this.state.id === GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION
		) {
		} else {
			this.startNextTurn(false)
		}
	}
	async user_completePendingObs(info: ClientInputEventInterface.PendingObstacle, crypt_turn: string) {
		if (this.state == null || this.state.crypt_turn !== crypt_turn) return
		if (this.state.id === GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE) {
			let result = this.state.onUserCompletePendingObs(info)
			if (!result.result) return
			this.setGameCycle(result.state)
			await this.state.getPromise()
			this.nextGameCycle()
		} else {
			console.error("invalid user pendingobstacle input")
		}
	}
	async user_completePendingAction(info: ClientInputEventInterface.PendingAction, crypt_turn: string) {
		if (this.state == null || this.state.crypt_turn !== crypt_turn) return
		if (this.state.id === GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION) {
			let result = this.state.onUserCompletePendingAction(info)
			if (!result.result) return
			this.setGameCycle(result.state)
			await this.state.getPromise()
			this.nextGameCycle()
		} else {
			console.error("invalid user pendingaction input")
		}
		//this.setGameCycle(this.state.onUserCompletePendingAction(info))
	}

	user_clickSkill(s: number, crypt_turn: string) {
		this.restartResetTimeout()
		if (this.state == null || this.state.crypt_turn !== crypt_turn) return
		let result: ServerGameEventInterface.SkillInit = this.state.onUserClickSkill(s)
		if (
			!(
				result.type === INIT_SKILL_RESULT.NO_COOL ||
				result.type === INIT_SKILL_RESULT.NOT_LEARNED ||
				result.type === INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			)
		) {
			this.nextGameCycle()
		}

		return result
	}
	user_basicAttack(crypt_turn: string) {
		this.restartResetTimeout()
		if (this.state.crypt_turn !== crypt_turn) return
		let result = this.state.onUserBasicAttack()
		if (!result.result) return
		this.setGameCycle(result.state)
	}
	user_choseSkillTarget(target: number, crypt_turn: string) {
		if (this.state.crypt_turn !== crypt_turn) return
		let result = this.state.onUserChooseSkillTarget(target)
		if (!result.result) return
		this.setGameCycle(result.state)
	}

	user_choseSkillLocation(location: number, crypt_turn: string) {
		if (this.state.crypt_turn !== crypt_turn) return
		let result = this.state.onUserChooseSkillLocation(location)
		if (!result.result) return
		this.setGameCycle(result.state)
	}
	user_choseAreaSkillLocation(location: number, crypt_turn: string) {
		if (this.state.crypt_turn !== crypt_turn) return
		//	console.log("user_choseAreaSkillLocation" + crypt_turn)
		let result = this.state.onUserChooseAreaSkillLocation(location)
		if (!result.result) return
		this.setGameCycle(result.state)
	}
	getPlayerMessageHeader(turn: number): string {
		// console.log("chat "+message)
		if (!this.game) return
		this.restartResetTimeout()
		return this.game.getPlayerMessageHeader(turn)
	}
	getTurnInitializer() {
		return this.state.getTurnInitializer()
	}
	onGameover(isNormal: boolean) {
		//	console.log("gameover")
		this.gameOverCallBack(isNormal)
		clearTimeout(this.resetTimeout)
	}
	onDestroy() {
		if (this.game != null) this.game.onDestroy()
		if (this.state != null) this.state.onDestroy()
		this.game = null
		this.state = null
		//	console.log("ondestroy"+this.game)
		clearTimeout(this.idleTimeout)
	}
}

abstract class GameCycleState {
	readonly turn: number
	readonly crypt_turn: string
	readonly rname: string
	abstract onCreate(): void
	readonly id: number
	game: Game
	gameover: boolean
	constructor(game: Game, id: number) {
		this.id = id
		this.gameover = false
		this.game = game
		this.game.setCycle(id)
		this.turn = this.game.thisturn
		this.crypt_turn = this.game.thisCryptTurn()
		this.rname = this.game.rname
		// this.idleTimeout = null
		this.onCreate()
		//	console.log("gamecycle" + id)
	}
	onDestroy() {
		//	console.log("gamecycle ondestroy" + this.id)
	}
	shouldStopTimeoutOnDestroy() {
		return false
	}
	shouldStartTimeoutOnCreate() {
		return false
	}
	shouldPass() {
		return false
	}
	onUserPressDice(dicenum: number): EventResult {
		console.error("invalid request, id:" + this.id)
		return new EventResult(false)
	}
	onUserClickSkill(skill: number): ServerGameEventInterface.SkillInit {
		console.error("invalid request, id:" + this.id)

		return null
	}
	onUserBasicAttack(): EventResult {
		console.error("invalid request, id:" + this.id)

		return new EventResult(false)
	}
	onUserChooseSkillTarget(target: number): EventResult {
		console.error("invalid request, id:" + this.id)

		return new EventResult(false)
	}
	onUserChooseSkillLocation(location: number): EventResult {
		console.error("invalid request, id:" + this.id)

		return new EventResult(false)
	}
	onUserChooseAreaSkillLocation(location: number): EventResult {
		console.error("invalid request, id:" + this.id)

		return new EventResult(false)
	}

	onUserCompletePendingObs(info: ClientInputEventInterface.PendingObstacle): EventResult {
		console.error("invalid request, state id:" + this.id)

		return new EventResult(false)
	}
	onUserCompletePendingAction(info: ClientInputEventInterface.PendingObstacle): EventResult {
		console.error("invalid request, state id:" + this.id)

		return new EventResult(false)
	}

	onTimeout(): GameCycleState {
		return new TurnInitializer(this.game)
	}
	getNext(): GameCycleState {
		console.error("invalid request, state id:" + this.id)

		return this
	}
	getData<T>(): T {
		console.error("invalid data request, state id:" + this.id)

		return null
	}
	getTurnInitializer() {
		this.onDestroy()
		return new TurnInitializer(this.game)
	}
	getTurnTerminator() {
		this.onDestroy()
		return new TurnTerminator(this.game)
	}
	getOnTimeout(): Function {
		return null
	}
	getPromise(): Promise<unknown> {
		console.error("this state doesn`t have a promise, state id:" + this.id)
		return sleep(0)
	}
	process() {}
}
class GameInitializer extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_START
	constructor(game: Game) {
		super(game, GameInitializer.id)
	}
	onCreate(): void {}
	getNext(): GameCycleState {
		return new TurnInitializer(this.game)
	}
}

class TurnInitializer extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.INITIALIZE
	turnUpdateData: ServerGameEventInterface.TurnStart
	constructor(game: Game) {
		let turnUpdateData = game.goNextTurn()
		super(game, TurnInitializer.id)
		this.turnUpdateData = turnUpdateData
		this.game.eventEmitter.updateNextTurn(turnUpdateData)
	}
	onCreate(): void {
		if (this.game.thisturn === 0) {
			this.game.eventEmitter.syncVisibility(this.game.getPlayerVisibilitySyncData())
		}
		// if(!this.turnUpdateData) return
	}
	getNext(): GameCycleState {
		if (this.turnUpdateData == null) return this

		this.onDestroy()
		if (!this.turnUpdateData.ai && !this.turnUpdateData.stun) {
			return new WaitingDice(this.game)
		}
		if (this.turnUpdateData.ai && !this.turnUpdateData.stun) {
			return new AiThrowDice(this.game)
		}
		if (this.turnUpdateData.stun) {
			return new RootedHandler(this.game)
		}
	}
}
class RootedHandler extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.ROOTED
	constructor(game: Game) {
		super(game, RootedHandler.id)
	}
	onCreate(): void {}
	getNext(): GameCycleState {
		this.onDestroy()
		return new ArriveSquare(this.game)
	}
}
class WaitingDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.WAITING_DICE
	constructor(game: Game) {
		super(game, WaitingDice.id)
	}
	shouldStopTimeoutOnDestroy() {
		return true
	}
	shouldStartTimeoutOnCreate() {
		return true
	}
	onCreate(): void {}
	onUserPressDice(dicenum: number): EventResult {
		let data = this.game.rollDice(dicenum)
		this.onDestroy()
		return new EventResult(true, new ThrowDice(this.game, data))
	}
}
class ThrowDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.THROW_DICE
	diceData: ServerGameEventInterface.DiceRoll
	constructor(game: Game, diceData: ServerGameEventInterface.DiceRoll) {
		super(game, ThrowDice.id)
		this.diceData = diceData
	}

	getData<T>(): T {
		return this.diceData as unknown as T
	}
	onCreate(): void {}
	getNext(): GameCycleState {
		return new ArriveSquare(this.game)
	}
}
class ArriveSquare extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.ARRIVE_SQUARE
	result: number

	constructor(game: Game) {
		super(game, ArriveSquare.id)
	}
	onCreate(): void {
		this.result = this.game.checkObstacle(SETTINGS.delay_initial_arrive_square)
		if (this.result === ARRIVE_SQUARE_RESULT_TYPE.FINISH) {
			//	console.log("game finished")
			this.gameover = true
		}
	}
	getNext(): GameCycleState {
		this.onDestroy()
		if (this.game.thisp().AI) {
			if (this.game.instant) {
				return new AiSimulationSkill(this.game)
			} else {
				return new AiSkill(this.game)
			}
		} else {
			let obs = this.game.checkPendingObs()
			if (!obs || this.game.thisp().dead) {
				let action = this.game.getPendingAction()
				if (!action || this.game.thisp().dead) {
					return new WaitingSkill(this.game)
				}
				return new PendingAction(this.game, action)
			}
			return new PendingObstacle(this.game, obs)
		}
	}
	getData<T>(): T {
		return this.result as unknown as T
	}
	getPromise(): Promise<unknown> {
		if (this.result === ARRIVE_SQUARE_RESULT_TYPE.NONE) {
			return sleep(500)
		}
		return new Promise<void>((resolve) => {
			this.game.arriveSquareCallback = resolve
		})
	}
}
class AiThrowDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.AI_THROW_DICE
	dice: ServerGameEventInterface.DiceRoll
	constructor(game: Game) {
		super(game, AiThrowDice.id)
	}
	onCreate(): void {
		this.dice = this.game.rollDice(-1)
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new ArriveSquare(this.game)
	}
	getData<T>(): T {
		return this.dice as unknown as T
	}
}

class AiSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.AI_SKILL
	constructor(game: Game) {
		super(game, AiSkill.id)
	}
	onCreate(): void {}
	// useSkill(): Promise<unknown> {

	// }
	getPromise(): Promise<unknown> {
		return new Promise((resolve) => {
			this.game.aiSkill(resolve)
		})
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new TurnTerminator(this.game)
	}
}
class AiSimulationSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.AI_SKILL
	constructor(game: Game) {
		super(game, AiSkill.id)
	}
	onCreate(): void {}
	process() {
		this.game.simulationAiSkill()
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new TurnTerminator(this.game)
	}
}

class PendingObstacle extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE
	obs: ServerGameEventInterface.PendingObstacle
	result: ClientInputEventInterface.PendingObstacle
	constructor(game: Game, obs: ServerGameEventInterface.PendingObstacle) {
		super(game, PendingObstacle.id)
		this.obs = obs
		this.game.eventEmitter.sendPendingObs(this.obs)
	}
	shouldStopTimeoutOnDestroy() {
		return true
	}
	shouldStartTimeoutOnCreate() {
		return true
	}
	onCreate(): void {}
	getOnTimeout(): () => void {
		return () => this.game.processPendingObs(null)
	}
	onUserCompletePendingObs(info: ClientInputEventInterface.PendingObstacle): EventResult {
		this.result = info
		return new EventResult(true, this.getNext())
	}
	getNext(): GameCycleState {
		return new PendingObstacleProgress(this.game, this.result)
	}
}
class PendingObstacleProgress extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE_PROGRESS
	result: ClientInputEventInterface.PendingObstacle
	constructor(game: Game, result: ClientInputEventInterface.PendingObstacle) {
		super(game, PendingObstacleProgress.id)
		this.result = result
		this.process()
	}
	onCreate(): void {}
	process() {
		this.game.processPendingObs(this.result, SETTINGS.delay_initial_pending_action)
	}
	getPromise(): Promise<unknown> {
		//	console.log(this.result)
		if (!this.result.complete) return sleep(0)

		return new Promise<void>((resolve) => {
			this.game.arriveSquareCallback = resolve
		})
	}
	getNext(): GameCycleState {
		let action = this.game.getPendingAction()

		this.onDestroy()
		if (!action || this.game.thisp().dead) {
			return new WaitingSkill(this.game)
		} else {
			return new PendingAction(this.game, action)
		}
	}
}
class PendingAction extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION
	action: string
	result: ClientInputEventInterface.PendingAction
	constructor(game: Game, action: string) {
		super(game, PendingAction.id)
		this.action = action
		this.send()
	}
	shouldStopTimeoutOnDestroy() {
		return true
	}
	shouldStartTimeoutOnCreate() {
		return true
	}
	getOnTimeout(): () => void {
		return () => this.game.processPendingAction(null)
	}
	onCreate(): void {}
	send() {
		if (this.action === "submarine") {
			this.game.eventEmitter.sendPendingAction("server:pending_action:submarine", this.game.thisp().pos)
		}
		if (this.action === "ask_way2") {
			this.game.eventEmitter.sendPendingAction("server:pending_action:ask_way2", 0)
		}
	}
	onUserCompletePendingAction(info: ClientInputEventInterface.PendingAction): EventResult {
		this.result = info
		return new EventResult(true, this.getNext())
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new PendingActionProgress(this.game, this.result)
	}
}

class PendingActionProgress extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE_PROGRESS
	result: ClientInputEventInterface.PendingAction
	constructor(game: Game, result: ClientInputEventInterface.PendingAction) {
		super(game, PendingActionProgress.id)
		this.result = result
		this.process()
	}
	process() {
		this.game.processPendingAction(this.result, SETTINGS.delay_initial_pending_action)
	}
	onCreate(): void {}
	getPromise(): Promise<unknown> {
		//		console.log(this.result)

		if (!this.result.complete) return sleep(0)

		return new Promise<void>((resolve) => {
			this.game.arriveSquareCallback = resolve
		})
	}
	getNext(): GameCycleState {
		//	console.log(this.game.pendingObs)
		let obs = this.game.checkPendingObs()
		//	console.log("pendingobs"+obs)
		if (!obs || this.game.thisp().dead) {
			return new WaitingSkill(this.game)
		} else {
			return new PendingObstacle(this.game, obs)
		}
	}
}
export class WaitingSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.WAITING_SKILL
	canUseSkill: boolean
	canUseBasicAttack: boolean
	skillInit: ServerGameEventInterface.SkillInit
	constructor(game: Game) {
		super(game, WaitingSkill.id)
	}
	shouldStopTimeoutOnDestroy() {
		return true
	}
	shouldStartTimeoutOnCreate() {
		return true
	}
	onCreate(): void {
		let status = this.game.getSkillStatus()
		this.canUseSkill = status.canUseSkill
		this.canUseBasicAttack = status.canBasicAttack

		if (!this.shouldPass()) this.game.eventEmitter.setSkillReady(status)
	}
	shouldPass() {
		//	console.log("shouldpass", this.canUseSkill, this.canUseBasicAttack)
		return !this.canUseSkill && !this.canUseBasicAttack
	}
	onUserClickSkill(skill: number): ServerGameEventInterface.SkillInit {
		this.skillInit = this.game.onSelectSkill(skill - 1)
		return this.skillInit
	}
	onUserBasicAttack(): EventResult {
		this.game.thisp().basicAttack()
		this.onDestroy()
		return new EventResult(true, new WaitingSkill(this.game))
	}
	getNext(): GameCycleState {
		if (this.shouldPass()) return this

		switch (this.skillInit.type) {
			case INIT_SKILL_RESULT.NO_COOL:
			case INIT_SKILL_RESULT.NOT_LEARNED:
			case INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE:
				return this
			case INIT_SKILL_RESULT.NON_TARGET:
			case INIT_SKILL_RESULT.ACTIVATION:
				this.onDestroy()
				return new WaitingSkill(this.game)
			case INIT_SKILL_RESULT.TARGTING:
				this.onDestroy()
				return new WaitingTarget(this.game, this.skillInit)
			case INIT_SKILL_RESULT.PROJECTILE:
				this.onDestroy()
				return new WaitingLocation(this.game, this.skillInit)
			case INIT_SKILL_RESULT.AREA_TARGET:
				this.onDestroy()
				return new WaitingAreaTarget(this.game, this.skillInit)
			default:
				return this
		}
	}
}
abstract class WaitingSkillResult extends GameCycleState {
	initSkillResult: ServerGameEventInterface.SkillInit
	constructor(game: Game, id: number, result: ServerGameEventInterface.SkillInit) {
		super(game, id)
		this.initSkillResult = result
	}
	shouldStopTimeoutOnDestroy() {
		return true
	}
	shouldStartTimeoutOnCreate() {
		return true
	}
}

class WaitingTarget extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_TARGET

	constructor(game: Game, result: ServerGameEventInterface.SkillInit) {
		super(game, WaitingTarget.id, result)
	}
	onCreate(): void {}
	onUserChooseSkillTarget(target: number): EventResult {
		if (target >= 0) {
			this.game.useSkillToTarget(target)
		}
		this.onDestroy()
		return new EventResult(true, new WaitingSkill(this.game))
	}
}
class WaitingLocation extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_LOCATION

	constructor(game: Game, result: ServerGameEventInterface.SkillInit) {
		super(game, WaitingLocation.id, result)
	}
	onCreate(): void {}
	onUserChooseSkillLocation(location: number): EventResult {
		if (location > 0) {
			this.game.placeSkillProjectile(location)
		}
		this.onDestroy()
		return new EventResult(true, new WaitingSkill(this.game))
	}
}
class WaitingAreaTarget extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_AREA_TARGET

	constructor(game: Game, result: ServerGameEventInterface.SkillInit) {
		super(game, WaitingAreaTarget.id, result)
	}
	onCreate(): void {}
	onUserChooseAreaSkillLocation(location: number): EventResult {
		if (location > 0) {
			this.game.useAreaSkill(location)
		}
		this.onDestroy()
		return new EventResult(true, new WaitingSkill(this.game))
	}
}
class TurnTerminator extends GameCycleState {
	static id = GAME_CYCLE.TURN_END

	constructor(game: Game) {
		super(game, TurnTerminator.id)
	}
	onCreate(): void {
		this.game.onTurnEnd()
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new TurnInitializer(this.game)
	}
}
export { PendingObstacle, PendingAction }
export { AiThrowDice, AiSkill, AiSimulationSkill }
export { GameLoop, GameCycleState, TurnInitializer, WaitingDice, ThrowDice, ArriveSquare }
