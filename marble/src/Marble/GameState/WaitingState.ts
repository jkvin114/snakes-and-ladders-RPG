import type { QueryAction } from "../action/QueryAction";
import MarbleGameCycleState from "./MarbleGameCycleState";

export default abstract class WaitingState<TAction extends QueryAction> extends MarbleGameCycleState<TAction>{
    abstract runAISelection():Promise<boolean>

    abstract sendQueryRequest():void
}