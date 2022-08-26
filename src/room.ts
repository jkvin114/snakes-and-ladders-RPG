import SETTINGS = require("../res/globalsettings.json")
import { PlayerType, ProtoPlayer } from "./core/Util"
import { GameEventEmitter } from "./GameEventObserver";


abstract class Room {
	//simulation_total_count: number
	simulation_count: number
	// gameCycle: GameCycleState
	name: string
	hosting: number
	guestnum: number
	isTeam: boolean
	playerlist: ProtoPlayer[]
	teams: boolean[]
	
	//simulation: boolean
	instant: boolean
	map: number
	idleTimeout: NodeJS.Timeout
	connectionTimeout: NodeJS.Timeout
	connectionTimeoutTurn: number
	idleTimeoutTurn: number
	resetCallback:Function
	abstract user_message(turn:number,msg:string):string
	abstract getMapId():number
	abstract registerClientInterface(callback:GameEventEmitter):Room
	abstract registerSimulationClientInterface(callback:GameEventEmitter):Room
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
	}
	registerResetCallback(onreset:Function){
		this.resetCallback=onreset
		return this
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
		teams.forEach((t,i)=>this.playerlist[i].team=t)
	}
	user_reconnect(turn:number){

	}
	user_disconnect(turn:number){
		
	}
	reset() {
		// this.stopConnectionTimeout()
		// this.stopIdleTimeout()
		console.log(this.name + "has been reset")
		this.name = null
		
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = null
		this.instant = false
		this.map = 0
		if(this.resetCallback!=null)
			this.resetCallback()
	}
}

export { Room }
