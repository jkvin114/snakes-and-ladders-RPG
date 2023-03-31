import type{ Damage } from "../core/Damage"
import { EFFECT, EFFECT_TYPE, ONHIT_EFFECT_TIMING } from "./enum"
import type { Entity } from "../entity/Entity"
import type { Player } from "../player/player"
import { onHitFunction, ConditionFunction } from "./types"
import { OnConditionEffect } from "."

/**
 * called on dealing damage
 */
export class OnHitEffect extends OnConditionEffect {
	protected onHit: onHitFunction
	protected attack: number
	protected validTargets: string[] //only activate when attacking players in the array
	protected targetCondition: ConditionFunction
	static readonly SKILLATTACK = 0
	static readonly BASICATTACK = 1
	static readonly EVERYATTACK = 2 //skill and basic attack

	constructor(id: EFFECT, dur: number, onHit: onHitFunction) {
		super(id, dur, ONHIT_EFFECT_TIMING)
		this.onHit = onHit
		this.attack = OnHitEffect.EVERYATTACK
		this.validTargets = []
		this.effectType = EFFECT_TYPE.ONHIT
		this.targetCondition = (target: Player, owner: Player) => true
	}

	on(attack: number) {
		this.attack = attack
		return this
	}

	to(targets: string[]) {
		this.validTargets = targets
		return this
	}
	setTargetCondition(targetCondition: ConditionFunction) {
		this.targetCondition = targetCondition
		return this
	}
	private isValidTarget(target: Entity) {
		if (this.validTargets.length === 0) return true
		return this.validTargets.includes(target.UEID)
	}

	onHitWithSkill(target: Player, damage: Damage): Damage | null {
		if (
			(this.attack === OnHitEffect.SKILLATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.isValidTarget(target) &&
			this.targetCondition(this.owner, target) &&
			this.checkSecondaryCondition()
		) {
			
			damage = this.onHit.call(this.owner, target, damage, this.data)
			this.onAfterInvoke()
			
		}
		return damage
	}
	onHitWithBasicAttack(target: Player, damage: Damage): Damage | null {
		if (
			(this.attack === OnHitEffect.BASICATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.isValidTarget(target) &&
			this.targetCondition(this.owner, target) &&
			this.checkSecondaryCondition()
		) {
			damage = this.onHit.call(this.owner, target, damage, this.data)
			this.onAfterInvoke()
		} 
		 return damage
	}
}

