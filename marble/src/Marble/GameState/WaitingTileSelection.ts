import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import { ACTION_TYPE } from "../action/Action"
import type { TileSelectionAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingTileSelection extends WaitingState<TileSelectionAction>{
    static id = GAME_CYCLE.WAITING_TILE_SELECTION
    constructor(game:MarbleGame,sourceAction:TileSelectionAction){
        super(game,sourceAction.turn,WaitingTileSelection.id,sourceAction)
    }
    onCreate(): void {
        
    }
   async runAISelection(): Promise<boolean> {
        let result=await this.playerAgent.chooseTile(this.sourceAction.serialize())
        this.onUserSelectTile(result.pos,result.name,result.result)
     //   if(result.name !== this.sourceAction.name) return false
        return true
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.tiles,this.sourceAction.name)
    }
    onUserSelectTile(pos: number,name:string,result:boolean): QueryEventResult {
        if(name !== this.sourceAction.name) return new QueryEventResult(false)
        if(!result) return new QueryEventResult(true)

        if(this.sourceAction.type === ACTION_TYPE.CHOOSE_BUILD_POSITION){
            this.game.onSelectBuildPosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_OLYMPIC_POSITION){
            this.game.onSelectOlympicPosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_ATTACK_POSITION){
            this.game.onSelectAttackPosition(this.turn,pos,this.sourceAction.source,name)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_DONATE_POSITION){
            this.game.onSelectDonatePosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT){
            this.game.onSelectTileLiftPosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_BLACKHOLE){
            this.game.onSelectBlackholePosition(this.turn,pos,this.sourceAction)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_BUYOUT_POSITION){
            this.game.onSelectBuyoutPosition(this.turn,pos,this.sourceAction)
        }
        return new QueryEventResult(true).setData(pos)
    }
}