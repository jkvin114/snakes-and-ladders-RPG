import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { AskIslandAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingIsland extends WaitingState<AskIslandAction>{
    
    static id = GAME_CYCLE.WAITING_ISLAND
    constructor(game:MarbleGame,action:AskIslandAction){
        super(game,action.turn,WaitingIsland.id,action)
    }
    onCreate(): void {
        
    }
    async runAISelection(): Promise<boolean> {
        let result=await this.playerAgent.chooseIsland(this.sourceAction.serialize())
        this.onUserSelectIsland(result)
        return true
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.askIsland(this.turn,this.sourceAction.canEscape,this.sourceAction.escapePrice)
    }
    onUserSelectIsland(paid:boolean){
        this.game.attemptIslandEscape(paid,this.turn,this.sourceAction.source,this.sourceAction.escapePrice)
        return new QueryEventResult(true)
    }
}