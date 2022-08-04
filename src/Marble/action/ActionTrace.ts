import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { ACTION_LIST, ACTION_TYPE } from "./Action"

export enum ACTION_SOURCE_TYPE{
    MOVE,//0
    DICE,
    GAMELOOP,
    ARRIVE_TILE,//3
    PAY_MONEY,
    BUYOUT,
    THREE_DOUBLES,//6
    BUILD_DIRECT,
    BUYOUT_DIRECT,
    GOD_HAND_SPECIAL_BUILD=9,
    START_TILE_BUILD=10,
    ARRIVE_TRAVEL_TILE=11,
    TRAVEL,
    ARRIVE_OLYMPIC_TILE=13,
    ARRIVE_CARD_TILE,
    COMMAND_CARD,
    ATTACK_CARD,ABILITY,
    USE_DEFENCE_CARD,
    PASS_START_TILE,
    DEFAULT
}
export class ActionTrace {
	eventType: ACTION_SOURCE_TYPE //이벤트 종류(이동/통행료/인수 등 행동 분류)
	abilityType: number //능력 종류(힐링류 잘가북류 등 능력 분류)
    abilityName:ABILITY_NAME
	sourceItem: number //발동하는데 사용된 능력/행템 고유 id
    name:string
    private tags:Set<string>
    actionType:ACTION_TYPE
    private prev:ActionTrace|null
    constructor(actionType:ACTION_TYPE){
        this.actionType=actionType
        this.eventType=ACTION_SOURCE_TYPE.DEFAULT
        this.sourceItem=-1
        this.name=""
        this.abilityType=-1
        this.tags=new Set<string>()
        this.abilityName=ABILITY_NAME.NONE
        this.prev=null
    }
    setName(name:string){
        this.name=name
        return this
    }
    setSourceItem(item:number){
        this.sourceItem=item
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
    addTag(tag:string){
        this.tags.add(tag)
        return this
    }
    hasTag(tag:string):boolean{
        if(!this.prev)
            return this.tags.has(tag)
        else
            return this.prev.hasTag(tag)
    }
    hasActionAndAbility(action:ACTION_TYPE,ability:ABILITY_NAME):boolean{
        if(this.actionType===action && this.abilityName===ability) return true

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
    toString(depth:number):string{
        if(depth===0) return ""
        // let str=`[type:${ACTION_LIST[this.actionType]},abilityname:${this.abilityName}]`
        let str=ACTION_LIST[this.actionType]
        if(!this.prev) return str
        return this.prev.toString(depth-1) + `-> [${str} ${this.name===""?'':this.name}]`
    }
}
