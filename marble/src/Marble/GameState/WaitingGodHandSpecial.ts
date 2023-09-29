import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { AskGodHandSpecialAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingGodHandSpecial extends WaitingState<AskGodHandSpecialAction>{
    
    static id = GAME_CYCLE.WAITING_GODHAND_SPECIAL
    constructor(game:MarbleGame,action:AskGodHandSpecialAction){
        super(game,action.turn,WaitingGodHandSpecial.id,action)
    }
    onCreate(): void {
        
    }
    async runAISelection(): Promise<boolean> {
         let result=await this.playerAgent.chooseGodHand(this.sourceAction.serialize())
         this.onUserSelectGodHandSpecial(result)
       // this.onUserSelectGodHandSpecial(true)
        return true
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.askGodHandSpecial(this.turn,this.sourceAction.canLiftTile)
    }
    onUserSelectGodHandSpecial(isBuild:boolean){
        if(isBuild)
            this.game.chooseGodHandSpecialBuild(this.turn,this.sourceAction.source)
        else
            this.game.chooseGodHandSpecialLiftTile(this.turn,this.sourceAction.source)
        return new QueryEventResult(true)
    }
}