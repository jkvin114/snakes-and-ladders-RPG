
import { registerItems } from "../ItemRegistry"
import { GameResultStat } from "../Model/GameResultStat"
import { Simulation, SimulationInit } from "./Simulation"
import { SimulationSetting } from "./SimulationSetting"
// import { Simulation, SimulationInit } from "./Simulation"


const { workerData, parentPort, isMainThread } = require("worker_threads")


async function runSimulation(data: SimulationInit): Promise<GameResultStat[]> {
	//console.log("runnerid"+data.runnerId)
    const simulation=new Simulation(data)
	await registerItems()
	return new Promise((resolve, reject) => {
		simulation.run(function () {
			resolve(simulation.statistics)
			reject(new Error("Request is failed"))
		},
		(e:unknown)=>reject(e))
	})
}
//console.log("start simulation" + isMainThread)
runSimulation(workerData)
.then((stat) => {
	parentPort.postMessage({ type: "end", value: stat })
	parentPort.close()
})
.catch((e)=>{
	parentPort.postMessage({ type: "error", value: e })
	parentPort.close()
})

