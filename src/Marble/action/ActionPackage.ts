import { ABILITY_NAME, ABILITY_REGISTRY } from "../Ability/AbilityRegistry"
import { Action } from "./Action"
import type { ActionTrace } from "./ActionTrace"
class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: { name: ABILITY_NAME; turn: number }[]
	executedAbilities: { name: ABILITY_NAME; turn: number }[]
	shouldPutMainToPending:boolean
	trace:ActionTrace
	constructor(trace:ActionTrace) {
		this.trace=trace
		this.main = []
		this.before = []
		this.after = []
		this.blockedAbilities = []
		this.executedAbilities = []
		this.blocksMain = false
		this.shouldPutMainToPending=false
	}
	addMain(main: Action) {
		main.setPrevActionTrace(this.trace)
		this.main.push(main)
		return this
	}
	addBefore(a: Action) {
		a.setPrevActionTrace(this.trace)
		this.before.push(a)
		return this
	}
	addAfter(a: Action) {
		a.setPrevActionTrace(this.trace)
		this.after.push(a)
		return this
	}
	setMainToPendingAction(){
		this.shouldPutMainToPending=true
		return this
	}
	
	addBlocked(a: ABILITY_NAME, turn: number) {
		this.blockedAbilities.push({ name: a, turn: turn })
		return this
	}
	addExecuted(a: ABILITY_NAME, abilityOwner: number) {
		this.executedAbilities.push({ name: a, turn: abilityOwner })
		return this
	}
	blockMain() {
		this.blocksMain = true
		return this
	}
	hasAfter() {
		return this.after.length !== 0
	}
	hasBefore() {
		return this.before.length !== 0
	}
	mainOnly() {
		return !this.hasAfter() && !this.hasBefore()
	}
	/**
	 * 늦게 추가하면 먼저 실행됨
	 * @param action
	 * @param ability
	 * @returns
	 */
	addAction(action: Action, ability: ABILITY_NAME) {
		let ab = ABILITY_REGISTRY.get(ability)
		if (!ab) return
		action.addAbilityToActionTrace(ability)
		if (ab.isAfterMain()) {
			this.addAfter(action)
		} else {
			this.addBefore(action)
		}
	}
}

export { ActionPackage }
