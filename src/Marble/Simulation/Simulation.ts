import { set } from "mongoose"
import { MarbleGameLoop } from "../MarbleGameLoop"
import { SimulationSetting } from "./SimulationSetting"
import { GameResultStat } from "../Model/GameResultStat"
import SimulationWriter from "./writer"
const { parentPort } = require("worker_threads")
export interface SimulationInit{
    setting:SimulationSetting,
    roomName:string
}
const LABEL_CSV_SAVE_INTERVAL=500
export class Simulation{
    count:number
    gameloop:MarbleGameLoop
    roomName:string
    setting:SimulationSetting

    statistics:GameResultStat[]
	stateVectors:number[][]
	writer:SimulationWriter
    constructor(setting:SimulationInit){
        this.count=setting.setting.count
        this.roomName=setting.roomName
        this.setting=setting.setting
        this.statistics=[]
		this.stateVectors=[]
		this.writer=new SimulationWriter()
    }

    private playOneGame(i:number):Promise<GameResultStat>{
        if(this.gameloop) this.gameloop.reset()

        this.gameloop = MarbleGameLoop.createSimulationLoop(this.roomName,this.setting)
        return new Promise<GameResultStat>((resolve,reject)=>{
            this.gameloop.setOnSimulationOver(resolve).startTurn()
        })
    
    }

	async run(resolve: Function,reject:Function) {
		
		console.log("run"+this.count)
		const PROGRESS_INTERVAL=Math.max(10,Math.floor(this.count/1000))
		let consolelog = console.log
		console.log = function () {}
		//const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		//bar1.start(this.count - 2, 0)
		let startTime: any = new Date()
		let i = 0
		try{
			for (i = 0; i < this.count; ++i) {
				
				if (i % PROGRESS_INTERVAL === 0) parentPort.postMessage({ type: "progress", value: i / this.count })
				let stat=await this.playOneGame(i)
				this.stateVectors.push(...stat.stateVectors)
				stat.stateVectors=[]
                this.statistics.push(stat)

				if(i%LABEL_CSV_SAVE_INTERVAL===LABEL_CSV_SAVE_INTERVAL-1) {
					this.writer.writeLabelCSV(this.stateVectors)
					this.stateVectors=[]
				}
			}
		}
		catch(e){
			reject(e)
			this.writer.onFinish()
		}

		this.writer.writeLabelCSV(this.stateVectors)
		this.writer.onFinish()
		
	//	bar1.stop()
		let endTime: any = new Date()
		let timeDiff: any = endTime - startTime
		console.log = consolelog
		console.log("total time:" + timeDiff + "ms, " + timeDiff / this.count + "ms per game")

		// if(this.setting.isTrain){
		// 	this.gameRecords=this.trainData.onFinish(this.setting.mapPool,this.setting)
		// }
		resolve()
	}

}