import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { AskBuildAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import { BUILDING } from "../tile/Tile"
import WaitingState from "./WaitingState"
// import WaitingState from "

export default class WaitingBuild extends WaitingState<AskBuildAction>{

    static id = GAME_CYCLE.WAITING_BUILD
    
    pos:number
    discount:number
    constructor(game:MarbleGame,sourceAction:AskBuildAction){
        super(game,sourceAction.turn,WaitingBuild.id,sourceAction)
        this.pos=sourceAction.pos
        this.discount=sourceAction.discount
    }

    async runAISelection(): Promise<boolean> {
        let result= await this.playerAgent.chooseBuild(this.sourceAction.serialize())
        console.log(result)
        if(!result) result = []
        this.onUserSelectBuild(result)
        return true
    }
    onCreate(): void {
        
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.chooseBuild(this.turn,this.sourceAction.serialize())
    }
    onUserSelectBuild(builds: BUILDING[]): QueryEventResult {
        this.game.directBuild(this.turn,builds,this.pos,this.discount,this.sourceAction.source)
        return new QueryEventResult(true).setData(builds)
    }
}