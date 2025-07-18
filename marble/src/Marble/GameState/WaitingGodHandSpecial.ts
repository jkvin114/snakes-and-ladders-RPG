import { Logger } from "../../logger"
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
        this.game.eventEmitter.askGodHandSpecial(this.turn,this.sourceAction.canLiftTile,this.sourceAction.specialType)
    }
    onUserSelectGodHandSpecial(isBuild:boolean){
        if(isBuild)
            this.game.chooseGodHandSpecialBuild(this.turn,this.sourceAction.source)
        else if(this.sourceAction.specialType==="godhand_special_tile_lift"){

            this.game.chooseGodHandSpecialLiftTile(this.turn,this.sourceAction.source)
        }
        else if(this.sourceAction.specialType==="water_pump"){
            
            this.game.chooseWaterPumpTile(this.turn,this.sourceAction.source)
        }
        else{
            Logger.warn("invaild special type "+this.sourceAction.specialType)
        }
        return new QueryEventResult(true)
    }
}