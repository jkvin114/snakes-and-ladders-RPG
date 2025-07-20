export namespace ClientResponseModel{

    export interface PressDice{
        target:number
        oddeven:number
    }
    export interface SelectTile{
        pos:number
        name:string
        result:boolean
    }
    export interface UseCard{
        result:boolean
        cardname:string
    }

    //bot only
    export interface SelectLandSwap{
        myland:number
        enemyLand:number
        result:boolean
    }
    //bot only
    export interface SelectForcemove{
        playerPos:number
        targetDice:number
        oddeven:number
        result:boolean
    }
}