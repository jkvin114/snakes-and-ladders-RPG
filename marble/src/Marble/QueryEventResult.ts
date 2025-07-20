
export default class QueryEventResult
{
    private data:any
    result:boolean
    constructor(goNextState:boolean){
        this.result=goNextState
    }
    setData(data:any){
        this.data=data
        return this
    }
}