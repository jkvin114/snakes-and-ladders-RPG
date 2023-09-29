import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { DiceChanceAction, QueryAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingDice extends WaitingState<DiceChanceAction>{

    static id = GAME_CYCLE.WAITING_DICE
 //   dice:number[]
    hasDoubleEffect:boolean
    constructor(game:MarbleGame,sourceAction:DiceChanceAction){
        super(game,game.thisturn,WaitingDice.id,sourceAction)
        this.hasDoubleEffect=true
    }
    onCreate(): void {
        
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.showDiceBtn(this.turn,this.game.getDiceData(this.turn))
    }
    async runAISelection(): Promise<boolean> {
        let result=await this.playerAgent.ChooseDice(this.game.getDiceData(this.turn))
        this.onUserPressDice(result.target,result.oddeven)
        return true
    }
    
    onUserPressDice(target:number,oddeven:number):QueryEventResult{
        this.game.updateState()
        let data=this.game.throwDice(target,oddeven,this.sourceAction)
        this.game.eventEmitter.throwDice(this.turn,data)
  //      this.dice=data.dice
        return new QueryEventResult(true).setData(data)
    }
}