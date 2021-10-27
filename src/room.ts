import { Game } from "./Game"
import SETTINGS = require("../res/settings.json")
import {
	updateNextTurn,
	syncVisibility,
	rollDice,
	startTimeout,
	stopTimeout,
	forceNextturn,
	sendPendingObs,
	setSkillReady,
	sendPendingAction,
	simulationOver
} from "./app"
import cliProgress = require("cli-progress")

type ProtoPlayer = { type: PlayerType; name: string; team: boolean; champ: number; ready: boolean }
enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai"
}

class Room {
	simulation_total_count: number
	simulation_count: number
	game: Game
	name: string
	hosting: number
	guestnum: number
	isTeam: boolean
	playerlist: ProtoPlayer[]
	teams: boolean[]
	simulation: boolean
	instant: boolean
	map: number
	stats: any[]
	idleTimeout: ReturnType<typeof setTimeout>
	connectionTimeout: ReturnType<typeof setTimeout>

	constructor(name: string) {
		this.simulation_total_count = 1
		this.simulation_count = 1
		this.game = null
		this.name = name
		this.teams = []
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = this.makePlayerList()
		this.simulation = false
		this.instant = false
		this.map = 0
		this.stats = []
		this.idleTimeout = null
		this.connectionTimeout = null
	}

	makePlayerList(): ProtoPlayer[] {
		let p = []
		for (let i = 0; i < 4; ++i) {
			p.push({
				type: PlayerType.EMPTY,
				name: i + 1 + "P",
				team: true,
				champ: 0,
				ready: false
			})
		}
		// p[0].card='player_connected'
		return p
	}
	/**
	 * set types of all players
	 * @param {f} types string[]
	 */
	setTypes(types: PlayerType[]) {
		for (let i = 0; i < 4; ++i) {
			this.playerlist[i].type = types[i]
		}
	}

	setSimulation(isSimulation: boolean) {
		if (isSimulation) {
			this.simulation = true
			this.instant = true
		}

		return this
	}
	setNickname(name: string, turn: number) {
		this.playerlist[turn].name = name
		return this
	}
	user_updatePlayerList(playerlist: any) {
		//기다리는 플레이어 숫자파악
		this.hosting = playerlist.reduce(function (num: number, val: any) {
			if (val.type === PlayerType.PLAYER) {
				num += 1
			}
			return num
		}, 0)

		// console.log("PLAYERLISTUPDATE hosting" + this.hosting)

		//턴바뀌는 일 감지용==========
		let turnchange = [-1, -1, -1, -1]
		for (let i = 0; i < 4; ++i) {
			//서버에 저장되있는 챔피언으로 변경함
			playerlist[i].champ = this.playerlist[i].champ
			if (playerlist[i].type !== PlayerType.EMPTY) {
				turnchange[i] = i
			}
		}
		//[-1 1 -1 3]
		turnchange.sort(function (a, b) {
			if (a === -1) {
				return 1
			}
			if (b === -1) {
				return -1
			}
			return 0
		})
		playerlist.sort(function (a: any, b: any) {
			if (a.type === PlayerType.EMPTY) {
				return 1
			}
			if (b.type === PlayerType.EMPTY) {
				return -1
			}
			return 0
		})
		playerlist.map(function (p: any) {
			if (p.type === PlayerType.EMPTY) {
				return {
					type: PlayerType.EMPTY,
					name: "",
					team: true,
					champ: 0,
					ready: false
				}
			}
		})

		this.playerlist = playerlist
		return turnchange
	}

	user_updateReady(turn: number, ready: boolean) {
		this.playerlist[turn].ready = ready
	}
	user_requestPlayers(nickname: string) {
		let turn = this.playerlist.findIndex((r) => r.type === PlayerType.PLAYER)
		this.playerlist[turn].type = PlayerType.PLAYER_CONNECED
		if (nickname !== "") {
			this.playerlist[turn].name = nickname
		}
		return turn
	}

	user_requestNames() {
		let names = []
		for (let i = 0; i < this.playerlist.length; ++i) {
			let n = this.playerlist[i].name
			if (this.playerlist[i].type === PlayerType.AI) {
				n = SETTINGS.champnames[Number(this.playerlist[i].champ)] + "_Bot(" + String(i + 1) + "P)"
			}

			names.push(n)
		}
		return names
	}
	user_updateChamp(turn: number, champ_id: number) {
		if (turn < 0) return
		this.playerlist[turn].champ = champ_id
	}

