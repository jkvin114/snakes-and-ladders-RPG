import { ABILITY_NAME } from "../Ability/AbilityRegistry"

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
export class ActionSource {
	eventType: ACTION_SOURCE_TYPE //이벤트 종류(이동/통행료/인수 등 행동 분류)
	abilityType: number //능력 종류(힐링류 잘가북류 등 능력 분류)
    abilityName:ABILITY_NAME
	sourceItem: number //발동하는데 사용된 능력/행템 고유 id
    name:string
    flags:Set<string>
    private prev:ActionSource|null
    constructor(){
        this.eventType=ACTION_SOURCE_TYPE.DEFAULT
        this.sourceItem=-1
        this.name=""
        this.abilityType=-1
        this.flags=new Set<string>()
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
    addFlag(flag:string){
        this.flags.add(flag)
        return this
    }
    hasFlag(flag:string){
        if(!this.prev)
            return this.flags.has(flag)
        else
            return this.prev.hasFlag(flag)
    }
    
    setPrev(source:ActionSource){
        this.prev=source
        return this
    }
    toString(){
        if(!this.prev) return `[type:${this.eventType},abilityname:${this.abilityName}]`
        return this.prev.toString() + `-> [type:${this.eventType},abilityname:${this.abilityName}]`
    }
}
