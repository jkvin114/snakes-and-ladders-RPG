import WaitingState from "./WaitingState"
import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { AskBuyoutAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"


export default class WaitingBuyOut extends WaitingState<AskBuyoutAction>{
    static id = GAME_CYCLE.WAITING_BUYOUT
    constructor(game:MarbleGame,sourceAction:AskBuyoutAction){
        super(game,sourceAction.turn,WaitingBuyOut.id,sourceAction)
    }
    onCreate(): void {
        
    }
    async runAISelection(): Promise<boolean> {
        let result=await this.playerAgent.chooseBuyout(this.sourceAction.serialize())
        this.onUserBuyOut(result)
        return true
    }
    
    sendQueryRequest(): void {
        this.game.eventEmitter.askBuyout(this.turn,this.sourceAction.pos,this.sourceAction.price,this.sourceAction.originalPrice)
    }
    onUserBuyOut(result:boolean): QueryEventResult {
        if(result)
            this.game.attemptDirectBuyout(this.turn,this.sourceAction.pos,this.sourceAction.price,this.sourceAction.source)
        return new QueryEventResult(true)
    }
}