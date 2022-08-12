import { ServerPayloadInterface } from "../ServerPayloadInterface"
import { BuildableTile } from "./BuildableTile"
import { BUILDING, TILE_TYPE } from "./Tile"

class LandBuildPrice{
    land:number
    villa:number
    building:number
    hotel:number
    landMark:number

    constructor(prices:number[]){
        this.land=prices[0]
        this.villa=prices[1]
        this.building=prices[2]
        this.hotel=prices[3]
        this.landMark=prices[4]
    }
    getDefault():number[]{
        return [this.land,this.villa,this.building,this.hotel]
    }
    getLandMark():number{
        return this.landMark
    }
    getSpendPrice(tile:LandTile){
        let price=0
        if(tile.land) price+=this.land
        if(tile.villa) price+=this.villa
        if(tile.building) price+=this.building
        if(tile.hotel) price+=this.hotel
        if(tile.landMark) price+=this.landMark
        return price
    }
    get(buildings:BUILDING[]){
        let price=this.land
        for(const b of buildings){
            switch(b){
                case BUILDING.VILLA:
                    price+=this.villa
                case BUILDING.BUILDING:
                    price+=this.building
                case BUILDING.HOTEL:
                    price+=this.hotel
                case BUILDING.LANDMARK:
                    price+=this.landMark
            }
        }
        return price
    }
    getSingle(build:BUILDING){
        switch(build){
            case BUILDING.LAND: return this.land
            case BUILDING.VILLA: return this.villa
            case BUILDING.BUILDING: return this.building
            case BUILDING.HOTEL: return this.hotel
            case BUILDING.LANDMARK: return this.landMark
        }
        return 0
    }
}

class LandToll{
    land:number
    villa:number
    building:number
    hotel:number
    landMark:number
    constructor(prices:number[]){
        this.land=prices[0]
        this.villa=prices[1]
        this.building=prices[2]
        this.hotel=prices[3]
        this.landMark=prices[4]
    }

    getSingle(build:BUILDING){
        switch(build){
            case BUILDING.LAND: return this.land
            case BUILDING.VILLA: return this.villa
            case BUILDING.BUILDING: return this.building
            case BUILDING.HOTEL: return this.hotel
            case BUILDING.LANDMARK: return this.landMark
        }
        return 0
    }
    get(tile:LandTile){
        let price=this.land
        // if(tile.land) price+=
        if(tile.villa) price+=this.villa
        if(tile.building) price+=this.building
        if(tile.hotel) price+=this.hotel

        if(tile.landMark) price=this.landMark
        return price
    }
}


class LandTile extends BuildableTile{
    villa:boolean
    building:boolean
    hotel:boolean
    landMark:boolean
    readonly color:number
    readonly baseToll:LandToll
    readonly buildPrice:LandBuildPrice

