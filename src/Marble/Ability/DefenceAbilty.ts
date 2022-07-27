import { Action, ActionModifyFunction, ACTION_TYPE } from "../action/Action";
import { ACTION_SOURCE_TYPE } from "../action/ActionSource";
import { Ability, ConfirmQuery } from "./Ability";

/**
 * 방어
 */
export class DefenceAbility extends Ability{
    constructor(name:string,type:number,source:ACTION_SOURCE_TYPE){
        super(name,type,source)
    }
}


export class DefenceCardAbility extends DefenceAbility{
    constructor(name:string,source:ACTION_SOURCE_TYPE){
        super(name,0,source)
    }
    
}