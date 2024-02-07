import type { Socket } from "socket.io"
import { PlayerType, ProtoPlayer } from "../RPGGame/core/Util"
import { GameEventEmitter } from "../sockets/GameEventEmitter"
import { PlayerMatchingState } from "./PlayerMatchingState"
import { encrypt } from "../router/board/helpers"
import { SocketSession } from "../sockets/SocketSession"
import { BaseProtoPlayer } from "./BaseProtoPlayer"
import MarbleGameGRPCClient from "../grpc/marblegameclient"
import { MongoId } from "../mongodb/types"
import { UserGamePlay } from "../mongodb/UserGamePlaySchema"
import { use } from "passport"
import { Types } from "mongoose"
import { Logger } from "../logger"

import SETTINGS = require("./../../res/globalsettings.json")
interface UserInfo {
	id: MongoId
	username: string
	turn: number
}
interface GameReadyState{
	canStart:boolean
	ready:number
	total:number
}
abstract class Room {
	name: string
	hosting: number
	guestnum: number
	isTeam: boolean

	map: number
	private resetCallback: Function
	isGameStarted: boolean //true if matching is complete
	isGameRunning: boolean // true if game is up and running

	hostSessionId: string // session id of host user
	password: string
	isPublic: boolean
	isLoggedInUserOnly: boolean
	gametype: string
	private guestSockets: Map<number, Socket>
	private registeredUsers: UserInfo[]
	protected playerMatchingState: PlayerMatchingState
	private playerSessions: Set<string>
	private gameReadySessions: Set<string>

	abstract type: string
	abstract user_message(turn: number, msg: string): string
	abstract get getMapId(): number
	abstract registerClientInterface(callback: GameEventEmitter): Room
	abstract registerSimulationClientInterface(callback: GameEventEmitter): Room
	private resetTimeout: NodeJS.Timeout | null

	constructor(name: string) {
		this.name = name
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.map = 0
		this.playerSessions = new Set<string>()
		this.gameReadySessions = new Set<string>()
		this.guestSockets = new Map<number, Socket>()

		this.isGameStarted = false
		this.resetCallback = () => {}
		this.playerMatchingState = new PlayerMatchingState()
		this.hostSessionId = ""
		this.isPublic = true
		this.isLoggedInUserOnly = false
		this.password = ""
		this.gametype = "normal"

		//saves which loggedin users are playing this game. initialized when users request initial setting for game.
		this.registeredUsers = []

		
	}

	protected restartResetTimeout() {
		console.log("restartResetTimeout")
		if (this.resetTimeout != null) clearTimeout(this.resetTimeout)
		this.resetTimeout = setTimeout(() => {
			this.reset()
		}, SETTINGS.resetTimeout)
	}
	
	onUserInput(){
		this.restartResetTimeout()
	}

	setGameType(type: string) {
		this.gametype = type
		return this
	}
	setHost(id: string) {
		this.hostSessionId = id
		return this
	}
	setPassword(pw: string) {
		this.password = encrypt(pw, this.name)
	}
	setSettings(isLoggedInUserOnly: boolean, isPrivate: boolean) {
		this.isLoggedInUserOnly = isLoggedInUserOnly
		this.isPublic = !isPrivate
		console.log(this.isPublic)
	}
	registerResetCallback(onreset: Function) {
		this.resetCallback = onreset
		return this
	}
	addSession(id: string) {
		this.playerSessions.add(id)
	}
	hasSession(id: string) {
		return this.playerSessions.has(id)
	}
	deleteSession(id: string) {
		this.playerSessions.delete(id)
	}
	getPlayerList() {
		return this.playerMatchingState.playerlist
	}
	getChangedTurn(original: number) {
		return this.playerMatchingState.getTurnMapping(original)
	}
	/**
	 * called after the game is started and the user requests initial setting.
	 *
	 * @param userId
	 * @param username
	 * @param turn
	 */
	addRegisteredUser(turn: number, userId?: MongoId, username?: string) {
		if (!userId || !username) return
		this.registeredUsers.push({
			id: userId,
			username: username,
			turn: turn,
		})
	}

