import { Ability } from "./Abilty";
import { Action } from "./action/Action";
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
): [Action[], Action[], boolean] | null {
	return null
}