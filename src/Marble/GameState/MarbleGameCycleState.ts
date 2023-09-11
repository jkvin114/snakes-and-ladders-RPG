import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import { Action, ACTION_TYPE } from "../action/Action"
import StateChanger from "./StateChanger"

export default abstract class MarbleGameCycleState<TAction extends Action> {
    static readonly ERROR_STATE=-2
	readonly turn: number
	readonly crypt_turn: string
	readonly rname: string
	abstract onCreate(): void
	readonly id: number
	gameover: boolean
    game:MarbleGame
    sourceAction:TAction
	constructor(game:MarbleGame ,turn:number,id: number,sourceAction:TAction) {
        this.game=game
		this.id = id
        this.sourceAction=sourceAction
		this.gameover = false
		// this.idleTimeout = null
        this.turn=turn
		//console.log("gamecycle" + id)
	}
	onDestroy() {
		//	console.log("gamecycle ondestroy" + this.id)
	}
    afterDelay(){

    }

    get isAI(){
        return this.game.isAI(this.turn)
    }
    get playerAgent(){
        return this.game.getPlayerAgent(this.turn)
    }

    getNext(action:Action|null): MarbleGameCycleState<Action> {
        return StateChanger(action,this.game)
    }
    onUserPressDice(target:number,oddeven:number):QueryEventResult{
        return new QueryEventResult(false)
    }
    onUserSelectBuild(builds:number[]){
        return new QueryEventResult(false)
    }
    onUserBuyOut(result:boolean){
        return new QueryEventResult(false)
    }
    onUserConfirmLoan(result:boolean)
    {
        return new QueryEventResult(false)
    }
    onUserConfirmObtainCard(result:boolean){
        return new QueryEventResult(false)
    }
    onUserConfirmUseCard(result:boolean,cardname:string)
    {
        return new QueryEventResult(false)
    }
    onUserSelectTile(pos:number,name:string,result:boolean){
        return new QueryEventResult(false)
    }
    onUserSelectPlayer(){

    }
    onUserSelectIsland(escape:boolean){
        return new QueryEventResult(false)
    }
    onUserSelectGodHandSpecial(isBuild:boolean){
        return new QueryEventResult(false)
    }
	
}