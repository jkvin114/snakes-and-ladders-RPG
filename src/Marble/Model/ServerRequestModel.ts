import { ACTION_TYPE } from "../action/Action";
import type { BUILDING } from "../tile/Tile";
import { BuildType } from "../tile/enum";

export namespace ServerRequestModel{
    export interface DiceSelection{
        hasOddEven:boolean
        origin:number //current player pos
    }

    export interface buildAvaliability{
        cycleLeft:number,toll:number,buildPrice:number,type:number,have:boolean
    }

    export interface LandBuildSelection{
        pos:number
        builds:ServerRequestModel.buildAvaliability[]
        buildsHave:BUILDING[]
        discount:number
        money:number
        type:BuildType
    }
    export interface BuyoutSelection{
        pos:number
        price:number
        originalPrice:number
    }
    export interface TileSelection{
        tiles:number[]
        source:string
        actionType:ACTION_TYPE
    }
    export interface CardSelection{
        cardname:string
    }

    export interface AttackDefenceCardSelection extends CardSelection{
        attackName:string
    }
    export interface TollDefenceCardSelection extends CardSelection{
        before:number
        after:number
    }
    export interface GodHandSpecialSelection{
        canLiftTile:boolean
    }
    export interface IslandSelection{
        canEscape:boolean
        escapePrice:number
    }
    export interface ObtainCardSelection{
        name:string
        type:number
        level:number
    }

}