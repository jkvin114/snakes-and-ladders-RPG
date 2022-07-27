import type { Ability } from "../Ability/Ability"
import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { CARD_NAME } from "../FortuneCard"
import type { Action } from "./Action"
import type { ActionSource } from "./ActionSource"
import { PayMoneyAction, TileAttackAction } from "./InstantAction"
import { AskAttackDefenceCardAction, AskBuyoutAction, AskTollDefenceCardAction } from "./QueryAction"

class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: ABILITY_NAME[]
	executedAbilities: ABILITY_NAME[]
	constructor() {
		this.main = []
		this.before = []
		this.after = []
		this.blockedAbilities = []
		this.executedAbilities = []
		this.blocksMain = false
	}
	setMain(...main: Action[]) {
		this.main = main
		return this
	}
	addBefore(a: Action) {
		this.before.push(a)
		return this
	}
	addAfter(a: Action) {
		this.after.push(a)
		return this
	}
	addBlocked(a: ABILITY_NAME) {
		this.blockedAbilities.push(a)
		return this
	}
	addExecuted(a: ABILITY_NAME) {
		this.executedAbilities.push(a)
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

	applyClaimTollAbility(
		invokerTurn: number,
		eventSource: ActionSource,
		offences: Set<ABILITY_NAME>,
		defences: Set<ABILITY_NAME>
	): ActionPackage {
        let main=this.main[0]
        if(!(main instanceof  PayMoneyAction)) return this
        

		if (eventSource.hasFlag("toll_free")) this.main[0].applyMultiplier(0)

        console.log(defences)
		if (defences.has(ABILITY_NAME.ANGEL_CARD)) {
			this.addBefore(new AskTollDefenceCardAction(invokerTurn, eventSource, CARD_NAME.ANGEL ,main.amount,0)
            .setBlockActionId(main.getId()))
		}
		else if (defences.has(ABILITY_NAME.DISCOUNT_CARD)) {
            this.addBefore(new AskTollDefenceCardAction(invokerTurn, eventSource, CARD_NAME.DISCOUNT,main.amount,main.amount*0.5)
            .setBlockActionId(main.getId()))
		}

		return this
	}
	applyAbilityAttemptAttack(
		invokerTurn: number,
		eventSource: ActionSource,
		offences: Set<ABILITY_NAME>,
		defences: Set<ABILITY_NAME>,
        attackName:string
	): ActionPackage {
        let main=this.main[0]
        if(!(main instanceof TileAttackAction)) return this

        if (defences.has(ABILITY_NAME.ANGEL_CARD)) {
			this.addBefore(new AskAttackDefenceCardAction(invokerTurn, eventSource, CARD_NAME.ANGEL ,attackName)
            .setBlockActionId(main.getId()))
		}
		else if (defences.has(ABILITY_NAME.SHIELD_CARD)) {
            this.addBefore(new AskAttackDefenceCardAction(invokerTurn, eventSource, CARD_NAME.SHIELD,attackName)
            .setBlockActionId(main.getId()))
		}
		return this
	}

	applyAbilityClaimBuyout(
		invokerTurn: number,
		eventSource: ActionSource,
		offences: Set<ABILITY_NAME>,
		defences: Set<ABILITY_NAME>,
		moneyLimit: number
	): ActionPackage {
		if (!offences) return this
        let main=this.main[0]
        if(!(main instanceof AskBuyoutAction)) return this

        if(main.price > moneyLimit) main.off()

		return this
	}
}
export { ActionPackage }
