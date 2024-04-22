import { Logger } from "../logger"

export default abstract class BaseCacheManager{
    protected cachehit:number=0
    protected cachemiss:number=0
    protected abstract prefix:string
    constructor(){

    }
    protected getEval(){
        if(this.cachehit+this.cachemiss===0) return ''
        return `${this.prefix} report: cache hit:${this.cachehit}, miss: ${this.cachemiss}. Hit rate: ${this.cachehit/(this.cachehit+this.cachemiss)}`
    }
    protected logCacheReport(){
        Logger.log(this.getEval())
    }
}