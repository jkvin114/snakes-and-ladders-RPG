import { GameEventEmitter, MarbleGameEventObserver } from "./Marble/MarbleGameEventObserver"
import { MarbleGameLoop } from "./Marble/MarbleGameLoop"
import { ServerEventModel } from "./Model/ServerEventModel"
import { SimulationSetting } from "./Marble/Simulation/SimulationSetting"
import { GameType } from "./Marble/enum"
import { hasProp } from "./Marble/util"
import { ProtoPlayer } from "./Model/models"
const path = require("path")
import { Worker, isMainThread } from "worker_threads"
import type { marblegame } from "./grpc/services/marblegame"
import type { ServerWritableStream } from "@grpc/grpc-js"
import { Logger } from "./logger"

function workerTs(data: any) {
	return new Worker(path.resolve(__dirname, `./WorkerThread.js`), { workerData: data })
}

export default class Room {
	private name: string
	private gameloop: MarbleGameLoop | undefined
	private eventObserver: MarbleGameEventObserver
	private type: string
	private simulationRunning: boolean
	private gametype: GameType
	private map: number
	private isTeam: boolean
	private playerlist: ProtoPlayer[]
	constructor(name: string, map: number, gametype: string, isTeam: boolean, playerlist: ProtoPlayer[]) {
		this.type = "marble"
		this.gameloop
		this.name = name
		this.eventObserver = new MarbleGameEventObserver(name)
		this.simulationRunning = false
		this.gametype = gametype as GameType
		console.log(this.gametype)
		this.map = map
		this.isTeam = isTeam
		this.playerlist = playerlist
	}
	registerClientInterface(callback:ServerWritableStream<marblegame.String,marblegame.GameEvent>) {
		this.eventObserver.registerCallback(callback)
		return this
	}
	registerSimulationClientInterface(callback: GameEventEmitter) {
		this.eventObserver.registerSimulationCallback(callback)
		return this
	}
	user_gameReady(roomName: string, itemSetting: ServerEventModel.ItemSetting, gametype: string) {
		//this.onBeforeGameStart()
		// this.instant = false
		// this.gametype = gametype as GameType
		Logger.log("create game loop",roomName)
		this.gameloop = MarbleGameLoop.createLoop(roomName, this.isTeam, this.map, this.playerlist, this.gametype)
		this.gameloop.registerItems(itemSetting)
		this.gameloop.setGameEventObserver(this.eventObserver)
		this.gameloop.setOnReset(() => this.reset())
	}

	user_requestSetting() {
		if (!this.gameloop) return null
		return this.gameloop.game.getInitialSetting()
	}
	// user_requestSetting(): {
	// 	// let setting = this.gameloop.game.getInitialSetting()
	// 	// return setting
	// }

	/**
	 *
	 * @returns test if all players are connected
	 */
	user_startGame(): boolean {
		if (!this.gameloop) return false
		// let canstart = this.gameloop.game.canStart()
		// if (!canstart) return false
		if (!this.gameloop.game.begun) this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
		Logger.log("startgame",this.name)
		return true
	}
	onClientEvent(event: string, invoker: number, args: any[]) {
		if (!this.gameloop) return
		this.gameloop.onClientEvent(event, invoker, args)
	}


	user_startSimulation(setting: SimulationSetting) {
		this.gametype = GameType.INSTANT_SIMULATION
		if (!isMainThread || this.simulationRunning) return

		this.simulationRunning = true
		Logger.log("start simulation",this.name)
		this.doInstantSimulation(setting)
			.then((stat: any) => {
				this.onSimulationOver(true, stat)
			})
			.catch((e) => {
				Logger.error("simulation error",e)
				this.onSimulationOver(false, e.toString())
			})
	}
	onSimulationOver(success: boolean, data: any) {
		this.eventObserver.simulationOver(success, data)
		this.simulationRunning = false
		this.reset()
	}
	doInstantSimulation(setting: SimulationSetting) {
		return new Promise((resolve, reject) => {
			const worker = workerTs({
				setting: setting,
				roomName: this.name,
				path: "./Marble/Simulation/runner.ts",
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
	onGameover(winner: number, stat: any) {
		try {
			//	MarbleGameRecordSchema.create(stat)
		} catch (e) {
			console.error("Failed to save game record")
		} finally {
			this.reset()
		}
	}
	onDestroy(){
		this.reset()
	}
	reset(): void {
		//	super.reset()
		Logger.log("reset room ",this.name)
		if (this.gameloop != null) this.gameloop.onDestroy()
		// this.simulation = null
	}
}
