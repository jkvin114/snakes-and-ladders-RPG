import { BuildableTile } from "./BuildableTile"
import { BUILDING, TILE_TYPE } from "./Tile"

class SightTile extends BuildableTile{
    
    

    readonly baseToll:number
    readonly buildPrice:number
    stage:number
    readonly sightType:string
    constructor(position:number,type: TILE_TYPE, name: string,sightType:string,baseToll:number,buildPrice:number){
        super(position,type,name)
        this.baseToll=baseToll
        this.buildPrice=buildPrice
        this.stage=0
        this.sightType=sightType
    }
    build(buildings:BUILDING[]):number{
        if(buildings.length===0) return 0
        if(buildings[0]===BUILDING.SIGHT)
            this.land=true
        return this.buildPrice
    }
    getNextBuild():BUILDING{
        return BUILDING.NONE
    }
    getBuildables():BUILDING[]{
        if(this.land) return []
        return [BUILDING.SIGHT]
    }
    getCurrentBuilds(): BUILDING[] {
        if(this.land) return [BUILDING.SIGHT]
        return []
    }
    getBuildingAvaliability(cycleLevel:number){
        if(this.land) return []
        return [{
            cycleLeft:0,toll:this.baseToll,buildPrice:this.buildPrice,type:BUILDING.SIGHT,have:false
        }]
    }
    hasBuild(b:BUILDING):boolean{
        return (b===BUILDING.SIGHT && this.land)
    }
    isLandMark(): boolean {
        return false
    }
    getMinimumBuildPrice(){
        return this.buildPrice
    }
    removeOneHouse():BUILDING{
        return BUILDING.NONE
    }
    isMoreBuildable(): boolean {
        return false
    }
    isEmpty(): boolean {
        return !this.land
    }
    removeAll(){
        this.stage=0
        super.removeAll()
    }
    upgradeStage():number{
        this.stage=Math.min(2,this.stage+=1)
        return this.stage
    }
    getBaseToll():number{
        return this.baseToll * 2 ** this.stage
    }
    getBuildPrice():number{
        return this.buildPrice
    }
    getBuyOutPrice():number{
        return this.buildPrice * 2
    }
    canBuyOut(): boolean {
        return false
    }
}
export {SightTile}