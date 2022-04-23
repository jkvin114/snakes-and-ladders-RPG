import { GameLoop } from "./GameCycle/RPGGameCycleState";
import { Room } from "./room";
import { ClientPayloadInterface, ServerPayloadInterface } from "./data/PayloadInterface"
import { RoomClientInterface } from "./app"
const { GameRecord, SimulationRecord, SimpleSimulationRecord } = require("./mongodb/DBHandler")
import { Simulation, SimulationSetting } from "./SimulationRunner"


class RPGRoom extends Room{
   
    gameloop:GameLoop
    simulation: Simulation
    constructor(name:string){
        super(name);
        this.gameloop
        this.simulation = null
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
        return this.gameloop.user_message(turn,msg)
    }
    getMapId(){
		return this.gameloop.game.mapId
	}
	user_gameReady(setting: ClientPayloadInterface.GameSetting, roomName: string) {
		this.instant = false

		// room.aichamplist=aichamplist
		// room.map=map
		this.gameloop=GameLoop.create(this.map, roomName,setting, false, this.isTeam,this.playerlist)
		console.log("team" + this.isTeam)
		
	}
	user_requestSetting():ServerPayloadInterface.initialSetting{
		let setting = this.gameloop.game.getInitialSetting()
		//	setting.simulation = this.simulation
		return setting
	}


	/**
	 * 
	 * @returns test if all players are connected
	 */
	user_startGame() :boolean{
		let canstart= this.gameloop.game.canStart()
		if(!canstart) return false
		else if(!this.gameloop.game.begun) this.gameloop.setOnGameOver(this.onGameover.bind(this)).startTurn()
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
				RoomClientInterface.gameStatReady(rname, resolvedData.id)
			})
			.catch((e: any) => console.error(e))

		RoomClientInterface.gameOver(rname, winner)
	}
    user_simulationReady(
		simulationsetting: ClientPayloadInterface.SimulationSetting,
		simulation_count: number,
		isTeam: boolean,
		runnerId: string
	) {
		let setting = new SimulationSetting(isTeam, simulationsetting)
		this.simulation = new Simulation(this.name, simulation_count, setting, runnerId)
		this.doInstantSimulation()
			.then(() =>{
				this.onSimulationOver(true)
			})
			.catch((e)=> {
				console.error(e)
				this.onSimulationOver(false)
			})
	}
	doInstantSimulation(): Promise<Function> {
		return new Promise((resolve, reject) => {
			this.simulation.run(function () {
				resolve(null)
				reject(new Error("Request is failed"))
			})
		})
	}
	
	onSimulationOver(result: boolean) {
		let rname = this.name
		if (result) {
			let stat = this.simulation.getFinalStatistics()
			let simple_stat = this.simulation.getSimpleResults()
			this.reset()
			SimulationRecord.create(stat)
				.then((resolvedData: any) => {
					console.log("stat saved successfully")

					simple_stat.simulation = resolvedData.id

					SimpleSimulationRecord.create(simple_stat)
						.then((resolvedData: any) => {
							console.log("simple stat saved successfully")
						})
						.catch((e: any) => console.error(e))

					RoomClientInterface.simulationStatReady(rname, resolvedData.id)
				})
				.catch((e: any) => console.error(e))

			RoomClientInterface.simulationOver(rname, "success")
		} else {
			//error
			RoomClientInterface.simulationOver(rname, "error")
		}
	}
    reset(): void {
        super.reset()
        if(this.gameloop!=null)
			this.gameloop.onDestroy()
		this.gameloop=null
		this.simulation = null
    }

}
export {RPGRoom}