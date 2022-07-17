import { ServerPayloadInterface } from "../ServerPayloadInterface"
import { BUILDING, Tile, TILE_TYPE } from "./Tile"

class TilePriceMultiplier{
    festival:boolean
    monopoly:boolean
    olympic:number
    additional:number
    locked:boolean
    static UPPER_BOUND=80
    static MAX_OLYMPIC_MULTIPLIER=5
    constructor(){
        this.olympic=1
        this.festival=false
        this.monopoly=false
        this.additional=1
        this.locked=false
    }
    reset(){
        this.olympic=1
        this.festival=false
        this.monopoly=false
        this.additional=1
        this.locked=false
    }
    stealAdditional():number{
        if(this.locked) return 1
        this.additional=0
        return Math.round(this.total()/this.baseTotal())
    }
    baseTotal():number{
        return 2 **(Number(this.festival)+Number(this.monopoly)) * this.olympic
    }
    addAdditional(count:number){
        this.additional*=count
    }
    trueTotal():number{
        return this.additional * this.baseTotal()
    }
    total():number{
        return Math.min(TilePriceMultiplier.UPPER_BOUND,this.trueTotal())
    }
    setOlympic(num:number){
        this.olympic=Math.min(TilePriceMultiplier.MAX_OLYMPIC_MULTIPLIER,num+1)
    }
    
}

class TileStatusEffect{
    duration:number
    namr:string
}
abstract class BuildableTile extends Tile{
    multiplier:TilePriceMultiplier
    olympic:boolean
    festival:boolean
    land:boolean
    statusEffects:Map<string,TileStatusEffect>
    
    abstract getBaseToll():number
    abstract getBuildPrice():number
    abstract getBuyOutPrice():number
    abstract removeOneHouse():BUILDING
    abstract getBuildables():BUILDING[]
    abstract getCurrentBuilds():BUILDING[]
    abstract getBuildingAvaliability(cycleLevel:number):ServerPayloadInterface.buildAvaliability[]
    abstract getMinimumBuildPrice():number
    abstract getNextBuild():BUILDING
    abstract build(b:BUILDING[]):number
    abstract isMoreBuildable():boolean
    abstract isEmpty():boolean
    abstract canBuyOut():boolean
    
    constructor(position:number,type: TILE_TYPE, name: string){
        super(position,type,name)
        this.olympic=false
        this.festival=false
        this.land=false
        this.multiplier=new TilePriceMultiplier()
        this.statusEffects=new Map<string,TileStatusEffect>()

    }
    setOwner(owner:number){
        this.owner=owner
    }
    removeAll(){
        this.land=false
        this.owner=-1
        this.olympic=false
        this.multiplier.reset()
    }
    addMultiplier(count:number){
        this.multiplier.addAdditional(count)
    }
    getMultiplier(){
        return this.multiplier.total()
    }
    stealMultiplier():number{
        let num=this.multiplier.stealAdditional()
        this.multiplier.olympic=1
        this.multiplier.festival=false
        this.olympic=false
        return num
    }
    setFestival(f:boolean){
        this.multiplier.festival=f
    }
    setOlympic(num:number){
        this.multiplier.setOlympic(num)
    }
    getToll(){
        return this.getBaseToll() * this.getMultiplier()
    }
    toString(): string {
        return this.name+"  "+this.position + " - owner:"+this.owner +", land:"+this.land +" \nmul: "+this.multiplier.total() +"  " 
    }
}
export {BuildableTile}