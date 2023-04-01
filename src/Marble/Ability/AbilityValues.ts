import { sample } from "../util"

export interface AbilityValue{
    value:number
}

/**
 * ability 의 현재 상태 저장,
 * ability_name 하나당 한개만 존재,
 * 기본값: value:0,change:100,limit:무한, 아이템이름:""
 */
 export class AbilityAttributes{
    private value:number //각성 전 값
    private upgradeValue:number //각성 시 값
    private limit:number //횟수제한 
    private baseChance:number //기본 확률
    currentChance:number //현재 확률
    private upgraded:boolean
    private itemName:string
    private korname:string
    private firstOnly:boolean //첫 발동 시도시 발동 안되면 영원히 발동 안됨
    private limitLeft:number
    constructor(){
        this.value=0
        this.upgradeValue=0
        this.limit=Infinity
        this.limitLeft=Infinity
        this.baseChance=100
        this.currentChance=this.baseChance
        this.upgraded=false
        this.itemName=""
        this.korname=""
        this.firstOnly=false
    }

    setValue(value:number,upgradeValue?:number){
        this.value=value
        if(upgradeValue!==undefined) this.upgradeValue=upgradeValue
        return this
    }
    setLimit(limit:number){
        this.limit=limit
        this.limitLeft=limit
        return this
    }
    /**
     * 
     * @param chance [0,100] (percent)
     * @returns 
     */
    setChance(chance:number){
        this.baseChance=chance
        this.currentChance=this.baseChance
        return this
    }
    setItemName(name:string,korname:string){
        this.itemName=name
        this.korname=korname
        return this
    }
    setFirstOnly(){
        this.limit=1
        this.limitLeft=1
        this.firstOnly=true
        return this
    }

    use(){
        this.limitLeft=Math.max(0,this.limitLeft-1)
    }
    upgrade(){
        this.upgraded=true
    }
    get abilityValue():AbilityValue{
        return {value:this.getValue()}
    }
    getValue(){
        if(this.upgraded) return this.upgradeValue
        return this.value
    }
    sample():boolean{
        let result=false
        if(this.limitLeft>0) result = sample(this.currentChance*0.01)

        if(this.firstOnly) this.use() //처음만 발동되는 능력이면 발동여부 상관없이 사용 판정

        return result
    }
    /**
     * 확률 성장
     * @param change 
     */
    updateChance(change:number){
        this.currentChance+=change
    }
    /**
     * 확률 초기화
     */
    resetChance(){
        this.currentChance=this.baseChance
    }
    getItemName(){
        return this.itemName
    }
    getItemKorName(){
        return this.korname
    }
    getDescription(base:string){
        const chanceRegex = new RegExp(/\$c/g);
        const valueRegex = new RegExp(/\$v/g);
        let prefix=""
        
        
        base=base.replace(valueRegex,String(this.value))
        base=base.replace(/\$u/,String(this.upgradeValue))

        if(this.firstOnly){
            prefix+="(최초 1회)"
        }
        else if(this.limit !==Infinity){
            base+=`(${this.limitLeft}/${this.limit})`
        }

        if(chanceRegex.test(base)){
            base=base.replace(chanceRegex,String(this.baseChance))
        }
        else if(this.baseChance < 100){
            prefix+=String(this.baseChance)+"% 확률로 "
        }
        if(this.upgradeValue>0)
            base+="(6턴이후 "+this.upgradeValue+")"
        return prefix+base
    }
    
}