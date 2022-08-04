export namespace ServerPayloadInterface{
    export interface buildAvaliability{
        cycleLeft:number,toll:number,buildPrice:number,type:number,have:boolean
    }
    export interface tileStateChange{
        state:string,pos:number,duration?:number
    }
}