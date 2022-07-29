import { Action, ActionModifyFunction, ACTION_TYPE, EmptyAction } from "../action/Action"
import { ActionSource, ACTION_SOURCE_TYPE } from "../action/ActionSource"
import { hexId, sample } from "../util"
import { ABILITY_NAME } from "./AbilityRegistry"
import { EVENT_TYPE } from "./EventType"

export class Ability {
    readonly name:ABILITY_NAME//능력 종류(힐링류 잘가북류 등 능력 분류)
    sourceItem:number//발동하는데 사용된 능력/행템 고유 id
    protected event:Set<EVENT_TYPE>
    readonly actionSourceType:ACTION_SOURCE_TYPE
    readonly id:string
    static readonly PRIORITY_BEFORE=0
    static readonly PRIORITY_AFTER=1
    readonly priority:number
    description:string
    // readonly owner:number
    constructor(name:ABILITY_NAME,source:ACTION_SOURCE_TYPE){
        this.name=name
        // this.owner=owner
        this.event=new Set<EVENT_TYPE>()
        this.sourceItem=-1
        this.actionSourceType=source
        this.id=hexId()
        this.priority=Ability.PRIORITY_BEFORE
        this.description=""
    }
    isFromItem(){
        return this.sourceItem>-1
    }
    desc(desc:string){
        this.description=desc
        return this
    }
    getEvents(){
        return this.event
    }
    setSourceItem(item:number){
        this.sourceItem=item
        return this
    }
    getSource(){
        let source=new ActionSource(this.actionSourceType).setAbilityName(this.name)
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
    isValidSource(source:ActionSource)
    {
        return true
    }
}

/**
 * 사용여부 물어보는 능력(방어카드)
 */
export interface ConfirmQuery{
    modifiableActions:ACTION_TYPE[]
    onConfirm():ActionModifyFunction
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
    constructor(name:ABILITY_NAME,source:ACTION_SOURCE_TYPE){
        super(name,source)
    }
}
/**
 * 자신 이동(힐링,건장,라인이동 등)
 */
class MoveAbilty extends Ability{
    pos:number
    constructor(name:ABILITY_NAME,source:ACTION_SOURCE_TYPE){
        super(name,source)
    }
}
/**
 * 상대 이동(잘가북 등)
 */
class ForceMoveAbilty extends Ability{
    pos:number
    constructor(name:ABILITY_NAME,source:ACTION_SOURCE_TYPE){
        super(name,source)
    }
}
/**
 * 끌어당기기
 */
class PullAbilty extends Ability{
    pos:number
}
/**
 * 자동건설
 */
class BuildAbility extends Ability{
    
}
/**
 * 돈 지불(반지,향수 뱃지 합의서)
 */
class PayAbility extends Ability{
    standard:number
    amount:number
    static readonly BASE_RATIO=1
    static readonly BASE_FIXED=0

    constructor(name:ABILITY_NAME,source:ACTION_SOURCE_TYPE,standard:number,amount:number){
        super(name,source)
        this.standard=standard
        this.amount=amount
    }

    getAmount(base?:number){
        if(base === undefined) return this.amount
        if(this.standard===PayAbility.BASE_RATIO) return Math.floor(base * this.amount)

        return 0
    }
}
/**
 * 주사위 찬스(무탈 등)
 */
class DiceChanceAbility extends Ability{
    
}
/**
 * 게임루프에 영향주는 능력(프리패스 등)
 */
class StateChangeAbility extends Ability{
    
}
/**
 * 상대 플레이어에게 효과 부여 등
 */
class ModifyPlayerAbility extends Ability{
    
}
/**
 * 타일 정보 수정(배수,배수잠금 등)
 */
class ModifyTileAbility extends Ability{
    
}

class OtherAbility extends Ability{

}
export class EmptyAbility extends Ability{
    constructor(){
        super(ABILITY_NAME.NONE,0)
    }
}