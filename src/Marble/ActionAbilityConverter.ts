import { Ability } from "./Abilty";
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
	invokingAbility: Ability | null,
	...revokingAbility: Ability[]
): ActionPackage {
	return new ActionPackage()
}