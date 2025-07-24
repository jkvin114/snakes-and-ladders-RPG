import { CARD_NAME } from "../FortuneCard"
import { ServerRequestModel } from "../../Model/ServerRequestModel"
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
        let amount= Math.round(this.total()/this.baseTotal())
        this.additional=1
        return amount
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
    readonly name:string
    private readonly tollMultiplier:number
    constructor(name:string,dur:number){
        this.name=name
        this.duration=dur
        if(name==='pandemic')
            this.tollMultiplier=0.5
        else if(name==='blackout')
            this.tollMultiplier=0
        else 
            this.tollMultiplier=1
    }
    getTollMultiplier(){
        return this.tollMultiplier
    }
    cooldown(){
        this.duration -= 1
        if(this.duration===0) return true
        return false
    }
}
abstract class BuildableTile extends Tile{
    protected multiplier:TilePriceMultiplier
    olympic:boolean
    festival:boolean
    land:boolean
    protected statusEffects:TileStatusEffect|null
    protected paintEffect:TileStatusEffect|null
    protected paintOriginalOwner:number

    abstract getBaseToll():number
    abstract getBuildPrice():number
    abstract getBuyOutPrice():number
    abstract removeOneHouse():BUILDING
    abstract getBuildables():BUILDING[]
    abstract getCurrentBuilds():BUILDING[]
    abstract getBuildingAvaliability(cycleLevel:number):ServerRequestModel.buildAvaliability[]
    abstract getMinimumBuildPrice():number
    abstract getNextBuild():BUILDING
    abstract build(b:BUILDING[]):number
    abstract isMoreBuildable():boolean
    abstract isEmpty():boolean
    abstract canBuyOut():boolean
    abstract isLandMark():boolean
    abstract hasBuild(b:BUILDING):boolean
    constructor(position:number,type: TILE_TYPE, name: string){
        super(position,type,name)
        this.olympic=false
        this.festival=false
        this.land=false
        this.multiplier=new TilePriceMultiplier()
        this.statusEffects=null
        this.paintOriginalOwner = -1
        this.paintEffect=null
    }
    setMultiplierLock(lock:boolean){
        this.multiplier.locked=lock
    }
    canStealMultiplier(){
        return !this.multiplier.locked && (this.multiplier.additional > 1 || this.olympic || this.festival)
    }
    canAddMoreMultiplier(){
        return this.getMultiplier() < TilePriceMultiplier.UPPER_BOUND
    }
    setStatusEffect(name:string,dur:number):boolean{
        // 정전 효과 있으면 전염병 무시
        if(name===CARD_NAME.PANDEMIC && this.statusEffects!=null && this.statusEffects.name===CARD_NAME.BLACKOUT) return false
        this.statusEffects=new TileStatusEffect(name,dur)
        return true
    }
    removeStatusEffect():boolean{
        let had=(this.statusEffects!=null)
        this.statusEffects=null
        return had
    }
    setPaint(originalOwner:number,dur:number = 2){
        this.paintEffect = new TileStatusEffect("paint",dur)
        if(this.paintOriginalOwner===-1){
            this.paintOriginalOwner = originalOwner
        }
        //페인트 있는 상태에서 또 페인트가 걸리면 원 주인 유지
        
        return true
    }
    /**
     * return original owner if cooldown expired
     */
    cooldownPaint():number{
        if(!this.paintEffect || this.paintOriginalOwner === -1) return -1
        let removed= this.paintEffect.cooldown()
        if(removed) {
            let owner = this.paintOriginalOwner
            this.paintEffect=null
            this.paintOriginalOwner = -1
            return owner
        }
        return -1
    }
    /**
     * 
     * @returns true if status effect removed
     */
    cooldownStatusEffect(){
        if(!this.statusEffects) return false
        let removed= this.statusEffects.cooldown()
        if(removed) this.statusEffects=null

        return removed
    }
    setOwner(owner:number){
        this.owner=owner
    }
    owned(){
        return this.owner!==-1
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
        // this.multiplier.olympic=1
        // this.multiplier.festival=false
        // this.olympic=false
        return num
    }
    setFestival(f:boolean){
        this.multiplier.festival=f
    }
    setOlympic(num:number){
        this.olympic=true
        this.multiplier.setOlympic(num)
    }

    /**
     * return false if tile is a landmark or an owned sight
     * @returns 
     */
    isEmptyOrBuyable(){
        return !this.isLandMark() && !(this.type===TILE_TYPE.SIGHT && this.owned())
    }
    getToll(){
        let mul=1
        if(this.statusEffects!==null) mul=this.statusEffects.getTollMultiplier()

        return this.getBaseToll() * this.getMultiplier() * mul
    }
    /**
     * 
     * @returns 기본통행료 x 배수
     */
    getDisplayedToll(){
        return this.getBaseToll() * this.getMultiplier()
    }
    toString(): string {
        return this.name+"  "+this.position + " - owner:"+this.owner +", land:"+this.land +" \nmul: "+this.multiplier.total() +"  " 
    }
}
export {BuildableTile}