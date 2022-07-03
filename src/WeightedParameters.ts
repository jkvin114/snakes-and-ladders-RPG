import { dot, normalize } from "./core/Util"

class Parameter{
    array:number[]
    id:number
    constructor(...params:number[]){
        this.array=[...params]
        
    }
    multiply(weights:ConstrainedWeight[]){
        if(weights.length !== this.array.length) return 0
        return dot(this.array,weights)
    }
    static selectBest<T extends Parameter>(params:T[],weights:number[]){
        if(params[0].array.length !== weights.length) return -1
        params=Parameter.normalize(params)
        let best=-Infinity
        let bestId=-1
        for(let param of params){
            let val=param.multiply(weights)
            if(val > best) {
                best=val
                bestId=param.id
            }
        }
        return bestId
    }

    static normalize<T extends Parameter>(params:T[]){
        for(let i=0;i<params[0].array.length;++i){
            let column=[]
            for(let j=0;j<params.length;++j){
                column.push(params[j].array[i])
            }
            column=normalize(column)

            for(let j=0;j<params.length;++j){
                params[j].array[i]=column[j]
            }
        }
        return params
    }
}
class ConstrainedWeight{
    static TYPE_NO_LIMIT=0
    static TYPE_MAXIMUM=1
    static TYPE_MINIMUM=2
    static TYPE_EQUAL=3
    static TYPE_NOT_EQUAL=4

    weight:number
    limit:number
    constrainType:number
    name:PARAM
    constructor(weight:number,name:PARAM){
        this.name=name
        this.weight=weight
        this.limit=0
        this.constrainType=ConstrainedWeight.TYPE_NO_LIMIT
    }
    setLimit(type:number,limit:number){
        this.limit=limit
        this.constrainType=type
        return this
    }
    meetRequirement(value:number){
        switch(this.constrainType){
            case ConstrainedWeight.TYPE_NO_LIMIT: return true
            case ConstrainedWeight.TYPE_EQUAL: 
                if(value===this.limit) return true
                break
            case ConstrainedWeight.TYPE_NOT_EQUAL: 
                if(value!==this.limit) return true
                break
            case ConstrainedWeight.TYPE_MINIMUM:
                if(value >= this.limit) return true
                break
            case ConstrainedWeight.TYPE_MAXIMUM:
                if(value <= this.limit) return true
                break
        }
        return false
    }
}

enum PARAM{
    HP,HP_RATIO,IS_ENEMY,HP_AND_SHIELD,PLAYER_POS,HAS_SHIELD_EFFECT,HAS_ROOT_EFFECT,HAS_INVISIBILITY_EFFECT
}

interface ITargetParameter{
    hp:number|ConstrainedWeight
    hpAndShield:number|ConstrainedWeight
    hpRatio:number|ConstrainedWeight
    pos:number|ConstrainedWeight
    isEnemy:number|ConstrainedWeight
    hasEffect:{
        shieldEffect:number|ConstrainedWeight
        stunEffect:number|ConstrainedWeight
        invisibleEffect:number|ConstrainedWeight
    }
}

class TargetParameter extends Parameter{
    hp:number
    hpAndShield:number
    hpRatio:number
    pos:number
    isEnemy:number
    hasEffect:{
        shieldEffect:number
        stunEffect:number
        invisibleEffect:number
    }

    constructor(values:Map<number,number>){
        super(Array.from(values.values()))
        
        this.id=turn
        this.isEnemy=isEnemy
        this.hpRatio=hpRatio
        this.hp=hp
        this.hpAndShield=hpAndShield
        this.pos=pos
        this.hasEffect.shieldEffect=shieldeffect
        this.hasEffect.stunEffect=stuneffect
        this.hasEffect.invisibleEffect=invisibleEffect
        
    }
}
class TargetParameterWeight implements ITargetParameter{
    hp:ConstrainedWeight
    hpAndShield:ConstrainedWeight
    hpRatio:ConstrainedWeight
    pos:ConstrainedWeight
    isEnemy:ConstrainedWeight
    hasEffect:{
        shieldEffect:ConstrainedWeight
        stunEffect:ConstrainedWeight
        invisibleEffect:ConstrainedWeight
    }
    constructor(hp:ConstrainedWeight,hpRatio:ConstrainedWeight,hpAndShield:ConstrainedWeight,pos:ConstrainedWeight,shieldeffect:ConstrainedWeight,stuneffect:ConstrainedWeight,invisibleEffect:ConstrainedWeight){
        this.hpRatio=hpRatio
        this.hp=hp
        this.hpAndShield=hpAndShield
        this.pos=pos
        this.hasEffect.shieldEffect=shieldeffect
        this.hasEffect.stunEffect=stuneffect
        this.hasEffect.invisibleEffect=invisibleEffect
    }
    toArray(){
        return [this.hp,this.hpRatio,this.hpAndShield,this.pos,this.hasEffect.shieldEffect,this.hasEffect.stunEffect,this.hasEffect.invisibleEffect]
    }
    toWeightArray(){
        return [this.hp,this.hpRatio,this.hpAndShield,this.pos,this.hasEffect.shieldEffect,this.hasEffect.stunEffect,this.hasEffect.invisibleEffect]
    }
}
class TileParameter extends Parameter{
    pos:number
    obstacleWeight:number
    isStore:number
    distance:number
    allyCount:number
    enemyCount:number
    constructor(pos:number){
        super()
        this.id=pos
    }
}