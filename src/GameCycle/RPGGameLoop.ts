import { ProtoPlayer, randInt, PlayerType, sleep } from "../core/Util"
import { INIT_SKILL_RESULT } from "../data/enum"
import { ClientInputEventFormat, ServerGameEventFormat } from "../data/EventFormat"
import { Game } from "../Game"
import { GameEventObserver } from "../GameEventObserver"
import { GameSetting } from "../GameSetting"
import SETTINGS = require("../../res/globalsettings.json")
import { GameCycleState, ArriveSquare, WaitingSkill, GameInitializer } from "./RPGGameCycleState"
import { GAME_CYCLE } from "./StateEnum"

class EventResult {
	result: boolean
	state?: GameCycleState
	constructor(result: boolean, state?: GameCycleState) {
		this.result = result
		this.state = state
	}
}

class GameLoop {
	private idleTimeout: NodeJS.Timeout|null
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
		this.game.onGameStart()
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
		setting: ClientInputEventFormat.GameSetting,
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
				console.log("player added")
			} else if (p.type === PlayerType.AI) {
				game.addAI(
					team,
					p.champ,
					SETTINGS.characters[Number(p.champ)].name + "_Bot(" + String(game.totalnum + 1) + "P) "
				)
				console.log("computer added")
			}
			else{
				console.log("empty player discarded")
			}
		}
		game.onCreate()
		return new GameLoop(game)
	}
	setClientInterface(ci: GameEventObserver) {
		// this.game.eventEmitter = ci
		// this.game.entityMediator.eventEmitter = ci
		this.eventEmitter = ci
		this.game.setClientInterface(ci)
	}
	user_update<T>(turn: number, type: string, data: T) {
		this.game.user_update(turn, type, data)
		//console.log("user_update"+type)
	}
	user_storeComplete(data: ClientInputEventFormat.ItemBought) {
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
			this.eventEmitter.startTimeout(this.game.thisGameTurnToken(), SETTINGS.idleTimeout)

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
			this.eventEmitter.stopTimeout(this.game.thisGameTurnToken())
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
			let data: ServerGameEventFormat.DiceRoll|null = this.state.getData()
			// this.eventEmitter.rollDice(data)
			if(data)
				this.afterDice(data.actualdice)
		}
	}
	user_pressDice(dicenum: number, crypt_turn: string): ServerGameEventFormat.DiceRoll|null {
		//	console.log("user_pressDice")
		this.restartResetTimeout()
		if (this.state.crypt_turn !== crypt_turn) return null
		let result = this.state.onUserPressDice(dicenum)
		if (!result.state) return null

		this.setGameCycle(result.state)
		//this.idleTimeoutTurn = this.startTimeOut(this.state.getOnTimeout())
		let diceRoll: ServerGameEventFormat.DiceRoll|null = this.state.getData()
		if(diceRoll)
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
		console.log("afterDice3")
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
	async user_completePendingObs(info: ClientInputEventFormat.PendingObstacle, crypt_turn: string) {
		if (this.state == null || this.state.crypt_turn !== crypt_turn) return
		if (this.state.id === GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE) {
			let result = this.state.onUserCompletePendingObs(info)
			if (!result.state) return
			this.setGameCycle(result.state)
			await this.state.getPromise()
			this.nextGameCycle()
		} else {
			console.error("invalid user pendingobstacle input")
		}
	}
	async user_completePendingAction(info: ClientInputEventFormat.PendingAction, crypt_turn: string) {
		if (this.state == null || this.state.crypt_turn !== crypt_turn) return
		if (this.state.id === GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION) {
			let result = this.state.onUserCompletePendingAction(info)
			if (!result.state) return
			this.setGameCycle(result.state)
			await this.state.getPromise()
			this.nextGameCycle()
		} else {
			console.error("invalid user pendingaction input")
		}
		//this.setGameCycle(this.state.onUserCompletePendingAction(info))
	}
	user_clickNextturn(){
		if(this.state.id===GAME_CYCLE.SKILL.WAITING_SKILL)
			this.startNextTurn(false)
		else
			console.error("invalid nextturn input")
	}
	user_clickSkill(s: number, crypt_turn: string) {
		this.restartResetTimeout()
		if (this.state == null || this.state.crypt_turn !== crypt_turn) return
		let result = this.state.onUserClickSkill(s)
		if(!result) return null

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
		if (!result.state) return
		this.setGameCycle(result.state)
	}
	user_choseSkillTarget(target: number, crypt_turn: string) {
		if (this.state.crypt_turn !== crypt_turn) return
		let result = this.state.onUserChooseSkillTarget(target)
		if (!result.state) return
		this.setGameCycle(result.state)
	}

	user_choseSkillLocation(location: number, crypt_turn: string) {
		if (this.state.crypt_turn !== crypt_turn) return
		let result = this.state.onUserChooseSkillLocation(location)
		if (!result.state) return
		this.setGameCycle(result.state)
	}
	user_choseAreaSkillLocation(location: number, crypt_turn: string) {
		if (this.state.crypt_turn !== crypt_turn) return
		//	console.log("user_choseAreaSkillLocation" + crypt_turn)
		let result = this.state.onUserChooseAreaSkillLocation(location)
		if (!result.state) return
		this.setGameCycle(result.state)
	}
	getPlayerMessageHeader(turn: number): string {
		// console.log("chat "+message)
		if (!this.game) return ""
		this.restartResetTimeout()
		return this.game.getPlayerMessageHeader(turn)
	}
	getTurnInitializer() {
		return this.state.getTurnInitializer()
	}
	onGameover(isNormal: boolean) {
		//	console.log("gameover")
		this.gameOverCallBack(isNormal)
		if(this.resetTimeout)
			clearTimeout(this.resetTimeout)
	}
	onDestroy() {
		if (this.game != null) this.game.onDestroy()
		if (this.state != null) this.state.onDestroy()
		// this.game = null
		// this.state = null
		//	console.log("ondestroy"+this.game)
		if(this.idleTimeout)
			clearTimeout(this.idleTimeout)
		if(this.resetTimeout)
			clearTimeout(this.resetTimeout)
	}
}

export{GameLoop,EventResult}