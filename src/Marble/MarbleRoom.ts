import { GameEventEmitter } from "../sockets/GameEventEmitter";
import { Room } from "../Room/room";
import { Worker, isMainThread } from "worker_threads"
import { MarbleGameRecordSchema } from "../mongodb/schemaController/MarbleGameRecord";

import MarbleGameGRPCClient from "../grpc/marblegameclient";
import { hasProp } from "../RPGGame/core/Util";
import { Logger } from "../logger";

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
   // gameloop:MarbleGameLoop
//	eventObserver:MarbleGameEventObserver
	type: string
	simulationRunning:boolean
	static ItemDescriptionCache:any[]=[]
	
    constructor(name:string){
        super(name)
		this.type="marble"
        //this.gameloop
	//	this.eventObserver=new MarbleGameEventObserver(name)
		this.simulationRunning=false
		//this.gametype=GameType.NORMAL
    }
	registerClientInterface(callback:GameEventEmitter){
		//this.eventObserver.registerCallback(callback)
		return this
	}
	registerSimulationClientInterface(callback:GameEventEmitter){
		
	//	this.eventObserver.registerSimulationCallback(callback)
		return this
	}
	user_startSimulation(setting:any){
		return
		this.gametype=""
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
		return
		//this.eventObserver.simulationOver(success,data)
		this.simulationRunning=false
		this.reset()
	}
	doInstantSimulation(setting:any){
		return
		return new Promise((resolve, reject) => {
			const worker = workerTs({
				setting: setting,
				roomName:this.name,
				path: "./Marble/Simulation/runner.ts"
			})
			worker.on("message", (data: any) => {
			//	console.log(data)
				if (hasProp(data, "type") && hasProp(data, "value")) {
					if (data.type === "progress") {
				//		this.eventObserver.simulationProgress(data.value)
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
    async onGameover(stat:any){
		this.isGameRunning=false
		try{
			// console.log(stat)
			const data = await MarbleGameRecordSchema.create(stat)
			this.onGameStatReady(data._id,"MARBLE",new Set([data.winner])).then()
			Logger.log("saved marble game result")
		}
		catch(e){
			Logger.error("Failed to save game record",e)
		}
		finally{
			this.reset()
		}
    }
	reset(){
		MarbleGameGRPCClient.ResetGame(this.name)
		super.reset()
	}
}
export {MarbleRoom}