import { OnConditionEffect } from "."
import { EFFECT } from "./enum"
import { EFFECT_TYPE, ONHPBELOWTHRESHOLD_EFFECT_TIMING } from "./enum"
import { OnHPBelowThresholdFunction } from "./types"


export class OnHPBelowThresholdEffect extends OnConditionEffect {
	protected onHPBelowThreshold: OnHPBelowThresholdFunction
	private thresholdHpPercent: number

	constructor(id: EFFECT, dur: number, f: OnHPBelowThresholdFunction) {
		super(id, dur, ONHPBELOWTHRESHOLD_EFFECT_TIMING)
		this.onHPBelowThreshold = f
		this.thresholdHpPercent = 100
		this.effectType = EFFECT_TYPE.ON_HP_BELOW_THRESHOLD
	}

	/**
	 * set effect to invoke when hp is lower than ?% of max hp
	 * @param percent
	 */
	setInvokeConditionHpPercent(percent: number) {
		this.thresholdHpPercent = percent
		return this
	}

	/**
	 * called right before taking damage after applying resistance and other effects
	 * @param damage
	 */
	onFinalDamage(damage: number) {
		let predictedHP = this.owner.HP - damage
		if (
			predictedHP > 0 &&
			predictedHP < (this.thresholdHpPercent / 100) * this.owner.MaxHP &&
			this.checkSecondaryCondition()
		) {
			this.onHPBelowThreshold(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
	}
}