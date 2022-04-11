import {ArriveSquare, GameCycleState, GameInitializer, TurnInitializer ,PendingObstacle,WaitingSkill,AiSkill} from "./GameCycle/GameCycleState"
import SETTINGS = require("../res/globalsettings.json")
import { Simulation, SimulationSetting } from "./SimulationRunner"
import { INIT_SKILL_RESULT, ITEM, SKILL_INIT_TYPE } from "./enum"
import { PlayerType, ProtoPlayer, randInt, sleep } from "./Util"
import { ClientPayloadInterface, ServerPayloadInterface } from "./PayloadInterface"
import { GAME_CYCLE } from "./GameCycle/StateEnum"
import { RoomClientInterface } from "./app"
const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./DBHandler")



class Room {
	//simulation_total_count: number
	simulation_count: number
	// gameCycle: GameCycleState
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
		// this.game = null
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
		return this.gameCycle.game.cryptTurn(turn)
	}
	thisCryptTurn() {
		return this.gameCycle.game.thisCryptTurn()
	}
	isThisTurn(cryptTurn: string) {
		//	console.log(this.turnEncryption.get(this.game.thisturn),cryptTurn)
		return this.gameCycle.game.isThisTurn(cryptTurn)
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
	getMapId(){
		return this.gameCycle.game.mapId
	}
	user_gameReady(setting: ClientPayloadInterface.GameSetting, roomName: string) {
		this.instant = false

		// room.aichamplist=aichamplist
		// room.map=map
		this.gameCycle=GameInitializer.create(this.map, roomName,setting, false, this.isTeam,this.playerlist)
		console.log("team" + this.isTeam)
		
	}
	user_requestSetting():ServerPayloadInterface.initialSetting{
		let setting = this.gameCycle.game.getInitialSetting()
		//	setting.simulation = this.simulation
		return setting
	}

	setGameCycle(cycle:GameCycleState){
		if(this.gameCycle!=null)
			this.gameCycle.onDestroy()
		this.gameCycle=cycle
	}
	nextGameCycle(){
		this.gameCycle=this.gameCycle.getNext()
	}
	/**
	 * 
	 * @returns test if all players are connected
	 */
	user_startGame() :boolean{
		let canstart= this.gameCycle.game.canStart()
		if(!canstart) return false
		else if(!this.gameCycle.game.begun) this.goNextTurn()
		return true
	}
	goNextTurn() {
		console.log("nextturn")
		this.setGameCycle(new TurnInitializer(this.gameCycle.game).getNext())
		if(this.gameCycle.id===GAME_CYCLE.BEFORE_OBS.WAITING_DICE){
			this.idleTimeoutTurn=this.gameCycle.timeOut(this.onTimeOut)
		}
		else if(this.gameCycle.id===GAME_CYCLE.BEFORE_OBS.STUN){
			this.afterDice(0)
		}
		else if(this.gameCycle.id===GAME_CYCLE.BEFORE_OBS.AI_THROW_DICE){
			let data:ServerPayloadInterface.DiceRoll=this.gameCycle.getData()
			RoomClientInterface.rollDice(this.name, data)
			this.afterDice(data.actualdice)
		}
		// let turnUpdateData = (this.gameCycle as TurnInitializer).turnUpdateData
		// turnUpdateData.crypt_turn = this.thisCryptTurn()

		// RoomClientInterface.updateNextTurn(this.name, turnUpdateData)

		// if (this.game.thisturn === 0) {
		// 	RoomClientInterface.syncVisibility(this.name, this.game.getPlayerVisibilitySyncData())
		// }

		// if (turnUpdateData == null) return

		// if (!turnUpdateData.ai && !turnUpdateData.stun) {
		// }

		// //컴퓨터일경우만 주사위 던짐
		// if (turnUpdateData.ai && !turnUpdateData.stun) {
		// 	let dice = this.game.rollDice(-1)
			

		// 	setTimeout(() => {
		// 		if (!this.game) return
		// 		RoomClientInterface.rollDice(this.name, dice)
		// 		this.afterDice(dice.actualdice)
		// 	}, 500)
		// } else if (turnUpdateData.stun) {
		// 	this.manageStun()
		// }
		// this.connection.to(this.name).emit('')
	}

	
	// manageStun() {
	// 	setTimeout(() => {
	// 		if (!this.game) return
	// 		this.user_arriveSquare()

	// 		setTimeout(() => {
	// 			if (!this.game) return
	// 			this.user_obstacleComplete()
	// 		}, 1000)
	// 	}, 1000)
	// }

	user_reconnect(turn: number) {
		console.log("reconnect" + turn)
		// if (turn === this.connectionTimeoutTurn) {
		// //	this.stopConnectionTimeout()
		// 	console.log("reconnect" + turn)
		// }
		if (turn === this.idleTimeoutTurn) {
			this.gameCycle.clear()
			console.log("reconnect" + turn)
		}
	}
	// stopIdleTimeout() {
	// 	clearTimeout(this.idleTimeout)
	// 	if (!this.game) return
	// 	this.idleTimeoutTurn = -1
	// 	RoomClientInterface.stopTimeout(this.name, this.thisCryptTurn())
	// }
	// startIdleTimeout(callback: Function) {
	// 	RoomClientInterface.startTimeout(this.name, this.thisCryptTurn(), SETTINGS.idleTimeout)
	// 	//	console.log("start timeout")
	// 	if (this.game.gameover) {
	// 		return
	// 	}
	// 	this.idleTimeout = setTimeout(() => {
	// 		if (!this.game) return
	// 		RoomClientInterface.forceNextturn(this.name, this.thisCryptTurn())
	// 		callback()
	// 	}, SETTINGS.idleTimeout)
	// 	this.idleTimeoutTurn = this.game.thisturn
	// }

	// stopConnectionTimeout() {
	// 	//	console.log("stopConnectionTimeout")
	// 	this.connectionTimeoutTurn
	// 	clearTimeout(this.connectionTimeout)
	// }
	// startConnectionTimeout() {
	// 	//	console.log("startConnectionTimeout")
	// 	if (this.game.gameover) {
	// 		return
	// 	}
	// 	this.connectionTimeout = setTimeout(() => {
	// 		if (!this.game) return
	// 		RoomClientInterface.forceNextturn(this.name, this.thisCryptTurn())
	// 		this.goNextTurn()
	// 	}, SETTINGS.connectionTimeout)
	// 	this.connectionTimeoutTurn = this.game.thisturn
	// }

	// extendTimeout(turn: number) {
	// 	if (turn !== this.game.thisturn) return

	// 	this.stopIdleTimeout()
	// 	this.startIdleTimeout(() => this.goNextTurn())

	// 	//	console.log("timeout extension"+turn)
	// }
	onTimeOut(){
		RoomClientInterface.forceNextturn(this.name, this.gameCycle.crypt_turn)
		this.setGameCycle(this.gameCycle.onTimeout())
	}

	user_pressDice(dicenum: number,crypt_turn:string):ServerPayloadInterface.DiceRoll {
		// this.stopIdleTimeout()
		// this.startConnectionTimeout()
		console.log("user_pressDice")

		this.gameCycle=this.gameCycle.onUserPressDice(dicenum,crypt_turn)
		this.idleTimeoutTurn=this.gameCycle.timeOut(this.onTimeOut)
		let diceRoll:ServerPayloadInterface.DiceRoll=this.gameCycle.getData()
		this.afterDice(diceRoll.actualdice)
		return diceRoll

		// let data = this.game.rollDice(dicenum)
		// // data.crypt_turn=this.thisCryptTurn()
		// this.afterDice(data.actualdice)

		// return data
	}

	async afterDice(movedistance: number) {
		

		await sleep(1300 + Math.abs(movedistance) * 100)
		console.log("afterDice   "+movedistance)

		this.nextGameCycle()
		if(this.gameCycle.gameover){
			this.onGameover()
			return
		}
		console.log("afterDice2")

		if(!(this.gameCycle instanceof ArriveSquare)) return
		
		await this.gameCycle.getArriveSquarePromise()
		console.log("afterDice3")
		this.nextGameCycle()

		if(this.gameCycle instanceof WaitingSkill){
			if(this.gameCycle.shouldPass()){
				await sleep(1000)
				this.goNextTurn()
				return
			}
			this.gameCycle.timeOut(this.onTimeOut)
		}
		else if(this.gameCycle instanceof AiSkill){
			await this.gameCycle.useSkill()
			this.goNextTurn()
		}
		else if(this.gameCycle.id===GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE || this.gameCycle.id===GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION){
			this.gameCycle.timeOut(this.onTimeOut)
		}
	}

	// user_arriveSquare(): number {
	// 	let obs = this.game.checkObstacle()
	// 	//	console.log("checkobs" + obs)

	// 	if (obs === -7) {
	// 		this.stopConnectionTimeout()
	// 		this.onGameover()
	// 	}
	// 	return null
	// }

	// user_obstacleComplete() {
	// 	if (this.game == null) return
	// 	//	console.log("obscomplete, pendingobs:" + this.game.pendingObs)
	// 	this.stopConnectionTimeout()

	// 	let info = this.game.checkPendingObs()

	// 	if (!info) {
	// 		if (this.game.thisp().AI) {
	// 			this.game.aiSkill(()=>{
	// 				if (!this.game) return
	// 				this.goNextTurn()
	// 			})
	// 		} else {
	// 			this.checkPendingAction()
	// 		}
	// 	} else {
	// 		//	console.log("obscomplete, pendingobs:" + info)

	// 		RoomClientInterface.sendPendingObs(this.name, info)

	// 		this.startIdleTimeout(()=> {
	// 			this.game.processPendingObs(null)
	// 			this.goNextTurn()
	// 		})
	// 	}
	// }

	// checkPendingAction() {
	// 	if (this.gameCycle == null) return
	// 	let action=this.game.getPendingAction()
	// 	//	console.log("function checkpendingaction" + this.game.pendingAction)
	// 	if (!action || this.game.thisp().dead) {
	// 		this.showSkillButtonToUser()
	// 		this.startIdleTimeout( ()=> {
	// 			this.goNextTurn()
	// 		})
	// 	} else {
	// 		if (action === "submarine") {
	// 			RoomClientInterface.sendPendingAction(this.name, "server:pending_action:submarine", this.game.thisp().pos)
	// 		}
	// 		if (action === "ask_way2") {
	// 			RoomClientInterface.sendPendingAction(this.name, "server:pending_action:ask_way2", 0)
	// 		}

	// 		this.startIdleTimeout(()=> {
	// 			this.game.processPendingAction(null)
	// 			this.goNextTurn()
	// 		})
	// 	}
	// }
	user_completePendingObs(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string) {
		if (this.gameCycle == null) return
		this.gameCycle=this.gameCycle.onUserCompletePendingObs(info,crypt_turn)

		// this.stopIdleTimeout()
		// this.game.processPendingObs(info)
		// this.checkPendingAction()
	}
	user_completePendingAction(info: ClientPayloadInterface.PendingAction,crypt_turn:string) {
		if (this.gameCycle == null) return
		this.gameCycle=this.gameCycle.onUserCompletePendingAction(info,crypt_turn)
		// this.game.processPendingAction(info)
		// this.stopIdleTimeout()
		// this.showSkillButtonToUser()
	}

	user_clickSkill(s: number,crypt_turn:string) {
		if (this.gameCycle == null) return
		let result:ServerPayloadInterface.SkillInit=this.gameCycle.onUserClickSkill(s,crypt_turn)
		this.nextGameCycle()
		return result

		// let result = this.game.onSelectSkill(s - 1)
		// //	console.log("getskill")
		// //	console.log(result)
		// if(result.type===INIT_SKILL_RESULT.NON_TARGET || result.type===INIT_SKILL_RESULT.ACTIVATION){
		// 	this.showSkillButtonToUser()
		// }
		// this.stopIdleTimeout()

		// // if (result.type === "targeting" || result.type === "projectile")
		// this.startIdleTimeout(() => this.goNextTurn())

		// result.crypt_turn=this.thisCryptTurn()
	}
	showSkillButtonToUser(){
		// let status=this.game.getSkillStatus()
		// console.log(status)
		// RoomClientInterface.setSkillReady(this.name,status )
	}

	user_basicAttack(crypt_turn:string){
		this.gameCycle=this.gameCycle.onUserBasicAttack(crypt_turn)
		// this.stopIdleTimeout()
		// this.startIdleTimeout(() => this.goNextTurn())
		// this.game.thisp().basicAttack()
		
		// this.showSkillButtonToUser()
	}
	user_choseSkillTarget(target: number,crypt_turn:string) {
		this.gameCycle=this.gameCycle.onUserChooseSkillTarget(target,crypt_turn)
		// this.stopIdleTimeout()
		// this.startIdleTimeout(() => this.goNextTurn())
		// if (target > 0) {
		// 	this.game.useSkillToTarget(target)
		// }
		
		// this.showSkillButtonToUser()
	}

	user_choseSkillLocation(location: number,crypt_turn:string) {
		this.gameCycle=this.gameCycle.onUserChooseSkillLocation(location,crypt_turn)

		// this.stopIdleTimeout()
		// this.startIdleTimeout(() => this.goNextTurn())
		// if (location >0) {
		// 	this.game.placeSkillProjectile(location)
		// }
		// this.showSkillButtonToUser()
	}
	user_choseAreaSkillLocation(location:number,crypt_turn:string){
		console.log("user_choseAreaSkillLocation"+crypt_turn)
		this.gameCycle=this.gameCycle.onUserChooseAreaSkillLocation(location,crypt_turn)

		// this.stopIdleTimeout()
		// this.startIdleTimeout(() => this.goNextTurn())
		// if (location >0) {
		// 	this.game.useAreaSkill(location)
		// }
		// this.showSkillButtonToUser()
	}

	user_storeComplete(data: ClientPayloadInterface.ItemBought) {
		if (this.gameCycle == null) return
		this.gameCycle.onUserStoreComplete(data)
	}
	user_message(turn:number,message:string){
		return this.gameCycle.game.pOfTurn(Number(turn)).name +
			"(" +
			SETTINGS.characters[this.gameCycle.game.pOfTurn(Number(turn)).champ].name +
			")",
		message
	}
	onGameover() {
		let stat = this.gameCycle.game.getFinalStatistics()
		let winner = this.gameCycle.game.thisturn

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
		// this.stopConnectionTimeout()
		// this.stopIdleTimeout()
		console.log(this.name + "has been reset")
		this.name = null
		this.setGameCycle(null)
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
