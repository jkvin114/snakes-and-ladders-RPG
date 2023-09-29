import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import { AskDefenceCardAction, AskAttackDefenceCardAction, AskTollDefenceCardAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingDefenceCardUse extends WaitingState<AskDefenceCardAction>{
    static id = GAME_CYCLE.WAITING_DEFENCE_CARD_USE
    constructor(game:MarbleGame,action:AskDefenceCardAction){
        super(game,action.turn,WaitingDefenceCardUse.id,action)
        // this.action=action
    }
    onCreate(): void {
        
    }
   async runAISelection(): Promise<boolean> {
        let result
        if(this.sourceAction instanceof AskAttackDefenceCardAction){
            result=await this.playerAgent.chooseAttackDefenceCard({attackName:this.sourceAction.attackName,cardname:this.sourceAction.cardname})
        }
        else if(this.sourceAction instanceof AskTollDefenceCardAction){
            result=await this.playerAgent.chooseTollDefenceCard({cardname:this.sourceAction.cardname,before:this.sourceAction.before,after:this.sourceAction.after})
        }
        if(!result) return false

        this.onUserConfirmUseCard(result.result,this.sourceAction.cardname)
        return true
    }
    sendQueryRequest(): void {
        if(this.sourceAction instanceof AskAttackDefenceCardAction){
            this.game.eventEmitter.askAttackDefenceCard(this.turn,this.sourceAction.cardname,this.sourceAction.attackName)
        }
        else if(this.sourceAction instanceof AskTollDefenceCardAction){
            this.game.eventEmitter.askTollDefenceCard(this.turn,this.sourceAction.cardname,this.sourceAction.before,this.sourceAction.after)
        }
    }
    onUserConfirmUseCard(result:boolean,cardname:string): QueryEventResult {
        if(this.sourceAction.cardname!==cardname) return new QueryEventResult(false)
        if(result){
            this.game.useDefenceCard(this.turn,this.sourceAction)
        }
        return new QueryEventResult(true)
    }
}
