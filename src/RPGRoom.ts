import { GameLoop } from "./GameCycle/RPGGameCycleState"
import { Room } from "./room"
import { ClientInputEventInterface, ServerGameEventInterface } from "./data/PayloadInterface"
const { Replay } = require("./mongodb/ReplayDBHandler")

const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./mongodb/DBHandler")
import { hasProp, writeFile } from "./core/Util"
import { Worker, isMainThread } from "worker_threads"
import { GameEventObserver, GameEventEmitter } from "./GameEventObserver"
const path = require("path")

function workerTs(data: unknown) {
	return new Worker(path.resolve(__dirname, `./WorkerThread.js`), { workerData: data })
}

class RPGRoom extends Room {
	user_message(turn: number, msg: string): string {
		throw new Error("Method not implemented.")
	}

	private gameloop: GameLoop
	protected eventObserver:GameEventObserver

	// simulation: Simulation
	constructor(name: string) {
		super(name)
		this.gameloop
		this.eventObserver=new GameEventObserver(name)
		// this.simulation = null
	}
	registerClientInterface(callback:GameEventEmitter){
		this.eventObserver.subscribeEventEmitter(callback)
		return this
	}
	registerSimulationClientInterface(callback:GameEventEmitter){
		this.eventObserver.subscribeSimulationEventEmitter(callback)
		return this
	}
	getGameTurnToken(turn: number) {
		if(!this.gameloop) return
		return this.gameloop.game.getGameTurnToken(turn)
	}
	thisGameTurnToken() {
		if(!this.gameloop) return
		return this.gameloop.game.thisGameTurnToken()
	}
	isThisTurn(cryptTurn: string) {
		if(!this.gameloop) return
		return this.gameloop.game.isThisTurn(cryptTurn)
	}
	getPlayerMessageHeader(turn: number): string {
		if(!this.gameloop) return ""
		return this.gameloop.getPlayerMessageHeader(turn)
	}
	get getMapId():number {
		if(!this.gameloop) return -1
		return this.gameloop.game.mapId
	}

	user_gameReady(setting: ClientInputEventInterface.GameSetting, roomName: string) {
		this.instant = false
		this.onBeforeGameStart()
		// room.aichamplist=aichamplist
		// room.map=map
		this.isGameStarted=true
		this.playerMatchingState.assignGameTurns(setting.shuffleTurns)
		this.gameloop = GameLoop.create(this.map, roomName, setting, false, this.isTeam, this.playerMatchingState.playerlist)
		this.gameloop.setClientInterface(this.eventObserver)
	//	console.log("team" + this.isTeam)
	}
	user_requestSetting(): ServerGameEventInterface.initialSetting {
		let setting = this.gameloop.game.getInitialSetting()
		//	setting.simulation = this.simulation
		return setting
	}
	user_reconnect(turn:number){
		if(!this.gameloop) return
		this.gameloop.user_reconnect(turn)
	}
	user_disconnect(turn: number): void {
		if(!this.gameloop) return
		this.gameloop.user_disconnect(turn)
	}
	hasGameLoop(){
		return this.gameloop!=null
	}
	get getGameLoop(){
		return this.gameloop
	}
	/**
	 *
	 * @returns test if all players are connected
	 */
	user_startGame(): boolean {
		if(!this.gameloop) return false

		let canstart = this.gameloop.game.canStart()
		if (!canstart) return false
		else if (!this.gameloop.game.begun) this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
		return true
	}

	async onGameover(isNormal:boolean) {
		if(!this.gameloop) return
		
		if(!isNormal){
			this.reset()
			return
		}
		let stat = this.gameloop.game.getFinalStatistics()
		let winner = this.gameloop.game.thisturn
		// console.log(this.gameloop.game.retrieveReplayRecord())
		let replayData=this.gameloop.game.retrieveReplayRecord()
		
		this.reset()
		try{

			if(replayData.enabled){
				const replay=await Replay.create(replayData)
				stat.replay=replay.id.toString()
			}
			const resolvedData=await GameRecord.create(stat)
			this.eventObserver.gameStatReady(resolvedData.id)
		}
		catch(e){
			console.error(e)
		}

		this.eventObserver.gameOver(winner)
	}
	user_simulationStart(
		simulationsetting: ClientInputEventInterface.SimulationSetting,
		simulation_count: number,
		isTeam: boolean,
		runnerId: string
	) {
		if (!isMainThread) return
		// let setting = new SimulationSetting(isTeam, simulationsetting)
		// this.simulation = new Simulation(this.name, simulation_count, setting, runnerId)
		this.doInstantSimulation(simulationsetting, simulation_count, isTeam, runnerId, this.name)
			.then((stat: any) => {
				this.onSimulationOver(true, stat)
			})
			.catch((e) => {
				console.error(e)
				this.onSimulationOver(false, e.toString())
			})
	}
	doInstantSimulation(
		simulationsetting: ClientInputEventInterface.SimulationSetting,
		simulation_count: number,
		isTeam: boolean,
		runnerId: string,
		roomName: string
	): Promise<unknown> {
		
		return new Promise((resolve, reject) => {
			const worker = workerTs({
				setting: simulationsetting,
				count: simulation_count,
				isTeam: isTeam,
				runnerId: runnerId,
				roomName: roomName,
				path: "./SimulationRunner.ts"
			})
			worker.on("message", (data: unknown) => {
			//	console.log(data)
				if (hasProp(data, "type") && hasProp(data, "value")) {
					if (data.type === "progress") {
						//console.log("progress " + isMainThread)
						this.eventObserver.simulationProgress(data.value)
					} else if (data.type === "end") {
						resolve(data.value)
					} else reject(data.value)
				} else reject("invalid response from child thread")
			})
			worker.on("error", reject)
			worker.on("exit", (code: number) => {
				if (code !== 0) worker.terminate()
				//reject(new Error(`Simulation worker stopped with exit code ${code}`));
			})
		})
	}

	async onSimulationOver(result: boolean, resultStat: any) {
		let rname = this.name
		if(!result){
			this.eventObserver.simulationOver("error " + resultStat)
			return
		}
		//writeFile(JSON.stringify(resultStat.replay[0]),"stats/replay","json","replay saved")
		let stat = resultStat.stat
		let simple_stat = resultStat.simple_stat

		this.reset()	

		if (!stat) {
			if (!simple_stat) {
				console.log("simulation complete")
				this.eventObserver.simulationOver("no_stat")
				return
			}
			try{

				await SimpleSimulationRecord.create(simple_stat)
				this.eventObserver.simulationStatReady("none","")
			}
			catch(e){
				console.error(e)
				this.eventObserver.simulationStatReady("error",e.toString())

			}
		} else {
			try{
				// console.log(resultStat.replay[0].events.length)
				if(resultStat.replay[0].events.length>0){
					const replay=await Replay.create(resultStat.replay[0])
					stat.stat[0].replay=replay.id.toString()
				}
				
				const data=await SimulationRecord.create(stat)
				simple_stat.simulation = data.id.toString()
				await SimpleSimulationRecord.create(simple_stat)
				this.eventObserver.simulationStatReady(data.id,"")
			}
			catch(e){
				console.error(e)
				this.eventObserver.simulationStatReady("error",e.toString())
			}
			
		}

		this.eventObserver.simulationOver("success")
		
	}
	reset(): void {
		super.reset()
		if (this.gameloop != null) this.gameloop.onDestroy()
		// this.gameloop = null
		// this.simulation = null
	}
}
export { RPGRoom }
