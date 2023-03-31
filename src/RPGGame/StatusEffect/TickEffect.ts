import type { Damage } from "../core/Damage"
import { CALC_TYPE } from "../core/Util"
import { SkillAttack } from "../core/skill"
import { SKILL,ITEM } from "../data/enum"
import type { Player } from "../player/player"
import { StatusEffect } from "./StatusEffect"
import { EFFECT, EFFECT_TYPE, TICK_EFFECT_TIMING } from "./enum"
import type { TickActionFunction } from "./types"


export class TickEffect extends StatusEffect {
	static readonly FREQ_EVERY_TURN = 1
	static readonly FREQ_EVERY_PLAYER_TURN = 2

	protected tickAction: TickActionFunction
	protected frequency: number
	protected sourceSkill: SKILL | number //스킬 판정인지 여부, -1 이면 스킬판정 아님

	constructor(id: EFFECT, dur: number, frequency: number) {
		super(id, dur, TICK_EFFECT_TIMING)
		this.frequency = frequency
		this.effectType = EFFECT_TYPE.TICK
		this.sourceSkill = -1
		this.tickAction = function (this: Player) {
			return false
		}
	}

	setAction(tickAction: TickActionFunction) {
		this.tickAction = tickAction
		return this
	}
	//make tick damage to be treated as skill hit
	setSourceSkill(skill: SKILL) {
		this.sourceSkill = skill
		return this
	}
	/**
	 *
	 * @param currentTurn current turn of player at the point tick is called
	 * @returns true if the owner died
	 */
	tick(currentTurn: number): boolean {
		if (currentTurn !== this.owner.turn && this.frequency === TickEffect.FREQ_EVERY_TURN) {
			return false
		}
		if (this.tickAction && !this.owner.dead) return this.tickAction.call(this.owner)

		return false
	}

	protected doDamage(damage: Damage): boolean {
		if (this.owner.dead) return false

		if (this.owner.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)) {
			damage.updateAllDamage(CALC_TYPE.multiply, 0.75)
		}

		if (!this.source) {
			return this.owner.doObstacleDamage(damage.getTotalDmg(), this.namespace)
		} else if (this.sourceSkill !== -1) {
			return this.owner.mediator.skillAttackAuto(
				this.owner.mediator.getPlayer(this.source),
				this.owner.UEID,
				new SkillAttack(damage, this.namespace, this.sourceSkill, this.owner.mediator.getPlayer(this.source))
			)
		} else {
			return this.owner.mediator.attackSingle(this.owner.mediator.getPlayer(this.source), this.owner, damage, this.namespace)
		}
	}
}