import { Action,  ACTION_TYPE, EmptyAction } from "../action/Action"
import { ActionTrace } from "../action/ActionTrace"
import { hexId, sample } from "../util"
import { ABILITY_NAME } from "./AbilityRegistry"
import { EVENT_TYPE } from "./EventType"
export interface AbilityExecution { name: ABILITY_NAME; turn: number,id?:number }

export class Ability {
    readonly name:ABILITY_NAME//능력 종류(힐링류 잘가북류 등 능력 분류)
    sourceItem:number//발동하는데 사용된 능력/행템 고유 id
    protected event:Set<EVENT_TYPE>
    readonly actionSourceType:number
    readonly id:string
    static readonly PRIORITY_BEFORE=0
    static readonly PRIORITY_AFTER=1
    protected priority:number
    description:string
    protected alerts:string[]
    // readonly owner:number
    constructor(name:ABILITY_NAME){
        this.name=name
        // this.owner=owner
        this.event=new Set<EVENT_TYPE>()
        this.sourceItem=-1
        this.actionSourceType=17
        this.id=hexId()
        this.priority=Ability.PRIORITY_BEFORE
        this.description=""
        this.alerts=[]
    }
    isFromItem(){
        return this.sourceItem>-1
    }
    desc(desc:string){
        this.description=desc
        return this
    }
    setAlerts(alerts:string[]){
        this.alerts=alerts
        return this
    }
    getAlert(id?:number){
        if(this.alerts.length===0) return this.description
        if(!id) return this.alerts[0]
        return this.alerts[id]
    }
    getEvents(){
        return this.event
    }
    setSourceItem(item:number){
        this.sourceItem=item
        return this
    }
    getSource(){
        let source=new ActionTrace(ACTION_TYPE.EMPTY).setAbilityName(this.name)
        if(this.isFromItem())
        {
            source.setSourceItem(this.sourceItem)
        }
        return source
    }
    on(event:EVENT_TYPE){
        this.event.add(event)
        return this
    }
    hasEvent(event:EVENT_TYPE){
        return this.event.has(event)
    }

    isCompatiable(ability:Ability){
        return true
    }
    isAfterMain(){
        return this.priority === Ability.PRIORITY_AFTER
    }
    isValidSource(source:ActionTrace)
    {
        return true
    }
    
}

/**
 * 사용여부 물어보는 능력(방어카드)
 */
export interface ConfirmQuery{
    modifiableActions:ACTION_TYPE[]
    onCancel(actionToModify:Action):void
}
/**
 * 칸 선택해야 하는 능력(라인이동,블랙홀)
 */
export interface TileSelectionQuery{
    postions:number[]
    setMainActionId(id:string):void
    onSelect(actionToModify:Action,pos:number,result:boolean):void
}

/**
 * 숫자 변환 능력
 * 월급보너스,통행료추가/할인/면제 등
 */
export class ValueModifierAbility extends Ability{
    constructor(name:ABILITY_NAME){
        super(name)
    }
}
/**
 * 자신 이동(힐링,건장,라인이동 등)
 */
export class MoveAbilty extends Ability{
    pos:number
    constructor(name:ABILITY_NAME){
        super(name)
        this.priority=Ability.PRIORITY_AFTER
        this.pos=0
    }
}
/**
 * 상대 이동(잘가북 등)
 */
export class ForceMoveAbilty extends Ability{
    pos:number
    constructor(name:ABILITY_NAME){
        super(name)
        this.pos=0
    }
}
/**
 * 돈 지불(반지,향수 뱃지 합의서)
 */
export class PayAbility extends Ability{
    standard:number
    static readonly BASE_RATIO=1
    static readonly BASE_FIXED=0

    constructor(name:ABILITY_NAME,standard:number){
        super(name)
        this.standard=standard
    }
}
/**
 * 주사위 찬스(무탈 등)
 */
export class DiceChanceAbility extends Ability{
    pos:number
    constructor(name:ABILITY_NAME){
        super(name)
        this.priority=Ability.PRIORITY_AFTER
        this.pos=0
    }
}
export class EmptyAbility extends Ability{
    constructor(){
        super(ABILITY_NAME.NONE)
    }
}