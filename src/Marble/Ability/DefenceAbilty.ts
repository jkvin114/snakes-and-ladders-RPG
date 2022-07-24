import { Action, ActionModifyFunction, ACTION_TYPE } from "../action/Action";
import { ACTION_SOURCE_TYPE } from "../action/ActionSource";
import { QueryAction } from "../action/QueryAction";
import { Ability, ConfirmQuery } from "./Ability";

/**
 * 방어
 */
export class DefenceAbility extends Ability{
    constructor(name:string,type:number,source:ACTION_SOURCE_TYPE){
        super(name,type,source)
    }
}


export class DefenceCardAbility extends DefenceAbility implements ConfirmQuery{
    modifiableActions: ACTION_TYPE[];
    constructor(name:string,source:ACTION_SOURCE_TYPE,actionToDefend:ACTION_TYPE[]){
        super(name,0,source)
        this.modifiableActions=actionToDefend
    }
    
    onConfirm(): ActionModifyFunction {
        let modifiableActions=this.modifiableActions
        let name=this.name
        return (actionToModify:Action)=>{
            
            if(!modifiableActions.includes(actionToModify.type)) return

            if(name==="angel_card"){
                if(actionToModify.type===ACTION_TYPE.CLAIM_TOLL) actionToModify.applyMultiplier(0)
                else if(actionToModify.type===ACTION_TYPE.ATTACK_TILE) actionToModify.off()
            }
            if(name==="discount_card"){
                if(actionToModify.type===ACTION_TYPE.CLAIM_TOLL) actionToModify.applyMultiplier(0.5)
            }
            if(name==="shield_card"){
                if(actionToModify.type===ACTION_TYPE.ATTACK_TILE) actionToModify.off()
            }
        }
    }

    onCancel(actionToModify: Action): void {}

}