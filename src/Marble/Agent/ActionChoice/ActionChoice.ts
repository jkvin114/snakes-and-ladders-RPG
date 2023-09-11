
export default abstract class ActionChoice<TReq,TAction>{
    abstract generate(req?:TReq):TAction[]
}