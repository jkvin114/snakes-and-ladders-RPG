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
}