	user_updateMap(map: number) {
		this.map = map
	}
	user_updateTeams(teams: boolean[]) {
		this.teams = teams
	}
	user_gameReady(instant: boolean, simulation_count: number, roomName: string) {
		if (instant) {
			this.simulation = true
			this.simulation_count = simulation_count
			this.simulation_total_count = simulation_count
		}
		this.instant = instant

		// room.aichamplist=aichamplist
		// room.map=map
		console.log("instant" + this.instant)
		this.game = new Game(this.isTeam, this.map, roomName, this.simulation, instant)
		//console.log("simulation: "+room.simulation)
		for (let i = 0; i < this.playerlist.length; ++i) {
			// let champ=room.champ[i]
			let team = this.teams[i]
			if (team === null) team = null
			let p = this.playerlist[i]

			if (p.type === PlayerType.PLAYER_CONNECED) {
				this.game.addPlayer(team, p.champ, p.name)
			} else if (p.type === PlayerType.AI) {
				//시뮬레이션일시 첫번째 ai
				this.game.addAI(
					team,
					p.champ,
					SETTINGS.champnames[Number(p.champ)] + "_Bot(" + String(this.game.totalnum + 1) + "P) "
				)
			}
		}
	}
	user_requestSetting() {
		let setting = this.game.getInitialSetting()
		setting.simulation = this.simulation
		return setting
	}

	user_startGame() {
		let t = this.game.startTurn()
		if (this.simulation) {
			this.goNextTurn()
			return null
		}
		return t
	}
	goNextTurn() {
		this.stopIdleTimeout()

		let turnUpdateData = this.game.goNextTurn()

		updateNextTurn(this.name, turnUpdateData)

		if (this.game.thisturn === 0) {
			syncVisibility(this.name, this.game.getPlayerVisibilitySyncData())
		}

		if (turnUpdateData == null) return

		if (!turnUpdateData.ai && !turnUpdateData.stun) {
			let _this = this
			this.startIdleTimeout(function () {
				_this.goNextTurn()
			})
		}

		//컴퓨터일경우만 주사위 던짐
		if (turnUpdateData.ai && !turnUpdateData.stun) {
			console.log("ai roll dice")
			let dice = this.game.rollDice(-1)
			console.log("stun" + dice)

			if (this.simulation) {
				setTimeout(() => rollDice(this.name, dice), 150)
			} else {
				setTimeout(() => rollDice(this.name, dice), 500)
			}
		}
		// this.connection.to(this.name).emit('')
	}

	stopIdleTimeout() {
		console.log("stoptimeout")
		stopTimeout(this.name, this.game.thisturn)
		clearTimeout(this.idleTimeout)
	}
	startIdleTimeout(endaction: Function) {
		startTimeout(this.name, this.game.thisturn, SETTINGS.idleTimeout)
		console.log("start timeout")
		if (this.game.gameover) {
			return
		}
		let _this = this

		this.idleTimeout = setTimeout(function () {
			forceNextturn(_this.name, _this.game.thisturn)
			endaction()
		}, SETTINGS.idleTimeout)
	}

	stopConnectionTimeout() {
		console.log("stopConnectionTimeout")
		// stopTimeout(this.name, this.game.thisturn)
		clearTimeout(this.connectionTimeout)
	}
	startConnectionTimeout() {
		// startTimeout(this.name, this.game.thisturn,SETTINGS.connectionTimeout)
		console.log("startConnectionTimeout")
		if (this.game.gameover) {
			return
		}
		let _this = this
		this.connectionTimeout = setTimeout(function () {
			forceNextturn(_this.name, _this.game.thisturn)
			_this.goNextTurn()
		}, SETTINGS.connectionTimeout)
	}

	extendTimeout(turn: number) {
		if (turn !== this.game.thisturn) return
		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())

