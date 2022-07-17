import { ClientInterfaceCallback } from "../ClientInterface";
import { Room } from "../room";
import { MarbleClientInterface } from "./MarbleClientInterface";
import { MarbleGameLoop } from "./MarbleGameLoop";

class MarbleRoom extends Room{
    getMapId(): number {
        throw new Error("Method not implemented.");
    }
    user_message(turn: number, msg: string): string {
        throw new Error("Method not implemented.");
    }
    gameloop:MarbleGameLoop
	clientInterface:MarbleClientInterface
    constructor(name:string){
        super(name)
        this.gameloop
		this.clientInterface=new MarbleClientInterface(name)
    }
	registerClientInterface(callback:ClientInterfaceCallback){
		this.clientInterface.registerCallback(callback)
		return this
	}
	registerSimulationClientInterface(callback:ClientInterfaceCallback){
		return this
	}
    user_gameReady(roomName: string) {
		this.instant = false

		this.gameloop = MarbleGameLoop.createLoop(roomName,this.isTeam, this.playerlist)
		this.gameloop.setClientInterface(this.clientInterface)
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

    }
}
export {MarbleRoom}