	get roomStatus() {
		return {
			name: this.name,
			running: this.isGameRunning,
			started: this.isGameStarted,
			playerlist: this.playerMatchingState.playerlist,
			hosting: this.hosting,
			type: this.type,
			password: this.password,
			loginonly: this.isLoggedInUserOnly,
			isPublic: this.isPublic,
			registeredUsers: this.registeredUsers,
		}
	}
	checkPassword(pw: string) {
		if (this.password === "") return true
		if (encrypt(pw, this.name) === this.password) return true
		return false
	}
	canJoinPublic(loggedin: boolean) {
		if (!loggedin && this.isLoggedInUserOnly) return false
		return this.hosting > 0 && this.isPublic
	}
	get roomSummary() {
		return {
			name: this.name,
			hosting: this.hosting,
			type: this.type,
			hasPassword: this.password !== "",
			loginonly: this.isLoggedInUserOnly,
		}
	}
	/**
	 * set types of all players
	 * @param {f} types string[]
	 */
	// setTypes(types: PlayerType[]) {
	// 	for (let i = 0; i < 4; ++i) {
	// 		this.playerlist[i].type = types[i]
	// 	}
	// }
	setTeamGame() {
		this.isTeam = true
	}
	unsetTeamGame() {
		this.isTeam = false
	}
	setSimulation(isSimulation: boolean) {
		if (isSimulation) {
			//	this.simulation = true
			// this.instant = true
		}

		return this
	}
	setHostNickname(name: string, turn: number, userClass: number) {
		this.playerMatchingState.setHostNickname(name, turn, userClass)
	}
	isHost(sessionId:string){
		return this.hostSessionId === sessionId
	}

	user_updatePlayerList(playerlist: BaseProtoPlayer[]) {
		this.playerMatchingState.setPlayerList(playerlist)
		this.hosting = this.playerMatchingState.getHostingCount()
	}

	user_updateReady(turn: number, ready: boolean) {
		this.playerMatchingState.setReady(turn, ready)
	}
	user_guestRegister(sessionId: string): boolean {
		if (this.playerMatchingState.getHostingCount() <= 0) {
			return false
		}
		this.addSession(sessionId)
		this.playerMatchingState.guestnum += 1
		return true
	}
	removeGuest(turn: number) {
		// this.deleteSession(sessionId)
		let socket = this.guestSockets.get(turn)
		if (socket) {
			SocketSession.removeGameSession(socket)
			this.deleteSession(SocketSession.getId(socket))
			Logger.log("remove guest from room ", this.name)
			SocketSession.print(socket)
			socket.leave(this.name)
		}
		this.guestSockets.delete(turn)

		this.playerMatchingState.guestnum -= 1
	}

	removePlayer(turn: number) {
		return this.playerMatchingState.removePlayer(turn)
	}
	addGuestToPlayerList(username: string, userClass: number, socket: Socket): number {
		let turn = this.playerMatchingState.addGuestToPlayerList(username, userClass)
		this.guestSockets.set(turn, socket)
		return turn
	}

	getPlayerNamesForTeamSelection(): { name: string; userClass: number }[] {
		return this.playerMatchingState.getPlayerNamesForTeamSelection()
	}
	user_updateChamp(turn: number, champ_id: number) {
		this.playerMatchingState.setChamp(turn, champ_id)
	}

	user_updateMap(map: number) {
		this.map = map
	}
	user_updateTeams(teams: boolean[]) {
		this.playerMatchingState.setTeams(teams)
	}
	onBeforeGameStart() {
		this.isGameStarted = true
	}
	/**
	 * called when a user is ready for game. 
	 * @param sessionId 
	 * @returns return true if all users are ready
	 */
	onUserGameReady(sessionId: string): GameReadyState {
		if (!this.playerSessions.has(sessionId)) return {
			total:0,ready:0,canStart:false
		}
		this.gameReadySessions.add(sessionId)
		return {
			total:this.playerSessions.size,
			ready: this.gameReadySessions.size,
			canStart:this.playerSessions.size === this.gameReadySessions.size
		}
	}
	/**
	 * save registered users' game play data to DB
	 * @param gameId
	 * @param type
	 * @param winner
	 */
	async onGameStatReady(gameId: MongoId, type: "RPG" | "MARBLE", winner: Set<number>) {
		for (const user of this.registeredUsers) {
			await UserGamePlay.create({
				user: user.id,
				game: gameId,
				type: type,
				username: user.username,
				turn: user.turn,
				isWon: winner.has(user.turn),
			})
		}
		Logger.log("save user gameplay data", this.name)
	}
	user_reconnect(turn: number) {}
	user_disconnect(turn: number) {}

	reset() {
		// this.stopConnectionTimeout()
		// this.stopIdleTimeout()
		Logger.log(this.name + "has been reset")
		// this.name = "DELETED_ROOM"
		this.playerSessions.clear()

		//if(this.idleTimeout) clearTimeout(this.idleTimeout)
		//	if(this.connectionTimeout) clearTimeout(this.connectionTimeout)
		if (this.resetCallback != null) this.resetCallback()
	}
}

export { Room }
