import { chooseRandom } from "../../util";

export default abstract class ActionChoice<TReq,TAction>{
    abstract generate(req?:TReq):TAction[]

    getRandom(req?:TReq):TAction{
        return chooseRandom(this.generate(req))
    }
}