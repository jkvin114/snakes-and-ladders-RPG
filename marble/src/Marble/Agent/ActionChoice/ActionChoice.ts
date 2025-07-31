import type { Random } from "../../../Random";

export default abstract class ActionChoice<TReq,TAction>{
    abstract generate(req?:TReq):TAction[]

    getRandom(rand:Random,req?:TReq):TAction{
        return rand.chooseRandom(this.generate(req))
    }
}