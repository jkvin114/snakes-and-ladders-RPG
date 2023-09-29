import type { AbilityExecution } from "../Ability/Ability"
import { ABILITY_NAME, ABILITY_REGISTRY } from "../Ability/AbilityRegistry"
import { Action } from "./Action"
import type { ActionTrace } from "./ActionTrace"
class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: AbilityExecution[]
	executedAbilities: AbilityExecution[]
	involvedAbilities:ABILITY_NAME[]
	shouldPutMainToPending:boolean

	trace:ActionTrace
	constructor(trace:ActionTrace) {
		this.trace=trace
		this.main = []
		this.before = []
		this.after = []
		this.blockedAbilities = []
		this.executedAbilities = []
		this.involvedAbilities=[]
		this.blocksMain = false
		this.shouldPutMainToPending=false
	}
	addMain(main: Action) {
		main.setPrevActionTrace(this.trace)
		main.setToActionPackageBeforeMain()
		this.main.push(main)
		return this
	}
	addBefore(a: Action) {
		a.setPrevActionTrace(this.trace)
		a.setToActionPackageBeforeMain()
		this.before.push(a)
		return this
	}
	addAfter(a: Action) {
		a.setPrevActionTrace(this.trace)
		a.setToAfterMain()
		this.after.push(a)
		return this
	}
	setMainToPendingAction(){
		this.shouldPutMainToPending=true
		return this
	}
	
	addBlocked(a: ABILITY_NAME, turn: number,alertId?:number) {
		this.blockedAbilities.push({ name: a, turn: turn,id:alertId })
		return this
	}
	addExecuted(a: ABILITY_NAME, abilityOwner: number,alertId?:number) {
		this.executedAbilities.push({ name: a, turn: abilityOwner,id:alertId })
		return this
	}
	blockMain() {
		this.blocksMain = true
		return this
	}
	replaceMain(action:Action){
		this.main=[action]
		return
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
		this.involvedAbilities.push(ability)
		action.addAbilityToActionTrace(ability)
		if (ab.isAfterMain()) {
			this.addAfter(action)
		} else {
			this.addBefore(action)
		}
	}
}

export { ActionPackage }
