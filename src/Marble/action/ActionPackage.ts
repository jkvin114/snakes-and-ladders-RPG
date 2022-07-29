import { Ability } from "../Ability/Ability"
import { ABILITY_NAME, ABILITY_REGISTRY } from "../Ability/AbilityRegistry"
import type { AbilityValues } from "../Ability/AbilityValues"
import { CARD_NAME } from "../FortuneCard"
import type { Action } from "./Action"
import type { ActionSource } from "./ActionSource"
import { EarnMoneyAction, PayMoneyAction, TileAttackAction } from "./InstantAction"
import { AskAttackDefenceCardAction, AskBuyoutAction, AskTollDefenceCardAction } from "./QueryAction"

class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: {name:ABILITY_NAME,turn:number}[]
	executedAbilities: {name:ABILITY_NAME,turn:number}[]
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
	addBlocked(a: ABILITY_NAME,turn:number) {
		this.blockedAbilities.push({name:a,turn:turn})
		return this
	}
	addExecuted(a: ABILITY_NAME,turn:number) {
		this.executedAbilities.push({name:a,turn:turn})
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
	addAction(action:Action,ability:Ability|undefined){
		if(!ability) return
		if(ability.isAfterMain()){
			this.addAfter(action)
		}
		else{
			this.addBefore(action)
		}
	}
	applyReceiveSalaryAbility(receiver:number,source:ActionSource,abilities:Map<ABILITY_NAME,AbilityValues>){
		let main=this.main[0]
		
		if(abilities.has(ABILITY_NAME.SALARY_BONUS)){
			let value=abilities.get(ABILITY_NAME.SALARY_BONUS)
			this.addExecuted(ABILITY_NAME.SALARY_BONUS,receiver)
			if(value!=null)
				main.applyMultiplier(1+value.getValue()*0.01)
		}

		return this
	}
	applyThrowDiceAbility(invoker:number,source:ActionSource,abilities:Map<ABILITY_NAME,AbilityValues>,dice:number){
		let main=this.main[0]
		for(const [name,value] of abilities){
			if(name===ABILITY_NAME.MONEY_ON_DICE){
				this.addExecuted(ABILITY_NAME.MONEY_ON_DICE,invoker)
				this.addAction(new EarnMoneyAction(invoker,source,value.getValue() * dice),ABILITY_REGISTRY.get(name))
			}
		}
		return this
	}
	/**
	 * 
	 * @param invokerTurn 통행료 징수하는 플레이어
	 * @param eventSource 
	 * @param offences 
	 * @param defences 
	 * @param payerTurn 통행료 내는 플레이어
	 * @returns 
	 */
	applyClaimTollAbility(
		invokerTurn: number,
		eventSource: ActionSource,
		offences: Map<ABILITY_NAME,AbilityValues>,
		defences: Map<ABILITY_NAME,AbilityValues>,
		payerTurn:number
	): ActionPackage {
        let main=this.main[0]
        if(!(main instanceof  PayMoneyAction)) return this
        

		if (eventSource.hasFlag("toll_free")) this.main[0].applyMultiplier(0)

		if (defences.has(ABILITY_NAME.ANGEL_CARD)) {
			let ability=ABILITY_REGISTRY.get(ABILITY_NAME.ANGEL_CARD)
			if(ability!=null){
				this.addExecuted(ABILITY_NAME.ANGEL_CARD,payerTurn)
				this.addAction(new AskTollDefenceCardAction(payerTurn, ability.getSource(), CARD_NAME.ANGEL ,main.amount,0)
				.setBlockActionId(main.getId()).setAttacker(invokerTurn),ability)
			} 
			
		}
		else if (defences.has(ABILITY_NAME.DISCOUNT_CARD)) {
			let ability=ABILITY_REGISTRY.get(ABILITY_NAME.DISCOUNT_CARD)
			if(ability!=null){
				this.addExecuted(ABILITY_NAME.DISCOUNT_CARD,payerTurn)
				this.addAction(new AskTollDefenceCardAction(payerTurn, ability.getSource(), CARD_NAME.DISCOUNT,main.amount,main.amount*0.5)
				.setBlockActionId(main.getId()).setAttacker(invokerTurn),ability)
			}
		}

		return this
	}
	/**
	 * 
	 * @param invokerTurn 공격하는 플레이어
	 * @param eventSource 
	 * @param offences 
	 * @param defences 
	 * @param attackName 
	 * @param victim 공격당하는 플레이어
	 * @returns 
	 */
	applyAttemptAttackAbility(
		invokerTurn: number,
		eventSource: ActionSource,
		offences: Map<ABILITY_NAME,AbilityValues>,
		defences: Map<ABILITY_NAME,AbilityValues>,
        attackName:string,
		victim:number
	): ActionPackage {
        let main=this.main[0]
        if(!(main instanceof TileAttackAction)) return this

        if (defences.has(ABILITY_NAME.ANGEL_CARD)) {
			let ability=ABILITY_REGISTRY.get(ABILITY_NAME.ANGEL_CARD)
			if(ability!=null){
				this.addExecuted(ABILITY_NAME.ANGEL_CARD,victim)
				this.addAction(new AskAttackDefenceCardAction(victim, ability.getSource(), CARD_NAME.ANGEL ,attackName)
				.setBlockActionId(main.getId()).setAttacker(invokerTurn),ability)
			}
		}

		else if (defences.has(ABILITY_NAME.SHIELD_CARD)) {
			let ability=ABILITY_REGISTRY.get(ABILITY_NAME.SHIELD_CARD)
			if(ability!=null){
				this.addExecuted(ABILITY_NAME.SHIELD_CARD,victim)
				this.addAction(new AskAttackDefenceCardAction(victim, ability.getSource(), CARD_NAME.SHIELD,attackName)
            	.setBlockActionId(main.getId()).setAttacker(invokerTurn),ability)
			}
		}
		return this
	}

	applyAbilityClaimBuyout(
		invokerTurn: number,
		eventSource: ActionSource,
		offences: Map<ABILITY_NAME,AbilityValues>,
		defences: Map<ABILITY_NAME,AbilityValues>,
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
