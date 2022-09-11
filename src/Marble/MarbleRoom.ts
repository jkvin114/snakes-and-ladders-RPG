import { GameEventEmitter } from "../GameEventObserver";
import { Room } from "../room";
import { MarbleGameEventObserver } from "./MarbleGameEventObserver";
import { MarbleGameLoop } from "./MarbleGameLoop";
import { ServerPayloadInterface } from "./ServerPayloadInterface";

class MarbleRoom extends Room{
    get getMapId(): number {
        return this.map
    }
    user_message(turn: number, msg: string): string {
        console.error("Method not implemented.");
		return ""
    }
    gameloop:MarbleGameLoop
	clientInterface:MarbleGameEventObserver
	

    constructor(name:string){
        super(name)
        this.gameloop
		this.clientInterface=new MarbleGameEventObserver(name)
    }
	registerClientInterface(callback:GameEventEmitter){
		this.clientInterface.registerCallback(callback)
		return this
	}
	registerSimulationClientInterface(callback:GameEventEmitter){
		return this
	}
    user_gameReady(roomName: string,itemSetting:ServerPayloadInterface.ItemSetting) {
		this.instant = false

		this.gameloop = MarbleGameLoop.createLoop(roomName,this.isTeam,this.map, this.playerlist,itemSetting)
		this.gameloop.setClientInterface(this.clientInterface)
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