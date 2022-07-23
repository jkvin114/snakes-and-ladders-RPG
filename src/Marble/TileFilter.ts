
export class TileFilter{
    static BUILDABLE=0
    static ALL=1
    owners:number[]
    ownedOnly:boolean
    myLandOnly:boolean
    emptyOnly:boolean
    moreBuildable:boolean
    canBuyOut:boolean
    landmarkOnly:boolean
    excludeLandMark:boolean
    cornerOnly:boolean
    specialOnly:boolean
    exclude:Set<number>
    excludeMyPos:boolean
    sameLine:boolean
    radius:number
    buildableOnly:boolean
    landTileOnly:boolean
    enemyLandOnly:boolean

    static ALL_EXCLUDE_MY_POS=()=>new TileFilter().setExcludeMyPos()
    static MORE_BUILDABLE_MY_LAND=()=>new TileFilter().fromBuildable().setOnlyMoreBuildable().setMyLandOnly()
    static MY_LAND=()=>new TileFilter().fromBuildable().setMyLandOnly()
    static MY_LANDTILE=()=>new TileFilter().fromBuildable().setMyLandOnly().setLandTileOnly()
    static MY_LANDMARK=()=>new TileFilter().fromBuildable().setMyLandOnly().setLandMarkOnly()
    static LANDS_CAN_BUYOUT=()=>new TileFilter().fromBuildable().setOnlyCanBuyOut()
    static EMPTY_LANDTILE=()=>new TileFilter().fromBuildable().setEmptyOnly().setLandTileOnly()
    static ENEMY_LAND=()=>new TileFilter().fromBuildable().setEnemyLandOnly()
    constructor(){
        this.owners=[]
        this.exclude=new Set<number>()
        this.radius=Infinity
        this.buildableOnly=false
        this.ownedOnly=false
        this.myLandOnly=false
        this.emptyOnly=false
        this.moreBuildable=false
        this.canBuyOut=false
        this.landmarkOnly=false
        this.excludeLandMark=false
        this.cornerOnly=false
        this.excludeMyPos=false
        this.sameLine=false
        this.specialOnly=false
        this.landTileOnly=false
        this.enemyLandOnly=false
    }
    setLandTileOnly(){
        this.landTileOnly=true
        return this
    }

    fromBuildable(){
        this.buildableOnly=true
        return this
    }
    addOwner(o:number){
        this.owners.push(o)
        return this
    }
    setOwnedOnly(){
        this.ownedOnly=true
        return this
    }
    setSpecialOnly(){
        this.specialOnly=true
        return this
    }
    setMyLandOnly(){
        this.myLandOnly=true
        return this
    }
    setEnemyLandOnly(){
        this.enemyLandOnly=true
        return this
    }
    setEmptyOnly(){
        this.emptyOnly=true
        return this
    }
    setOnlyMoreBuildable(){
        this.moreBuildable=true
        return this
    }
    setOnlyCanBuyOut(){
        this.canBuyOut=true
        return this
    }
    setLandMarkOnly(){
        this.landmarkOnly=true
        return this
    }
    setNoLandMark(){
        this.excludeLandMark=true
        return this
    }

    setCornerOnly(){
        this.cornerOnly=true
        return this
    }
    setExclude(pos:number[]){
        this.exclude=new Set(pos)
        return this
    }
    setExcludeMyPos(){
        this.excludeMyPos=true
        return this
    }
    setSameLineOnly(){
        this.sameLine=true
        return this
    }
    inRadius(rad:number){
        this.radius=rad
        return this
    }

}