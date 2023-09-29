import WaitingState from "./WaitingState"
import { FortuneCard, AttackCard, DefenceCard, CommandCard } from "../FortuneCard"
import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { ObtainCardAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"


export default class WaitingCardObtain extends WaitingState<ObtainCardAction>{
    static id = GAME_CYCLE.WAITING_CARD_OBTAIN
    card:FortuneCard
    constructor(game:MarbleGame,action:ObtainCardAction){
        super(game,action.turn,WaitingCardObtain.id,action)
        this.card=action.card
    }
    onCreate(): void {
        
    }
    async runAISelection(): Promise<boolean> {
        this.game.eventEmitter.obtainCard(this.turn,this.card.name,this.card.level,this.card.type)
        let result=await this.playerAgent.chooseCardObtain(this.sourceAction.serialize())
        this.onUserConfirmObtainCard(result)
        return true
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.obtainCard(this.turn,this.card.name,this.card.level,this.card.type)
    }
    onUserConfirmObtainCard(result:boolean): QueryEventResult {
        if(this.card instanceof AttackCard){
            this.game.useAttackCard(this.turn,this.card,this.sourceAction.source)
        }
        else if(this.card instanceof DefenceCard){
             if(result) this.game.saveCard(this.turn,this.card)
        }
        else if(this.card instanceof CommandCard){
            this.game.executeCardCommand(this.turn,this.card,this.sourceAction.source)
        }
        return new QueryEventResult(true).setData(result)
    }

}