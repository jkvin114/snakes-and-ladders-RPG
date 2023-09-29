import type { MarbleGame } from "../Game"

import QueryEventResult from "../QueryEventResult"
import type { AskLoanAction } from "../action/QueryAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingLoan extends WaitingState<AskLoanAction>{

    static id = GAME_CYCLE.WAITING_LOAN
    amount:number
    receiver:number
    constructor(game:MarbleGame,action:AskLoanAction){
        super(game,action.turn,WaitingLoan.id,action)
        this.amount=action.amount
        this.receiver=action.receiver
    }
    onCreate(): void {
        
    }
    async runAISelection(): Promise<boolean> {
        let result=await this.playerAgent.chooseLoan(this.amount)
        this.onUserConfirmLoan(result)
        return true
    }
    sendQueryRequest(): void {
        this.game.eventEmitter.askLoan(this.turn,this.amount)
    }
    onUserConfirmLoan(result: boolean): QueryEventResult {
        this.game.onConfirmLoan(this.turn,this.receiver,this.amount,result)
        return new QueryEventResult(true).setData(result)
    }
}