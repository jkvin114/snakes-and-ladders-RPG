import { Ability,ConfirmQuery } from "./Ability/Ability";
import { ABILITY_NAME } from "./Ability/AbilityRegistry";
import { DefenceAbility } from "./Ability/DefenceAbilty";
import { Action } from "./action/Action";
import { ActionPackage } from "./action/ActionPackage";
import { ActionSource } from "./action/ActionSource";

/**
 *
 * @param eventSource
 * @param actions [actions before main, actions after main(movement actions), true if it blocks main action]
 * @returns
 */
export function abilityToAction(
	eventSource: ActionSource | null,
	invokingAbility: ABILITY_NAME[] | null,
	revokingAbility?: ABILITY_NAME[] | null
): ActionPackage {
	if(!invokingAbility) return new ActionPackage()


	return new ActionPackage()
}