import { GameEventEmitter } from "../sockets/GameEventEmitter";
import { Room } from "../Room/room";
import { MarbleGameEventObserver } from "./MarbleGameEventObserver";
import { MarbleGameLoop } from "./MarbleGameLoop";
import { ServerEventModel } from "./Model/ServerEventModel";
import { Worker, isMainThread } from "worker_threads"
import { SimulationSetting } from "./Simulation/SimulationSetting";
import { hasProp } from "./util";

const path = require("path")

function workerTs(data: unknown) {
	return new Worker(path.resolve(__dirname, `./../WorkerThread.js`), { workerData: data })
}
class MarbleRoom extends Room{
    get getMapId(): number {
        return this.map
    }
    user_message(turn: number, msg: string): string {
        console.error("Method not implemented.");
		return ""
    }
    gameloop:MarbleGameLoop
	eventObserver:MarbleGameEventObserver
	type: string
	simulationRunning:boolean

    constructor(name:string){
        super(name)
		this.type="marble"
        this.gameloop
		this.eventObserver=new MarbleGameEventObserver(name)
		this.simulationRunning=false
    }
	registerClientInterface(callback:GameEventEmitter){
		this.eventObserver.registerCallback(callback)
		return this
	}
	registerSimulationClientInterface(callback:GameEventEmitter){
		this.eventObserver.registerSimulationCallback(callback)
		return this
	}
    user_gameReady(roomName: string,itemSetting:ServerEventModel.ItemSetting) {
		this.onBeforeGameStart()
		// this.instant = false

		this.gameloop = MarbleGameLoop.createLoop(roomName,this.isTeam,this.map, this.playerMatchingState.playerlist)
		this.gameloop.registerItems(itemSetting)
		this.gameloop.setClientInterface(this.eventObserver)
		this.gameloop.setOnReset(()=>this.reset())
	}



	user_requestSetting(){
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
		let canstart = this.gameloop.game.canStart()
		if (!canstart) return false
		else if (!this.gameloop.game.begun) this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
		return true
	}
	onClientEvent(event:string,invoker:number,...args:any[])
	{	
		this.gameloop.onClientEvent(event,invoker,args)
	}
	user_startSimulation(setting:SimulationSetting){
		if (!isMainThread || this.simulationRunning) return
		
		this.simulationRunning=true

		this.doInstantSimulation(setting)
			.then((stat: any) => {
				this.onSimulationOver(true, stat)
			})
			.catch((e) => {
				console.error(e)
				this.onSimulationOver(false, e.toString())
			})
	}
	onSimulationOver(success:boolean,data:any){
		this.eventObserver.simulationOver(success,data)
		this.simulationRunning=false
		this.reset()
	}
	doInstantSimulation(setting:SimulationSetting){
		return new Promise((resolve, reject) => {
			const worker = workerTs({
				setting: setting,
				roomName:this.name,
				path: "./Marble/Simulation/runner.ts"
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
    onGameover(){
		this.reset()
    }
	reset(): void {
		super.reset()
		if (this.gameloop != null) this.gameloop.onDestroy()
		// this.simulation = null
	}
}
export {MarbleRoom}