    constructor(position:number,type: TILE_TYPE, name: string,color:number,baseToll:number[],buildPrice:number[]){
        super(position,type, name)
        this.baseToll=new LandToll(baseToll)
        this.buildPrice=new LandBuildPrice(buildPrice)
        this.villa=false
        this.building=false
        this.hotel=false
        this.landMark=false
        this.color=color
    }
    /**
     * 건물 건설 후 건설비용 반환
     * 
     */
    build(buildings:BUILDING[]):number{
        this.land=true
        let price=0
        for(const b of buildings){
            switch(b){
                case BUILDING.LAND:
                    price+=this.buildPrice.getSingle(b)
                    break
                case BUILDING.VILLA:
                    price+=this.buildPrice.getSingle(b)
                    this.villa=true
                    break
                case BUILDING.BUILDING:
                    price+=this.buildPrice.getSingle(b)
                    this.building=true
                    break
                case BUILDING.HOTEL:
                    price+=this.buildPrice.getSingle(b)
                    this.hotel=true
                    break
                case BUILDING.LANDMARK:
                    price=this.buildPrice.getSingle(b)
                    this.buildLandMark()
                    break
            }
        }
        return price
    }
    /**
     * 랜드마크 건설
     */
    buildLandMark(){
        this.land=true
        this.villa=true
        this.building=true
        this.hotel=true
        this.landMark=true
    }
    /**
     * 
     * @returns 다음단계 건물 반환
     */
    getNextBuild():BUILDING{
        if(!this.land) return BUILDING.NONE
        if(!this.villa) return BUILDING.VILLA
        if(!this.building) return BUILDING.BUILDING
        if(!this.hotel) return BUILDING.HOTEL
        if(!this.landMark) return BUILDING.LANDMARK

        return BUILDING.NONE
    }
    isMoreBuildable():boolean{
        return this.getNextBuild()!==BUILDING.NONE
    }
    isEmpty():boolean{
        return !this.land
    }
    /**
     * 현재 건설 가능한 건물 반환
     * @returns 
     */
    getBuildables():BUILDING[]{
        let bs=new Set<BUILDING>([BUILDING.LAND,BUILDING.VILLA,BUILDING.BUILDING,BUILDING.HOTEL])
        if(!this.land) return Array.from(bs)
        bs.delete(BUILDING.LAND)
        if(this.villa) bs.delete(BUILDING.VILLA)
        if(this.building) bs.delete(BUILDING.BUILDING)
        if(this.hotel) bs.delete(BUILDING.HOTEL)

        if(this.landMark) return []
        if(this.villa && this.building && this.hotel) return [BUILDING.LANDMARK]
        return Array.from(bs)
    }
    /**
     * 최소 건설비용(가장 싼 건물가격) 반환
     * @returns 
     */
    getMinimumBuildPrice():number{
        let buildable=this.getBuildables()
        if(buildable.length===0) return 0

        return this.buildPrice.getSingle(buildable[0])
    }
    /**
     * 현재 건설된 건물 반환
     * @returns 
     */
    getCurrentBuilds(): BUILDING[] {
        let bs=new Set<BUILDING>()
        if(this.land)bs.add(BUILDING.LAND)
        if(this.villa) bs.add(BUILDING.VILLA)
        if(this.building) bs.add(BUILDING.BUILDING)
        if(this.hotel) bs.add(BUILDING.HOTEL)
        if(this.landMark) bs.add(BUILDING.LANDMARK)
        return Array.from(bs)
    }
    /**
     * 건설 가능한 건물의 가격,통행료, 건설가능여부 반환
     * @param cycleLevel 
     * @returns 
     */
    getBuildingAvaliability(cycleLevel:number):ServerPayloadInterface.buildAvaliability[]{
        let list:ServerPayloadInterface.buildAvaliability[]=[]
        let buildables=this.getBuildables()
        for(let i=1;i<6;++i){

            if(!buildables.includes(i)) {
                if(i===BUILDING.LANDMARK) continue//랜드마크 건설 불가시 배열에 안넣음
                
                list.push({
                    cycleLeft:0,toll:0,
                    buildPrice:0,type:i,have:true
                })
                continue
            }

            let cycleLeft=0
            if(i===BUILDING.BUILDING){
                cycleLeft=Math.max(0,2-cycleLevel)
            }
            if(i===BUILDING.HOTEL){
                cycleLeft=Math.max(0,3-cycleLevel)
            }
            list.push({
                cycleLeft:cycleLeft,toll:this.baseToll.getSingle(i),
                buildPrice:this.buildPrice.getSingle(i),type:i,have:false
            })
        }

        //랜드마크 못짓는데 모든 건물이 보유중 혹은 아직 못지으면 빈 배열 반환
        if(list.every((b)=>b.cycleLeft>0 || b.have) && !buildables.includes(BUILDING.LANDMARK)) return []

        return list
    }
    
    isLandMark(): boolean {
        return this.landMark
    }
    getLandMarkBuildData(isFree:boolean){
        return [{
            cycleLeft:0,toll:this.baseToll.getSingle(BUILDING.LANDMARK),
            buildPrice:isFree?0:this.buildPrice.getSingle(BUILDING.LANDMARK),type:BUILDING.LANDMARK,have:false
        }]
    }
    /**
     * 건물 한단계 다운그레이드
     * @returns 
     */
    removeOneHouse():BUILDING{
        if(this.landMark) return BUILDING.NONE

        if(this.hotel) {
            this.hotel=false
            return BUILDING.HOTEL
        }
        if(this.building) {
            this.building=false
            return BUILDING.BUILDING
        }
        if(this.villa) {
            this.villa=false
            return BUILDING.VILLA
        }

        return BUILDING.NONE
    }
    /**
     *  빈땅으로 바꿈
     */
    removeAll(){
        this.villa=false
        this.building=false
        this.hotel=false
        this.landMark=false
        super.removeAll()
    }
    getBaseToll():number{
        return this.baseToll.get(this)
    }
    /**
     * 소모된 건설비용
     * @returns 
     */
    getBuildPrice():number{
        return this.buildPrice.getSpendPrice(this)
    }
    /**
     * 인수비용(건설비용 x2)
     * @returns 
     */
    getBuyOutPrice():number{
        return this.buildPrice.getSpendPrice(this) * 2
    }
    canBuyOut(): boolean {
        return this.land && !this.landMark
    }
    removeColorMonopoly(){
        this.multiplier.monopoly=false
    }
    setColorMonopoly(){
        this.multiplier.monopoly=true
    }
    toString()
    {
        return super.toString() + `house1:${this.villa} house2:${this.building} house3:${this.hotel} landmark:${this.landMark}`
    }
}
export {LandTile}