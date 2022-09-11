import { GameLoop } from "./GameCycle/RPGGameCycleState"
import { Room } from "./room"
import { ClientInputEventInterface, ServerGameEventInterface } from "./data/PayloadInterface"

const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./mongodb/DBHandler")
import { hasProp } from "./core/Util"
import { Worker, isMainThread } from "worker_threads"
import { GameEventObserver, GameEventEmitter } from "./GameEventObserver"
const path = require("path")

function workerTs(data: unknown) {
	return new Worker(path.resolve(__dirname, `./WorkerThread.js`), { workerData: data })
}

class RPGRoom extends Room {

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
	cryptTurn(turn: number) {
		if(!this.gameloop) return
		return this.gameloop.game.cryptTurn(turn)
	}
	thisCryptTurn() {
		if(!this.gameloop) return
		return this.gameloop.game.thisCryptTurn()
	}
	isThisTurn(cryptTurn: string) {
		if(!this.gameloop) return
		return this.gameloop.game.isThisTurn(cryptTurn)
	}
	user_message(turn: number, msg: string): string {
		if(!this.gameloop) return
		return this.gameloop.user_message(turn, msg)
	}
	get getMapId():number {
		if(!this.gameloop) return -1
		return this.gameloop.game.mapId
	}

	user_gameReady(setting: ClientInputEventInterface.GameSetting, roomName: string) {
		this.instant = false

		// room.aichamplist=aichamplist
		// room.map=map
		this.gameloop = GameLoop.create(this.map, roomName, setting, false, this.isTeam, this.playerlist)
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
		if(!this.gameloop) return

		let canstart = this.gameloop.game.canStart()
		if (!canstart) return false
		else if (!this.gameloop.game.begun) this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
		return true
	}

	onGameover(isNormal:boolean) {
		if(!this.gameloop) return
		
		if(!isNormal){
			this.reset()
			return
		}
		let stat = this.gameloop.game.getFinalStatistics()
		let winner = this.gameloop.game.thisturn

		let rname = this.name
		this.reset()

		GameRecord.create(stat)
			.then((resolvedData: any) => {
				console.log("stat saved successfully")
				this.eventObserver.gameStatReady(resolvedData.id)
			})
			.catch((e: any) => console.error(e))

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

	onSimulationOver(result: boolean, resultStat: any) {
		let rname = this.name
		if (result) {
			let stat = resultStat.stat
			let simple_stat = resultStat.simple_stat
			// let stat = this.simulation.getFinalStatistics()
			// let simple_stat = this.simulation.getSimpleResults()
			this.reset()	

			if (!stat) {
				if (!simple_stat) {
					console.log("simulation complete")
					this.eventObserver.simulationOver("no_stat")
					return
				}

				SimpleSimulationRecord.create(simple_stat)
					.then((resolvedData: any) => {
						console.log("simple stat saved successfully")
					})
					.catch((e: any) => {
						console.error(e)
						this.eventObserver.simulationStatReady("error",e.toString())
					})

					this.eventObserver.simulationStatReady("none","")
			} else {
				SimulationRecord.create(stat)
					.then((resolvedData: any) => {
					//	console.log(resolvedData)
						console.log("stat saved successfully")

						simple_stat.simulation = resolvedData.id.toString()

						SimpleSimulationRecord.create(simple_stat)
							.then((resolvedData: any) => {
								console.log("simple stat saved successfully")
							})
							.catch((e: any) => {
								console.error(e)
								this.eventObserver.simulationStatReady("error",e.toString())
							})

						this.eventObserver.simulationStatReady(resolvedData.id,"")
					})
					.catch((e: any) => {
								console.error(e)
								this.eventObserver.simulationStatReady("error",e.toString())
					})
			}

			this.eventObserver.simulationOver("success")
		} else {
			//error
			this.eventObserver.simulationOver("error " + resultStat)
		}
	}
	reset(): void {
		super.reset()
		if (this.gameloop != null) this.gameloop.onDestroy()
		this.gameloop = null
		// this.simulation = null
	}
}
export { RPGRoom }
