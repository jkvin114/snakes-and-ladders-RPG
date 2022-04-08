import { Game, GameSetting } from "./Game"
import SETTINGS = require("../res/globalsettings.json")
import { RoomClientInterface } from "./app"
import { Simulation, SimulationSetting } from "./SimulationRunner"
import { INIT_SKILL_RESULT, ITEM, SKILL_INIT_TYPE } from "./enum"
import { randInt } from "./Util"
import { ClientPayloadInterface, ServerPayloadInterface } from "./PayloadInterface"
import { GameCycleState } from "./GameCycle/GameCycleState"
const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./DBHandler")


enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai"
}

type ProtoPlayer = { type: PlayerType; name: string; team: boolean; champ: number; ready: boolean }

class Room {
	//simulation_total_count: number
	simulation_count: number
	game: Game
	name: string
	hosting: number
	guestnum: number
	isTeam: boolean
	playerlist: ProtoPlayer[]
	teams: boolean[]
	simulation: Simulation
	//simulation: boolean
	instant: boolean
	map: number
	idleTimeout: NodeJS.Timeout
	connectionTimeout: NodeJS.Timeout
	connectionTimeoutTurn: number
	idleTimeoutTurn: number
	gameCycle:GameCycleState
	

	constructor(name: string) {
		//	this.simulation_total_count = 1
		this.simulation_count = 1
		this.game = null
		this.name = name
		this.teams = []
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = this.makePlayerList()
		//	this.simulation = false
		this.instant = false
		this.map = 0
		this.idleTimeout = null
		this.idleTimeoutTurn = -1
		this.connectionTimeout = null
		this.connectionTimeoutTurn = -1
		this.simulation = null
		this.gameCycle
		
	}

	cryptTurn(turn: number) {
		return this.game.cryptTurn(turn)
	}
	thisCryptTurn() {
		return this.game.thisCryptTurn()
	}
	isThisTurn(cryptTurn: string) {
		//	console.log(this.turnEncryption.get(this.game.thisturn),cryptTurn)
		return this.game.isThisTurn(cryptTurn)
	}

