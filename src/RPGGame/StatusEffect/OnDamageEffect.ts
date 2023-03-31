import type { Damage } from "../core/Damage"
import { OnConditionEffect } from "."
import { EFFECT, EFFECT_TYPE, ON_DAMAGE_EFFECT_TIMING } from "./enum"
import type { OnDamageFunction } from "./types"

/**
 * called on taking damage
 */
export class OnDamageEffect extends OnConditionEffect {
	protected sourceIds: string[] //only active when receiving damage from these players
	protected onDamage: OnDamageFunction
	protected damages: number[]

	static readonly SKILL_DAMAGE = 0
	static readonly BASICATTACK_DAMAGE = 1
	static readonly OBSTACLE_DAMAGE = 2

	constructor(id: EFFECT, dur: number, f: OnDamageFunction) {
		super(id, dur, ON_DAMAGE_EFFECT_TIMING)
		this.onDamage = f
		this.effectType = EFFECT_TYPE.ONDAMAGE
		this.sourceIds = []
		this.damages = [OnDamageEffect.SKILL_DAMAGE, OnDamageEffect.BASICATTACK_DAMAGE, OnDamageEffect.OBSTACLE_DAMAGE]
	}

	on(damages: number[]) {
		this.damages = damages
		return this
	}

	from(ids: string[]) {
		this.sourceIds = ids
		return this
	}
	private isValidSource(source: string) {
		if (this.sourceIds.length === 0) return true
		return this.sourceIds.includes(source)
	}
	/**
	 * called when receiving skill damage
	 * @param damage
	 * @returns modified damage
	 */
	onSkillDamage(damage: Damage, source: string): Damage | null {
		if (
			this.damages.includes(OnDamageEffect.SKILL_DAMAGE) &&
			this.isValidSource(source) &&
			this.checkSecondaryCondition()
		) {
			damage = this.onDamage(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
		return damage
	}
	/**
	 * called when receiving basic attack damage
	 * @param damage
	 * @returns modified damage
	 */
	onBasicAttackDamage(damage: Damage, source: string): Damage | null {
		if (
			this.damages.includes(OnDamageEffect.BASICATTACK_DAMAGE) &&
			this.isValidSource(this.source) &&
			this.checkSecondaryCondition()
		) {
			damage = this.onDamage(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
		return damage
	}

	/**
	 * called when receiving obstacle damage
	 * @param damage
	 * @returns modified damage
	 */
	onObstacleDamage(damage: Damage): Damage | null {
		if (this.damages.includes(OnDamageEffect.OBSTACLE_DAMAGE) && this.checkSecondaryCondition()) {
			damage = this.onDamage(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
		return damage
	}
}
