import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { MoveTileSelectionAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingMoveTileSelection extends WaitingState<MoveTileSelectionAction>{
    
    movetype:String
    constructor(game:MarbleGame,sourceAction:MoveTileSelectionAction){
        super(game,sourceAction.turn,GAME_CYCLE.WAITING_TILE_SELECTION,sourceAction)
        this.movetype=sourceAction.moveType
    }
    onCreate(): void {
        
    }
    async runAISelection(): Promise<boolean> {
        let result=await this.playerAgent.chooseTile(this.sourceAction.serialize())
        this.onUserSelectTile(result.pos,result.name,result.result)
        // if(result.name !== this.sourceAction.name) return false
        return true

    }
    sendQueryRequest(): void {
        this.game.setMovableTiles(this.sourceAction)
        this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.tiles,this.sourceAction.name)
    }
    onUserSelectTile(pos: number,name:string,result:boolean): QueryEventResult {
        if(name !== this.sourceAction.name) return new QueryEventResult(false)
        if(!result) return new QueryEventResult(true)
        this.game.onSelectMovePosition(this.turn,pos,this.sourceAction)
        return new QueryEventResult(true).setData(pos)
    }
}