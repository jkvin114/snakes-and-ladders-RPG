import { GameLoop } from "./GameCycle/RPGGameCycleState"
import { Room } from "./room"
import { ClientPayloadInterface, ServerPayloadInterface } from "./data/PayloadInterface"

const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./mongodb/DBHandler")
import { hasProp } from "./core/Util"
import { Worker, isMainThread } from "worker_threads"
const path = require("path")

function workerTs(data: unknown) {
	return new Worker(path.resolve(__dirname, `./WorkerThread.js`), { workerData: data })
}

class RPGRoom extends Room {
	gameloop: GameLoop

	// simulation: Simulation
	constructor(name: string) {
		super(name)
		this.gameloop

		// this.simulation = null
	}
	cryptTurn(turn: number) {
		return this.gameloop.game.cryptTurn(turn)
	}
	thisCryptTurn() {
		return this.gameloop.game.thisCryptTurn()
	}
	isThisTurn(cryptTurn: string) {
		return this.gameloop.game.isThisTurn(cryptTurn)
	}
	user_message(turn: number, msg: string): string {
		return this.gameloop.user_message(turn, msg)
	}
	getMapId() {
		return this.gameloop.game.mapId
	}

	user_gameReady(setting: ClientPayloadInterface.GameSetting, roomName: string) {
		this.instant = false

		// room.aichamplist=aichamplist
		// room.map=map
		this.gameloop = GameLoop.create(this.map, roomName, setting, false, this.isTeam, this.playerlist)
		this.gameloop.setClientInterface(this.clientInterface)
		console.log("team" + this.isTeam)
	}
	user_requestSetting(): ServerPayloadInterface.initialSetting {
		let setting = this.gameloop.game.getInitialSetting()
		//	setting.simulation = this.simulation
		return setting
	}

	/**
	 *
	 * @returns test if all players are connected
	 */
	user_startGame(): boolean {
		let canstart = this.gameloop.game.canStart()
		if (!canstart) return false
		else if (!this.gameloop.game.begun) this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
		return true
	}

	onGameover() {
		let stat = this.gameloop.game.getFinalStatistics()
		let winner = this.gameloop.game.thisturn

		let rname = this.name
		this.reset()

		GameRecord.create(stat)
			.then((resolvedData: any) => {
				console.log("stat saved successfully")
				this.clientInterface.gameStatReady(resolvedData.id)
			})
			.catch((e: any) => console.error(e))

		this.clientInterface.gameOver(winner)
	}
	user_simulationStart(
		simulationsetting: ClientPayloadInterface.SimulationSetting,
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
		simulationsetting: ClientPayloadInterface.SimulationSetting,
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
						this.clientInterface.simulationProgress(data.value)
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
					this.clientInterface.simulationOver("no_stat")
					return
				}

				SimpleSimulationRecord.create(simple_stat)
					.then((resolvedData: any) => {
						console.log("simple stat saved successfully")
					})
					.catch((e: any) => {
						console.error(e)
						this.clientInterface.simulationStatReady("error",e.toString())
					})

					this.clientInterface.simulationStatReady("none","")
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
								this.clientInterface.simulationStatReady("error",e.toString())
							})

						this.clientInterface.simulationStatReady(resolvedData.id,"")
					})
					.catch((e: any) => {
								console.error(e)
								this.clientInterface.simulationStatReady("error",e.toString())
					})
			}

			this.clientInterface.simulationOver("success")
		} else {
			//error
			this.clientInterface.simulationOver("error " + resultStat)
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
