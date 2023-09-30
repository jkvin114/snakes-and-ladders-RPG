import type { ABILITY_NAME } from "../Marble/Ability/AbilityRegistry";
import type { BUILDING } from "../Marble/tile/Tile";

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
    export interface PlayerWalkMove{
        from:number
        distance:number
        movetype:string
    }
    export interface PlayerTeleport{
        pos:number
        movetype:string
    }
    export interface Toll{
        pos:number
        toll:number
        multiplier:number
    }
    export interface Multiplier{
        pos:number
        toll:number
        mul:number
    }
    export interface CardSave{
        name:string
        level:number
    }
    export interface Ability{
        name:ABILITY_NAME
        itemName:string
        desc:string
        isblocked:boolean
    }
    export interface Pull{
        tiles:number[]
    }
    export interface PlayerEffect{
        effect:string
        pos:number
        status:boolean
    }
    export interface BlackHole{
        blackpos:number
        whitepos:number
    }
    export interface LandModify{
        pos:number
        type:string
        val:number
    }
    export interface Payment{
        payer:number
        receiver:number
        amount:number
        type:string
    }
    export interface Build{
        pos:number
        builds:BUILDING[]
    }
    export interface MonopolyAlert{
        type:number
        pos:number[]
    }
    export interface CardObtain{
        cardName:string
        cardLevel:number
        cardType:number
    }
    export interface ClearBuildings{
        toremove:number[]
    }
    export interface RemoveBuilding{
        toremove:number[]
        pos:number
    }
    export interface TileEffect{
        pos:number
        name:string
        dur:number
    }
    export interface Defence{
        type:string
        pos:number
    }
    export interface MonopolyWin
    {
        monopoly:number
        scores:number[]
        mul:number
        stat:GameResultStat
    }
    export interface BankruptWin
    {
        scores:number[]
        mul:number
        stat:GameResultStat
    }
    export interface ActionStack_debug{
        stack:{
            type: string;
            turn: number;
            priority: number;
            valid: boolean;
            category: string;
        }[]
    }

  export interface GameResultStat{
        winner: number;
        winType: string;
        totalturn: number;
        map: string;
        isTeam: boolean;
        version: number;
        players: {
            stats: number[];
            items: number[];
            score: number;
            name: string;
            char: number;
            agentType: string;
        }[];
        createdAt: any;
        updatedAt: any;
    }
}