	makePlayerList(): ProtoPlayer[] {
		let p = []
		for (let i = 0; i < 4; ++i) {
			p.push({
				type: PlayerType.EMPTY,
				name: i + 1 + "P",
				team: true,
				champ: -1,
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
	setTeamGame() {
		this.isTeam = true
	}
	unsetTeamGame() {
		this.isTeam = false
	}
	setSimulation(isSimulation: boolean) {
		if (isSimulation) {
			//	this.simulation = true
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
					champ: -1,
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
				if (this.playerlist[i].champ === -1) {
					n = "?_Bot(" + String(i + 1) + "P)"
				} else {
					n = SETTINGS.characters[Number(this.playerlist[i].champ)].name + "_Bot(" + String(i + 1) + "P)"
				}
			}

			names.push(n)
		}
		return names
	}
	user_updateChamp(turn: number, champ_id: number) {
		if (turn < 0) return
		console.log(turn)
		this.playerlist[turn].champ = champ_id
	}

	user_updateMap(map: number) {
		this.map = map
	}
	user_updateTeams(teams: boolean[]) {
		this.teams = teams
	}
	user_simulationReady(
		simulationsetting: ClientPayloadInterface.SimulationSetting,
		simulation_count: number,
		isTeam: boolean,
		runnerId: string
	) {
		let setting = new SimulationSetting(isTeam, simulationsetting)
		this.simulation = new Simulation(this.name, simulation_count, setting, runnerId)
		this.doInstantSimulation()
			.then(() =>{
				this.onSimulationOver(true)
			})
			.catch((e)=> {
				console.error(e)
				this.onSimulationOver(false)
			})
	}
	doInstantSimulation(): Promise<Function> {
		return new Promise((resolve, reject) => {
			this.simulation.run(function () {
				resolve(null)
				reject(new Error("Request is failed"))
			})
		})
	}

	user_gameReady(setting: ClientPayloadInterface.GameSetting, roomName: string) {
		this.instant = false

		// room.aichamplist=aichamplist
		// room.map=map
		console.log("team" + this.isTeam)
		this.game = new Game(this.map, roomName, new GameSetting(setting, false, this.isTeam))
		//console.log("simulation: "+room.simulation)
		for (let i = 0; i < this.playerlist.length; ++i) {
			// let champ=room.champ[i]
			let team = this.teams[i]
			//	if (team === null) team = null
			let p = this.playerlist[i]

			if (p.champ === -1) p.champ = randInt(SETTINGS.characters.length)

			if (p.type === PlayerType.PLAYER_CONNECED) {
				this.game.addPlayer(team, p.champ, p.name)
			} else if (p.type === PlayerType.AI) {
				//시뮬레이션일시 첫번째 ai
				this.game.addAI(
					team,
					p.champ,
					SETTINGS.characters[Number(p.champ)].name + "_Bot(" + String(this.game.totalnum + 1) + "P) "
				)
			}
		}
	}
	user_requestSetting():ServerPayloadInterface.initialSetting{
		let setting = this.game.getInitialSetting()
		//	setting.simulation = this.simulation
		return setting
	}

	user_startGame() {
		return this.game.startTurn()
	}
	goNextTurn() {
		this.stopIdleTimeout()

		let turnUpdateData = this.game.goNextTurn()
		// turnUpdateData.crypt_turn = this.thisCryptTurn()

		RoomClientInterface.updateNextTurn(this.name, turnUpdateData)

		if (this.game.thisturn === 0) {
			RoomClientInterface.syncVisibility(this.name, this.game.getPlayerVisibilitySyncData())
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
			let dice = this.game.rollDice(-1)
			

			setTimeout(() => {
				if (!this.game) return
				RoomClientInterface.rollDice(this.name, dice)
				this.afterDice(dice.actualdice)
			}, 500)
		} else if (turnUpdateData.stun) {
			this.manageStun()
		}
		// this.connection.to(this.name).emit('')
	}

	manageStun() {
		setTimeout(() => {
			if (!this.game) return
			this.user_arriveSquare()

			setTimeout(() => {
				if (!this.game) return
				this.user_obstacleComplete()
			}, 1000)
		}, 1000)
	}

	user_reconnect(turn: number) {
		console.log("reconnect" + turn)
		if (turn === this.connectionTimeoutTurn) {
			this.stopConnectionTimeout()
			console.log("reconnect" + turn)
		}
		if (turn === this.idleTimeoutTurn) {
			this.stopIdleTimeout()
			console.log("reconnect" + turn)
		}
	}
	stopIdleTimeout() {
		clearTimeout(this.idleTimeout)
		if (!this.game) return
		this.idleTimeoutTurn = -1
		RoomClientInterface.stopTimeout(this.name, this.thisCryptTurn())
	}
	startIdleTimeout(callback: Function) {
		RoomClientInterface.startTimeout(this.name, this.thisCryptTurn(), SETTINGS.idleTimeout)
		//	console.log("start timeout")
		if (this.game.gameover) {
			return
		}
		this.idleTimeout = setTimeout(() => {
			if (!this.game) return
			RoomClientInterface.forceNextturn(this.name, this.thisCryptTurn())
			callback()
		}, SETTINGS.idleTimeout)
		this.idleTimeoutTurn = this.game.thisturn
	}

	stopConnectionTimeout() {
		//	console.log("stopConnectionTimeout")
		this.connectionTimeoutTurn
		clearTimeout(this.connectionTimeout)
	}
	startConnectionTimeout() {
		//	console.log("startConnectionTimeout")
		if (this.game.gameover) {
			return
		}
		this.connectionTimeout = setTimeout(() => {
			if (!this.game) return
			RoomClientInterface.forceNextturn(this.name, this.thisCryptTurn())
			this.goNextTurn()
		}, SETTINGS.connectionTimeout)
		this.connectionTimeoutTurn = this.game.thisturn
	}

	extendTimeout(turn: number) {
		if (turn !== this.game.thisturn) return

		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())

		//	console.log("timeout extension"+turn)
	}
	onTimeOut(){
		this.gameCycle=this.gameCycle.onTimeout()
	}

	user_pressDice(dicenum: number,crypt_turn:string) {
		this.stopIdleTimeout()
		this.startConnectionTimeout()
		this.gameCycle=this.gameCycle.onUserPressDice(dicenum,crypt_turn)
		this.gameCycle.timeOut(this.onTimeOut)


		let data = this.game.rollDice(dicenum)
		// data.crypt_turn=this.thisCryptTurn()
		this.afterDice(data.actualdice)

		return data
	}

	afterDice(movedistance: number) {
		setTimeout(() => {
			if (!this.game) return
			this.user_arriveSquare()
			console.log("arrivesquare")

			setTimeout(() => {
				if (!this.game) return
				console.log("obscomplete")
				this.user_obstacleComplete()
			}, 700)
		}, 1300 + Math.abs(movedistance) * 100)
	}

	user_arriveSquare(): number {
		let obs = this.game.checkObstacle()
		//	console.log("checkobs" + obs)

		if (obs === -7) {
			this.stopConnectionTimeout()
			this.onGameover()
		}
		return null
	}

	user_obstacleComplete() {
		if (this.game == null) return
		//	console.log("obscomplete, pendingobs:" + this.game.pendingObs)
		this.stopConnectionTimeout()

		let info = this.game.checkPendingObs()

		if (!info) {
			if (this.game.thisp().AI) {
				this.game.aiSkill(()=>{
					if (!this.game) return
					this.goNextTurn()
				})
			} else {
				this.checkPendingAction()
			}
		} else {
			//	console.log("obscomplete, pendingobs:" + info)

			RoomClientInterface.sendPendingObs(this.name, info)

			this.startIdleTimeout(()=> {
				this.game.processPendingObs(null)
				this.goNextTurn()
			})
		}
	}

	checkPendingAction() {
		if (this.game == null) return
		let action=this.game.getPendingAction()
		//	console.log("function checkpendingaction" + this.game.pendingAction)
		if (!action || this.game.thisp().dead) {
			this.showSkillButtonToUser()
			this.startIdleTimeout( ()=> {
				this.goNextTurn()
			})
		} else {
			if (action === "submarine") {
				RoomClientInterface.sendPendingAction(this.name, "server:pending_action:submarine", this.game.thisp().pos)
			}
			if (action === "ask_way2") {
				RoomClientInterface.sendPendingAction(this.name, "server:pending_action:ask_way2", 0)
			}

			this.startIdleTimeout(()=> {
				this.game.processPendingAction(null)
				this.goNextTurn()
			})
		}
	}
	user_completePendingObs(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string) {
		if (this.game == null) return
		this.gameCycle=this.gameCycle.onUserCompletePendingObs(info,crypt_turn)

		this.stopIdleTimeout()
		this.game.processPendingObs(info)
		this.checkPendingAction()
	}
	user_completePendingAction(info: ClientPayloadInterface.PendingAction,crypt_turn:string) {
		if (this.game == null) return
		this.gameCycle=this.gameCycle.onUserCompletePendingAction(info,crypt_turn)
		this.game.processPendingAction(info)
		this.stopIdleTimeout()
		this.showSkillButtonToUser()
	}

	user_clickSkill(s: number,crypt_turn:string) {
		if (this.game == null) return
		this.gameCycle=this.gameCycle.onUserClickSkill(s,crypt_turn)

		let result = this.game.onSelectSkill(s - 1)
		//	console.log("getskill")
		//	console.log(result)
		if(result.type===INIT_SKILL_RESULT.NON_TARGET || result.type===INIT_SKILL_RESULT.ACTIVATION){
			this.showSkillButtonToUser()
		}
		this.stopIdleTimeout()

		// if (result.type === "targeting" || result.type === "projectile")
		this.startIdleTimeout(() => this.goNextTurn())

		// result.crypt_turn=this.thisCryptTurn()
		return result
	}
	showSkillButtonToUser(){
		let status=this.game.getSkillStatus()
		console.log(status)
		RoomClientInterface.setSkillReady(this.name,status )
	}

	user_basicAttack(crypt_turn:string){
		this.gameCycle=this.gameCycle.onUserBasicAttack(crypt_turn)
		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())
		this.game.thisp().basicAttack()
		
		this.showSkillButtonToUser()
	}
	user_choseSkillTarget(target: number,crypt_turn:string) {
		this.gameCycle=this.gameCycle.onUserChooseSkillTarget(target,crypt_turn)
		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())
		if (target > 0) {
			this.game.useSkillToTarget(target)
		}
		
		this.showSkillButtonToUser()
	}

