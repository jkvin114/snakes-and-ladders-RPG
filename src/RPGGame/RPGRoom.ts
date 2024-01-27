import { Room } from "../Room/room"
const { Replay } = require("./../mongodb/ReplayDBHandler")
import CONFIG from "./../../config/config.json"

const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./../mongodb/GameDBSchema")
import { hasProp, writeFile } from "./core/Util"
import { Worker, isMainThread } from "worker_threads"
import { GameEventObserver } from "./GameEventObserver"
import { SimulationEvalGenerator } from "./Simulation/eval/Generator"
import { GameLoop } from "./GameCycle/RPGGameLoop"
import { GameEventEmitter } from "../sockets/GameEventEmitter"
import { ClientInputEventFormat, ServerGameEventFormat } from "./data/EventFormat"
import { Logger } from "../logger"
const path = require("path")

function workerTs(data: unknown) {
	return new Worker(path.resolve(__dirname, `./../WorkerThread.js`), { workerData: data })
}

class RPGRoom extends Room {
	type: string
	user_message(turn: number, msg: string): string {
		throw new Error("Method not implemented.")
	}

	private gameloop: GameLoop
	protected eventObserver:GameEventObserver
	registeredSessions:Set<string>
	// simulation: Simulation
	constructor(name: string) {
		super(name)
		this.gameloop
		this.type="rpg"
		this.eventObserver=new GameEventObserver(name)
		this.registeredSessions=new Set<string>()

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
	get gameStatus():ServerGameEventFormat.GameStatus|null{
		if(!this.gameloop) return null
		return this.gameloop.game.getGameStatus()
	}
	get getMapId():number {
		if(!this.gameloop) return -1
		return this.gameloop.game.mapId
	}

	user_gameReady(setting: ClientInputEventFormat.GameSetting, roomName: string) {
		// this.instant = false
		this.onBeforeGameStart()
		// room.aichamplist=aichamplist
		// room.map=map
		this.isGameStarted=true
		this.playerMatchingState.assignGameTurns(setting.shuffleTurns)
		this.gameloop = GameLoop.create(this.map, roomName, setting, false, this.isTeam, this.playerMatchingState.playerlist)
		this.gameloop.registerGameEventObserver(this.eventObserver)
	//	console.log("team" + this.isTeam)
	}
	user_requestSetting(): ServerGameEventFormat.initialSetting {
		let setting = this.gameloop.game.getInitialSetting()
		//	setting.simulation = this.simulation
		return setting
	}
	user_reconnect(turn:number){
		if(!this.gameloop || turn<0) return
		this.gameloop.user_reconnect(turn)
	}
	user_disconnect(turn: number): void {
		if(!this.gameloop || turn<0) return
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
		else if (!this.gameloop.game.begun){
			Logger.log("rpg game start ",this.name)
			this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
			this.isGameRunning=true
		} 
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
			//dev setting 켜져있을때는 통계 저장안함
			if(CONFIG.dev_settings.enabled && !CONFIG.dev_settings.savestat){
				this.eventObserver.gameStatReady('')
			}
			else{
				const resolvedData = await GameRecord.create(stat)
				await this.onGameStatReady(resolvedData.id,"RPG",stat.winners)
				this.eventObserver.gameStatReady(resolvedData.id)
			}
		}
		catch(e){
			Logger.error("rpg game over ",e)
		}

		this.eventObserver.gameOver(winner)
	}
	user_simulationStart(
		simulationsetting: ClientInputEventFormat.SimulationSetting,
		simulation_count: number,
		isTeam: boolean,
		runnerId: string
	) {
		if (!isMainThread) return
		if(CONFIG.dev_settings.enabled) {
			Logger.warn("ERROR: cannot run simulation if dev setting is enabled!")
			return
		}
		// let setting = new SimulationSetting(isTeam, simulationsetting)
		// this.simulation = new Simulation(this.name, simulation_count, setting, runnerId)
		this.doInstantSimulation(simulationsetting, simulation_count, isTeam, runnerId, this.name)
			.then((stat: any) => {
				this.onSimulationOver(true, stat)
			})
			.catch((e) => {
				Logger.error("rpg simulation",e)
				this.onSimulationOver(false, e.toString())
			})
	}
	doInstantSimulation(
		simulationsetting: ClientInputEventFormat.SimulationSetting,
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
				path: "./RPGGame/Simulation/runner.ts"
			})
			worker.on("message", (data: unknown) => {
			//	console.log(data)
				if (hasProp(data, "type") && hasProp(data, "value")) {
					if (data.type === "progress") {
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

		if(resultStat.gameRecords!=null && resultStat.gameRecords.length>0){
			try{
				let simEval=new SimulationEvalGenerator()
				for(const game of resultStat.gameRecords){
					simEval.addGame(game)
				}
				simEval.save()
			}
			catch(e){
				Logger.error("saving simulation eval",e)
				this.eventObserver.simulationStatReady("error",(e as any).toString())
			}
			
		}

		if (!stat) {
			if (!simple_stat) {
				Logger.log("simulation complete")
				this.eventObserver.simulationOver("no_stat")
				return
			}
			try{

				await SimpleSimulationRecord.create(simple_stat)
				this.eventObserver.simulationStatReady("none","")
			}
			catch(e){
				Logger.error("saving simulation stat",e)
				this.eventObserver.simulationStatReady("error",(e as any).toString())

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
				Logger.error("saving simulation stat",e)
				this.eventObserver.simulationStatReady("error",(e as any).toString())
			}
			
		}
		Logger.log("rpg simulation finished")
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
