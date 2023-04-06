import * as ENUM from "../data/enum"
import type { Player } from "../player/player"

import { Damage, PercentDamage } from "../core/Damage"

import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")

import * as SKILL_SCALES from "../../../res/skill_scales.json"
import { ShieldEffect } from "../StatusEffect"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { CALC_TYPE } from "../core/Util"
import { EFFECT } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"

const ID = 4
class Jean extends CharacterSkillManager {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly skill_ranges: number[]

	private readonly skill_name: string[]
	private u_target: string
	readonly duration_list: number[]

	static readonly PROJ_W = "sniper_w"
	static readonly EFFECT_ULT = "sniper_r"
	static readonly SKILL_SCALES = SKILL_SCALES[ID]
	static readonly Q_ROOT = "sniper_q_root"
	static readonly SKILL_EFFECT_NAME = ["sniper_q", "sniper_w", "sniper_r"]

	constructor(player:Player) {
		super(player,ID)
		//	this.onoff = [false, false, false]
		this.cooltime_list = [3, 3, 9]
		this.duration_list = [0, 0, 2]
		this.skill_ranges = [15, 40, 40]
		this.u_target = ""
	}

	getSkillScale() {
		return Jean.SKILL_SCALES
	}

	getSkillTrajectoryDelay(skilltype: string): number {
		if (skilltype === Jean.SKILL_EFFECT_NAME[ENUM.SKILL.Q] || skilltype === Jean.Q_ROOT) return 150

		if (skilltype === Jean.SKILL_EFFECT_NAME[ENUM.SKILL.ULT]) return 170

		return 0
	}

	private buildProjectile() {
		return new ProjectileBuilder(this.player.game, Jean.PROJ_W, Projectile.TYPE_RANGE)
			.setAction(function (this: Player) {
				this.effects.apply(EFFECT.GROUNGING, 2)
			})
			.setTrajectorySpeed(300)
			.setSize(3)
			.setSource(this.player)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s) //-1 when can`t use skill, 0 when it`s not attack skill
		//console.log("getSkillAttr" + s)
		this.pendingSkill = s
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector
					.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
					.setRange(this.skill_ranges[s])
					.setConditionedRange(function (this: Entity) {
						return this.effects.has(EFFECT.ROOT) || this.effects.has(EFFECT.GROUNGING)
					}, this.getSkillAmount("q_root_arange"))

				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(this.skill_ranges[s]).setProjectileSize(3)

				break
			case ENUM.SKILL.ULT:
				if (this.duration[ENUM.SKILL.ULT] === 0) {
					skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])
				}
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		return Jean.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos: number): Projectile | null {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.W) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.W)

			return proj
		}
		return null
	}
	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Jean.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Jean.SKILL_SCALES.R!)
		}
		return 0
	}
	getSkillAmount(key: string): number {
		if (key === "rshield") return 80
		if (key === "q_root_arange") return this.skill_ranges[ENUM.SKILL.Q] + 10

		return 0
	}

	private getUltShield() {
		return new ShieldEffect(EFFECT.SNIPER_ULT_SHIELD, 4, this.getSkillAmount("rshield"))
	}

	getSkillDamage(target: Entity, s: number): SkillAttack | null {
		//	console.log(target + "getSkillDamage" + this.pendingSkill)
		let skillattr = null
		// let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				let damage = new Damage(this.getSkillBaseDamage(s), 0, 0)
				let skillname = this.getSkillName(s)
				if (target.effects.has(EFFECT.ROOT) || target.effects.has(EFFECT.GROUNGING)) {
					damage.updateAttackDamage(CALC_TYPE.plus, this.getSkillBaseDamage(s) * 0.5)
					skillname = "sniper_q_root"
				}

				skillattr = new SkillAttack(damage, skillname, s, this.player).setTrajectoryDelay(
					this.getSkillTrajectoryDelay(skillname)
				)

				break
			case ENUM.SKILL.ULT:
				this.player.effects.applySpecial(this.getUltShield(), Jean.EFFECT_ULT)
				if (this.duration[ENUM.SKILL.ULT] === 0) {
					let onhit = function (this: Player, source: Player) {
						this.effects.apply(EFFECT.SLOW, 1)
					}

					skillattr = new SkillAttack(new Damage(this.getSkillBaseDamage(s), 0, 0), this.getSkillName(s), s, this.player)
						.setOnHit(onhit)
						.setTrajectoryDelay(this.getSkillTrajectoryDelay(this.getSkillName(s)))
					this.startDuration(ENUM.SKILL.ULT)

					this.player.effects.apply(EFFECT.ROOT, 1)
					this.u_target = target.UEID
					this.startCooltime(ENUM.SKILL.ULT)
				}
				break
		}

		return skillattr
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	onSkillDurationCount() {
		if (this.duration[ENUM.SKILL.ULT] === 2) {
			this.player.effects.apply(EFFECT.ROOT, 1)
			let onhit = function (this: Player, source: Player) {
				this.effects.apply(EFFECT.SLOW, 1)
			}
			let skillattr = new SkillAttack(
				new Damage(this.getSkillBaseDamage(ENUM.SKILL.ULT), 0, 0),
				this.getSkillName(ENUM.SKILL.ULT),
				ENUM.SKILL.ULT,
				this.player
			).setOnHit(onhit)
			if (this.u_target !== "" && !this.player.game.pOfId(this.u_target).dead)
				this.mediator.skillAttackSingle(this.player, this.u_target, skillattr)
		}
		//궁 세번째 공격
		if (this.duration[ENUM.SKILL.ULT] === 1) {
			let onhit = function (this: Player, source: Player) {
				this.effects.apply(EFFECT.SLOW, 1)
			}
			let skillattr = new SkillAttack(
				new Damage(0, 0, this.getSkillBaseDamage(ENUM.SKILL.ULT)),
				this.getSkillName(ENUM.SKILL.ULT),
				ENUM.SKILL.ULT,
				this.player
			).setOnHit(onhit)

			if (this.u_target !== "" && !this.player.game.pOfId(this.u_target).dead)
				this.mediator.skillAttackSingle(this.player, this.u_target, skillattr)

			this.u_target = ""
		}
	}
	onSkillDurationEnd(skill: number) {
		if (skill === ENUM.SKILL.ULT) {
			this.u_target = ""
			this.player.effects.apply(EFFECT.DOUBLEDICE, 1)
			this.player.effects.reset(EFFECT.ROOT)
		}
	}
}

export { Jean }
