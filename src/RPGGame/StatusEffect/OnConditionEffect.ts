import { ITEM } from "../data/enum"
import { StatusEffect } from "./StatusEffect"
import type { EFFECT_TIMING } from "./enum"


export class OnConditionEffect extends StatusEffect {
	private conditionActiveItem: ITEM
	constructor(id: number, dur: number, timing: EFFECT_TIMING) {
		super(id, dur, timing)
		this.conditionActiveItem = ITEM.EMPTY
	}
	setConditionActiveItem(item: ITEM) {
		this.conditionActiveItem = item
		return this
	}
	protected checkSecondaryCondition() {
		if (this.conditionActiveItem === ITEM.EMPTY) return true

		return this.owner && this.owner.inven.isActiveItemAvailable(this.conditionActiveItem)
	}
	protected onAfterInvoke() {
		if (this.conditionActiveItem !== ITEM.EMPTY) this.owner?.inven.useActiveItem(this.conditionActiveItem)
	}
}