enum TILE_TYPE{
    LAND,SIGHT,CARD,SPECIAL,START,ISLAND,OLYMPIC,TRAVEL,OTHER
}
enum BUILDING{
    NONE,LAND,VILLA,BUILDING,HOTEL,LANDMARK,SIGHT
}
class Tile{
    readonly isCorner:boolean
    readonly isBuildable:boolean
    readonly isSpecial:boolean
    readonly position:number
    // players:number[]
    readonly type:TILE_TYPE
    name:string
    owner:number
    private lifted:boolean
    constructor(position:number,type:TILE_TYPE,name?:string){
        this.type=type
        if(name)
            this.name=name
        else{
            this.name=''
        }

        this.position=position
        this.isBuildable= (this.type===TILE_TYPE.LAND || this.type===TILE_TYPE.SIGHT)
        this.isCorner = (this.type===TILE_TYPE.START || this.type===TILE_TYPE.ISLAND|| this.type===TILE_TYPE.OLYMPIC|| this.type===TILE_TYPE.TRAVEL)
        this.isSpecial = this.type===TILE_TYPE.SPECIAL
        this.owner=-1
        this.lifted=false
    }
    lift(){
        this.lifted=true
    }
    unlift(){
        this.lifted=false
    }
    isLifted(){
        return this.lifted
    }
    isLandMark(){
        return false
    }
    toString(){
        return this.name+"  "+this.position + " - non-buildable"
    }

}
export {Tile,TILE_TYPE,BUILDING}