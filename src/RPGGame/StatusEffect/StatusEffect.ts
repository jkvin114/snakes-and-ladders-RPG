import type{ Player } from "../player/player"
import { decrement } from "../core/Util"
import { EFFECT } from "./enum"
import type{ Damage } from "../core/Damage"
import { EFFECT_TIMING, EFFECT_TYPE } from "./enum"

abstract class StatusEffect {
	protected duration: number
	public isgood: boolean
	public owner: Player
	public readonly timing: EFFECT_TIMING
	public readonly id: EFFECT
	public namespace: string
	public source: string | null
	public effectType: EFFECT_TYPE
	public data: number[]
	static readonly DURATION_UNTIL_LETHAL_DAMAGE = 1000
	static readonly DURATION_UNTIL_DEATH = 2000
	static readonly DURATION_PERMANENT = 10000

	constructor(id: EFFECT, dur: number, timing: EFFECT_TIMING) {
		this.id = id
		this.duration = dur
		this.isgood = false
		this.owner = null
		this.timing = timing
		this.namespace = ""
		this.source = null
		this.data = []
		// if (timing === EFFECT_TIMING.BEFORE_SKILL || timing === EFFECT_TIMING.TURN_END) {
		// 	this.duration += 1
		// }
	}
	applyTo(owner: Player) {
		this.owner = owner
		//	if(!owner.isMyTurn()) this.duration+=1

		return this
	}
	setNamespace(name: string) {
		this.namespace = name
		return this
	}
	setGood() {
		this.isgood = true
		return this
	}
	setSourceId(source: string) {
		this.source = source
		return this
	}
	addData(d: number) {
		this.data.push(d)
		return this
	}
	setData(d: number[]) {
		this.data = d
		return this
	}
	onBeforeReapply() {
		return 0
	}
	onBeforeRemove() {}

	/**
	 *
	 * @returns false if duration is over
	 */
	cooldown() {
		if (this.duration >= StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE) return true

		this.duration = decrement(this.duration)

		return this.duration > 0
	}
	shouldResetOnLethalDamage() {
		if (this.duration >= StatusEffect.DURATION_UNTIL_DEATH) {
			return false
		}
		return true
	}
	shouldResetOnDeath() {
		if (this.duration >= StatusEffect.DURATION_PERMANENT) {
			return false
		}

		return true
	}
	tick(currentTurn: number): boolean {
		return false
	}
	onHitWithSkill(target: Player, damage: Damage): Damage | null {
		return null
	}
	onHitWithBasicAttack(target: Player, damage: Damage): Damage | null {
		return null
	}
	onFinalDamage(damage: number) {}
	onSkillDamage(damage: Damage, source: string): Damage | null {
		return null
	}
	onBasicAttackDamage(damage: Damage, source: string): Damage | null {
		return null
	}
	onObstacleDamage(damage: Damage): Damage | null {
		return null
	}
}

class NormalEffect extends StatusEffect {
	constructor(id: EFFECT, dur: number, timing: EFFECT_TIMING) {
		super(id, dur, timing)
		this.effectType = EFFECT_TYPE.NORMAL
	}
}



export {
	StatusEffect,NormalEffect
}
