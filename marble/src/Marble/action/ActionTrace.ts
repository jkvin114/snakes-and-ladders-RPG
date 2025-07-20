import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { ACTION_LIST, ACTION_TYPE } from "./Action"

export enum ActionTraceTag{
    BUBBLE_ROOT,TRAVEL,SOPHIE_TRAVEL,GUIDEBOOK,IGNORE_BLOCK_BUYOUT,START_BUILD,
    FREE_BUYOUT,FORCEMOVED
}
export class ActionTrace {
	// private eventType: ACTION_SOURCE_TYPE //이벤트 종류(이동/통행료/인수 등 행동 분류)
	private abilityType: number //능력 종류(힐링류 잘가북류 등 능력 분류)
    private abilityName:ABILITY_NAME
	// private sourceItem: number //발동하는데 사용된 능력/행템 고유 id
    private name:string
    private tags:Set<ActionTraceTag>
    private actionType:ACTION_TYPE
    private prev:ActionTrace|null
    private isMoveStart:boolean //움직임 시작점인지 여부(request move)
    constructor(actionType:ACTION_TYPE){
        this.actionType=actionType
        // this.eventType=ACTION_SOURCE_TYPE.DEFAULT
        // this.sourceItem=-1
        this.name=""
        this.abilityType=-1
        this.tags=new Set<ActionTraceTag>()
        this.abilityName=ABILITY_NAME.NONE
        this.prev=null
        this.isMoveStart=actionType===ACTION_TYPE.REQUEST_MOVE
    }
    setName(name:string){
        this.name=name
        return this
    }
    setSourceItem(item:number){
        // this.sourceItem=item
        return this
    }
    setAbilityName(name:ABILITY_NAME){
        this.abilityName=name
        return this
    }
    setAbilityType(abilityType:number){
        this.abilityType=abilityType
        return this
    }
    isType(action:ACTION_TYPE){
        return this.abilityType===action
    }
    addTag(tag:ActionTraceTag){
        this.tags.add(tag)
        return this
    }
    hasTag(tag:ActionTraceTag):boolean{
        if(this.tags.has(tag)) return true

        if(!this.prev)
            return this.tags.has(tag)
        else
            return this.prev.hasTag(tag)
    }
    /**
     * 태그 존재여부 확인후 테그제거
     * @param tag 
     * @returns 
     */
    useTag(tag:ActionTraceTag):boolean{
        if(this.tags.has(tag)) {
            this.tags.delete(tag)
            return true
        }
        
        if(!this.prev)
            return false
        else
            return this.prev.useTag(tag)
    }
    useActionAndAbility(action:ACTION_TYPE,ability:ABILITY_NAME):boolean{
        if(this.actionType===action && this.abilityName===ability) {
            this.abilityName=ABILITY_NAME.NONE
            return true
        }
        
        if(!this.prev)
            return false
        
        return this.prev.useActionAndAbility(action,ability)
    }
    /**
     * 마지막으로 발생한 해당 타입의 액션이 ability 가지고있는지 여부
     * @param action 
     * @param ability 
     * @returns 
     */
    lastActionTypeHasAbility(action:ACTION_TYPE,ability:ABILITY_NAME):boolean{
        if(this.actionType===action) {
            if(this.abilityName===ability)
                return true
            else
                return false
        }
        if(!this.prev)
            return false
        
        return this.prev.lastActionTypeHasAbility(action,ability)
    }
    /**
     * 이번 움직임에 능력 포함되있는지
     * @param ability 
     */
    thisMoveHasAbility(ability:ABILITY_NAME):boolean{
        // console.log(this.toString())
        return this.hasAbilityInNumberOfMove(ability,0)
    }
    /**
     * 움직임 횟수 내에 능력 포함되있는지
     * @param ability 
     */
    hasAbilityInNumberOfMove(ability:ABILITY_NAME,moveStartCountLeft:number):boolean{
        // console.log(this.actionType)
        if(this.abilityName===ability) {
            return true
        }
        if(this.isMoveStart){
            moveStartCountLeft-=1
            if(moveStartCountLeft < 0)
                return this.prev!==null && this.prev.abilityName===ability
        }
        if(!this.prev)
            return false

        return this.prev.hasAbilityInNumberOfMove(ability,moveStartCountLeft)
    }
    hasAction(action:ACTION_TYPE):boolean{
        if(this.actionType===action) {
            return true
        }
        if(!this.prev)
            return false

        return this.prev.hasAction(action)
    }
    hasActionAndAbility(action:ACTION_TYPE,ability:ABILITY_NAME):boolean{
        if(this.actionType===action && this.abilityName===ability) {
            return true
        }
        
        if(!this.prev)
            return false
        
        return this.prev.hasActionAndAbility(action,ability)
    }
    setPrev(source:ActionTrace){
        this.prev=source
        return this
    }
    reset(){
        this.prev=null
        return this
    }
    toString(depth?:number):string{
        if(depth===undefined) depth=1000
        if(depth===0) return ""
        // let str=`[type:${ACTION_LIST[this.actionType]},abilityname:${this.abilityName}]`
        let str=ACTION_LIST[this.actionType]
        if(!this.prev) return `[${str} ${this.abilityName} ${[...this.tags].join(",")}]`
        return this.prev.toString(depth-1) + `-> [${str} ${this.abilityName} ${[...this.tags].join(",")}]`
    }
}