		console.log("timeout extension")
	}

	user_pressDice(dicenum: number) {
		this.stopIdleTimeout()
		this.startConnectionTimeout()
		return this.game.rollDice(dicenum)
	}
	user_arriveSquare(): number {
		let obs = this.game.checkObstacle()
		console.log("checkobs" + obs)

		if (obs === -7) {
			if (this.simulation_count <= 1) {
				this.stopConnectionTimeout()
				return this.game.thisturn
			}
		}
		return null
	}
	user_obstacleComplete() {
		console.log("obscomplete, pendingobs:" + this.game.pendingObs)
		this.stopConnectionTimeout()

		let info = this.game.checkPendingObs()

		if (!info) {
			if (this.game.players[this.game.thisturn].AI) {
				setTimeout(() => this.game.aiSkill(), 300)
				setTimeout(() => this.goNextTurn(), 800)

				console.log("ai go nextturn")
			} else {
				this.checkPendingAction()
			}
		} else {
			console.log("obscomplete, pendingobs:" + info)

			sendPendingObs(this.name, info.name, info.argument)

			let _this = this
			this.startIdleTimeout(function () {
				_this.game.processPendingObs(false)
				_this.goNextTurn()
			})
		}
	}

	checkPendingAction() {
		console.log("function checkpendingaction" + this.game.pendingAction)
		if (!this.game.pendingAction || this.game.p().dead) {
			setSkillReady(this.name, this.game.getSkillStatus())
			let _this = this
			this.startIdleTimeout(function () {
				_this.goNextTurn()
			})
		} else {
			if (this.game.pendingAction === "submarine") {
				sendPendingAction(this.name, "server:pending_action:submarine", this.game.p().pos)
			}
			if (this.game.pendingAction === "ask_way2") {
				sendPendingAction(this.name, "server:pending_action:ask_way2", null)
			}

			let _this = this
			this.startIdleTimeout(function () {
				_this.game.processPendingAction(false)
				_this.goNextTurn()
			})
		}
	}
	user_completePendingObs(info: any) {
		this.stopIdleTimeout()
		this.game.processPendingObs(info)
		this.checkPendingAction()
	}
	user_completePendingAction(info: any) {
		this.game.processPendingAction(info)
		this.stopIdleTimeout()
		setSkillReady(this.name, this.game.getSkillStatus())
	}

	user_clickSkill(s: number) {
		let result = this.game.initSkill(s - 1)
		console.log("getskill")
		console.log(result)

		this.stopIdleTimeout()

		// if (result.type === "targeting" || result.type === "projectile")
		this.startIdleTimeout(() => this.goNextTurn())

		return result
	}

	user_choseSkillTarget(target: any) {
		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())
		if (target === "canceled") {
			return null
		}
		return this.game.useSkillToTarget(target)
	}

	user_choseSkillLocation(location: any) {
		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())
		if (location === "canceled") {
			return
		}

		this.game.placeProj(location)
		return this.game.getSkillStatus()
	}

	user_storeComplete(data: any) {
		this.game.players[data.turn].updateItem(data)
	}

	doInstantSimulation() {
		let consolelog = console.log
		console.log = function () {}
		let game = this.game
		let repeat = this.simulation_total_count
		let playercount = game.players.length
		const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		bar1.start(repeat - 2, 0)
		let startTime: any = new Date()
		let i = 0

		for (i = 0; i < repeat - 1; ++i) {
			game.startTurn()

			let oneGame = true
			while (oneGame) {
				try {
					let obs = this.simulationNextturn(game)

					if (obs === -7) {
						oneGame = false
					} else {
						game.aiSkill()
					}
				} catch (e) {
					console.error(e)
					console.error(game.thisturn)
				}
			}
			//io.to(rname).emit("instant_num", repeat, i)
			bar1.update(i)

			console.log(
				"-----------------------------------------------------------------------------------------------------"
			)
			this.stats.push(this.game.getFinalStatistics())
			this.game = null
			this.game = new Game(this.isTeam, this.map, this.name, this.simulation, true)

			for (let i = 0; i < playercount; ++i) {
				// let champ=room.champ[i]
				let team = this.playerlist[i].team
				if (team === null) team = true
				let p = this.playerlist[i]

				this.game.addAI(
					team,
					p.champ,
					SETTINGS.champnames[Number(p.champ)] + "_Bot(" + String(this.game.totalnum + 1) + "P) "
				)
			}

			game = this.game
		}
		bar1.stop()
		let endTime: any = new Date()
		let timeDiff: any = endTime - startTime
		console.log = consolelog
		console.warn("total time:" + timeDiff + "ms, " + timeDiff / repeat + "ms per game")
		simulationOver(this.name)
	}

	simulationNextturn(game: Game) {
		game.goNextTurn()

		game.rollDice(-1)

		return game.checkObstacle()
	}
	reset() {
		console.log(this.name + "has been reset")
		this.name = null
		this.game = null
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = null
		this.simulation = false
		this.instant = false
		this.map = 0
		this.stats = []
		clearTimeout(this.idleTimeout)
		clearTimeout(this.connectionTimeout)
	}
}

export { Room }
