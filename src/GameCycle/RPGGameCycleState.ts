// import { this.clientInterface } from "../app"
import SETTINGS = require("../../res/globalsettings.json")

import type { Game } from "../Game"
import { GAME_CYCLE } from "./StateEnum"
import { ClientInputEventInterface, ServerGameEventInterface } from "../data/PayloadInterface"
import { ARRIVE_SQUARE_RESULT_TYPE, INIT_SKILL_RESULT } from "../data/enum"
import {sleep } from "../core/Util"
import { EventResult } from "./RPGGameLoop"

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
		this.crypt_turn = this.game.thisGameTurnToken()
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
	onUserClickSkill(skill: number): ServerGameEventInterface.SkillInit|null {
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
	onUserCompletePendingAction(info: ClientInputEventInterface.PendingAction): EventResult {
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
	getData<T>(): T|null {
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
		return ()=>{}
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
	turnUpdateData: ServerGameEventInterface.TurnStart|null
	constructor(game: Game) {
		let turnUpdateData = game.goNextTurn()
		super(game, TurnInitializer.id)
		this.turnUpdateData = turnUpdateData
		if(turnUpdateData)
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
		else {//if (this.turnUpdateData.stun) {
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
		this.result = this.game.arriveAtSquare(SETTINGS.delay_initial_arrive_square)
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
		if (this.result === ARRIVE_SQUARE_RESULT_TYPE.DEATH) {
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
			this.game.eventEmitter.sendPendingAction("pending_action:submarine", this.game.thisp().pos)
		}
		if (this.action === "ask_way2") {
			this.game.eventEmitter.sendPendingAction("pending_action:ask_way2", 0)
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
export {  GameCycleState,GameInitializer, TurnInitializer, WaitingDice, ThrowDice, ArriveSquare }