	user_choseSkillLocation(location: number,crypt_turn:string) {
		this.gameCycle=this.gameCycle.onUserChooseSkillLocation(location,crypt_turn)

		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())
		if (location >0) {
			this.game.placeSkillProjectile(location)
		}
		this.showSkillButtonToUser()
	}
	user_choseAreaSkillLocation(location:number,crypt_turn:string){
		this.gameCycle=this.gameCycle.onUserchooseAreaSkillLocation(location,crypt_turn)

		this.stopIdleTimeout()
		this.startIdleTimeout(() => this.goNextTurn())
		if (location >0) {
			this.game.useAreaSkill(location)
		}
		this.showSkillButtonToUser()
	}

	user_storeComplete(data: ClientPayloadInterface.ItemBought) {
		if (this.game == null) return
		this.gameCycle.onUserStoreComplete(data)

		
	}
	onGameover() {
		let stat = this.game.getFinalStatistics()
		let winner = this.game.thisturn

		let rname = this.name
		this.reset()

		GameRecord.create(stat)
			.then((resolvedData: any) => {
				console.log("stat saved successfully")
				RoomClientInterface.gameStatReady(rname, resolvedData.id)
			})
			.catch((e: any) => console.error(e))

		RoomClientInterface.gameOver(rname, winner)
	}
	onSimulationOver(result: boolean) {
		let rname = this.name
		if (result) {
			let stat = this.simulation.getFinalStatistics()
			let simple_stat = this.simulation.getSimpleResults()
			this.reset()
			SimulationRecord.create(stat)
				.then((resolvedData: any) => {
					console.log("stat saved successfully")

					simple_stat.simulation = resolvedData.id

					SimpleSimulationRecord.create(simple_stat)
						.then((resolvedData: any) => {
							console.log("simple stat saved successfully")
						})
						.catch((e: any) => console.error(e))

					RoomClientInterface.simulationStatReady(rname, resolvedData.id)
				})
				.catch((e: any) => console.error(e))

			RoomClientInterface.simulationOver(rname, "success")
		} else {
			//error
			RoomClientInterface.simulationOver(rname, "error")
		}
	}

	reset() {
		this.stopConnectionTimeout()
		this.stopIdleTimeout()
		console.log(this.name + "has been reset")
		this.name = null
		this.game = null
		this.simulation = null
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = null
		this.instant = false
		this.map = 0
	}
}

export { Room }
