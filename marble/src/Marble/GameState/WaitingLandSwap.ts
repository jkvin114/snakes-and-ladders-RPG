import { CARD_NAME } from "../FortuneCard"
import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { LandSwapAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import MarbleGameCycleState from "./MarbleGameCycleState"
import WaitingState from "./WaitingState"

export default class WaitingLandSwap extends WaitingState<LandSwapAction>{
    static id = GAME_CYCLE.WAITING_LAND_SWAP
    private myland:number
    constructor(game:MarbleGame,action:LandSwapAction){
        super(game,action.turn,WaitingLandSwap.id,action)
        // this.action=action
        this.myland=-1
    }
    onCreate(): void {
        
    }
    
    async runAISelection(): Promise<boolean> {
        let result = await this.playerAgent.chooseLandSwap(this.sourceAction.myLands,this.sourceAction.enemyLands)

        this.myland = result.myland
        this.onUserSelectTile(result.enemyLand,"land_change_2",result.result)
        return true
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.myLands,"land_change_1")
    }
    onUserSelectTile(pos: number,name:string,result:boolean){
        if(name !== "land_change_1" && name!=="land_change_2") return new QueryEventResult(false)
        if(!result) return new QueryEventResult(true)

        //첫번째 도시 선택(상대에게 줄 땅)
        if(name==="land_change_1"){
            this.myland=pos
            setTimeout(()=>{
                this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.enemyLands,"land_change_2")
            },500)
            
            return new QueryEventResult(false)
        }//두번째 도시 선택
        else{
            this.game.onSelectAttackPosition(this.turn,pos,this.sourceAction.source,CARD_NAME.LAND_CHANGE,this.myland)
            return new QueryEventResult(true).setData([this.myland,pos])
        }
    }
}