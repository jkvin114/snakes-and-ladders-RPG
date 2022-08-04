import { Action, ActionModifyFunction, ACTION_TYPE } from "../action/Action";
import { ACTION_SOURCE_TYPE } from "../action/ActionTrace";
import { Ability, ConfirmQuery } from "./Ability";
import { ABILITY_NAME } from "./AbilityRegistry";

/**
 * 방어
 */
export class DefenceAbility extends Ability{
    constructor(name:ABILITY_NAME){
        super(name)
    }
}


export class DefenceCardAbility extends DefenceAbility{
    constructor(name:ABILITY_NAME){
        super(name)
    }
    
}