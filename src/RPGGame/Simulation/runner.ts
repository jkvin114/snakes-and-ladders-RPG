
import { SimulationSetting } from "./Setting"
import { Simulation, SimulationInit } from "./Simulation"


const { workerData, parentPort, isMainThread } = require("worker_threads")

function runSimulation(data: SimulationInit): Promise<any> {
	//console.log("runnerid"+data.runnerId)

	let setting = new SimulationSetting(data.isTeam, data.setting)
	let simulation = new Simulation(data.roomName, data.count, setting, data.runnerId)

	return new Promise((resolve, reject) => {
		simulation.run(function () {
			resolve({
				replay:simulation.replayRecords,
				stat: simulation.isSummaryOnly() ? null : simulation.getFinalStatistics(),
				simple_stat: simulation.getSimpleResults(),
				gameRecords:simulation.gameRecords
			})
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

export { Simulation, SimulationSetting, runSimulation }
