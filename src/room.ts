import { PlayerType, ProtoPlayer } from "./core/Util"
import { GameEventEmitter } from "./GameEventObserver";
import {PlayerMatchingState} from "./PlayerMatchingState"
abstract class Room {
	//simulation_total_count: number
	simulation_count: number
	// gameCycle: GameCycleState
	name: string
	hosting: number
	guestnum: number
	isTeam: boolean
	//playerlist: ProtoPlayer[]
	teams: boolean[]
	
	//simulation: boolean
	instant: boolean
	map: number
	idleTimeout: NodeJS.Timeout|null
	connectionTimeout: NodeJS.Timeout|null
	connectionTimeoutTurn: number
	idleTimeoutTurn: number
	resetCallback:Function
	isGameStarted:boolean //true if matching is complete
	isGameRunning:boolean // true if game is up and running
	protected playerMatchingState:PlayerMatchingState
	private playerSessions:Set<string>
	abstract user_message(turn:number,msg:string):string
	abstract get getMapId():number
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
	//	this.playerlist = this.makePlayerList()
		//	this.simulation = false
		this.instant = false
		this.map = 0
		this.idleTimeout = null
		this.idleTimeoutTurn = -1
		this.connectionTimeout = null
		this.connectionTimeoutTurn = -1
		this.playerSessions=new Set<string>()
		this.isGameStarted=false
		this.resetCallback=()=>{}
		this.playerMatchingState=new PlayerMatchingState()
	}
	
	registerResetCallback(onreset:Function){
		this.resetCallback=onreset
		return this
	}
	addSession(id:string){
		this.playerSessions.add(id)
	}
	hasSession(id:string){
		return this.playerSessions.has(id)
	}
	deleteSession(id:string){
		this.playerSessions.delete(id)
	}
	getPlayerList(){
		return this.playerMatchingState.playerlist
	}
	getChangedTurn(original:number){
		return this.playerMatchingState.getTurnMapping(original)
	}

	get roomStatus(){
		return {
			running:this.isGameRunning,
			started:this.isGameStarted,
			playerlist:this.playerMatchingState.playerlist,
			hosting:this.hosting
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
			this.instant = true
		}

		return this
	}
	setHostNickname(name: string, turn: number,userClass:number) {
		this.playerMatchingState.setHostNickname(name,turn,userClass)
	}
	
	user_updatePlayerList(playerlist: ProtoPlayer[]) {
		
		
		this.playerMatchingState.setPlayerList(playerlist)
		this.hosting = this.playerMatchingState.getHostingCount()

	}

	user_updateReady(turn: number, ready: boolean) {
		this.playerMatchingState.setReady(turn,ready)
		
	}
	user_guestRegister(sessionId:string):boolean{
		if (this.playerMatchingState.getHostingCount() <= 0) {
			return false
		}
		this.addSession(sessionId)
		this.playerMatchingState.guestnum += 1
		return true
	}
	user_guestKick(sessionId:string){
		this.deleteSession(sessionId)
		this.playerMatchingState.guestnum -= 1
	}


	addGuestToPlayerList(username: string,userClass:number) :number{
		return this.playerMatchingState.addGuestToPlayerList(username,userClass)
	}

	getPlayerNamesForTeamSelection():{name:string,userClass:number}[] {
		return this.playerMatchingState.getPlayerNamesForTeamSelection()
	}
	user_updateChamp(turn: number, champ_id: number) {
		this.playerMatchingState.setChamp(turn,champ_id)
	}

	user_updateMap(map: number) {
		this.map = map
	}
	user_updateTeams(teams: boolean[]) {
		this.playerMatchingState.setTeams(teams)
	}
	onBeforeGameStart()
	{
		this.isGameStarted=true

	}
	user_reconnect(turn:number){

	}
	user_disconnect(turn:number){
		
	}
	reset() {
		// this.stopConnectionTimeout()
		// this.stopIdleTimeout()
		console.log(this.name + "has been reset")
		this.name = "DELETED_ROOM"
		this.playerSessions.clear()
		
		this.isTeam = false
		this.instant = false
		this.map = 0
		if(this.resetCallback!=null)
			this.resetCallback()
		if(this.idleTimeout) clearTimeout(this.idleTimeout)
		if(this.connectionTimeout) clearTimeout(this.connectionTimeout)
	}
}

export { Room }
