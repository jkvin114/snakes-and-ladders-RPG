
export namespace ServerEventModel{
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