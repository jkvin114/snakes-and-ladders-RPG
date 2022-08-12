export namespace ServerPayloadInterface{
    export interface buildAvaliability{
        cycleLeft:number,toll:number,buildPrice:number,type:number,have:boolean
    }
    export interface tileStateChange{
        state:string,pos:number,duration?:number
    }
    export interface ItemSetting{
        randomCount:number,items:{code:number,locked:boolean,selected:boolean}[]
    }
    export interface ThrowDiceData{
        dice: number[];
        isDouble: boolean;
        dc: boolean;
    }
}