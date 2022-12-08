import { SKILL, SKILL_INIT_TYPE } from "../data/enum"
import type { Entity } from "../entity/Entity"
import type { Player } from "../player/player"
import type { Damage } from "./Damage"

export class SkillAttack {
	damage: Damage
	skill: number
	onKill?: (this: Player) => void //(player):void
	onHit?: (this: Player) => void //():void
	name: string
	constructor(damage: Damage, name: string) {
		this.damage = damage
		this.name = name
	}
	ofSkill(skill: SKILL) {
		this.skill = skill
		return this
	}
	setOnHit(onhit: (this: Player) => void) {
		this.onHit = onhit
		return this
	}
	setOnKill(onkill: (this: Player) => void) {
		this.onKill = onkill
		return this
	}
}

export interface SkillTargetConditionFunction {
	(this: Entity): boolean
}

export class SkillTargetSelector {
	resultType: SKILL_INIT_TYPE
	skill_id: number
	range: number
	projSize: number
	areaSize: number
	condition: SkillTargetConditionFunction
	conditionedRange: number

	constructor(skill: number) {
		this.resultType = SKILL_INIT_TYPE.CANNOT_USE
		this.skill_id = skill
		this.range = -1
		this.projSize
		this.areaSize
		this.condition = () => true
		this.conditionedRange = -1
	}
	setType(type: number) {
		this.resultType = type
		return this
	}
	setSkill(s: number) {
		this.skill_id = s
		return this
	}
	setRange(r: number) {
		this.range = r
		return this
	}
	setAreaSize(size: number) {
		this.areaSize = size
		return this
	}

	setConditionedRange(condition: SkillTargetConditionFunction, range: number) {
		this.condition = condition
		this.conditionedRange = range
		return this
	}

	meetsCondition(target: Player) {
		if (!this.condition) return false

		return this.condition.call(target)
	}

	setProjectileSize(s: number) {
		this.projSize = s
		return this
	}
	isAreaTarget(): boolean {
		return this.resultType === SKILL_INIT_TYPE.AREA_TARGETING
	}
	isNonTarget(): boolean {
		return this.resultType === SKILL_INIT_TYPE.NON_TARGET
	}
	isNoTarget(): boolean {
		return this.resultType === SKILL_INIT_TYPE.NO_TARGET
	}
	isProjectile(): boolean {
		return this.resultType === SKILL_INIT_TYPE.PROJECTILE
	}
	isActivation(): boolean {
		return this.resultType === SKILL_INIT_TYPE.ACTIVATION
	}
}
