import * as ENUM from "../data/enum"
import type { Player } from "../player/player"
import type { Game } from "../Game"

import { Damage,PercentDamage } from "../core/Damage"

import { CALC_TYPE } from "../core/Util"
import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { TickDamageEffect, TickEffect, OnHitEffect } from "../StatusEffect"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import TimoAgent from "../AiAgents/TimoAgent"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { EFFECT } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"

const ID = 2
class Timo extends CharacterSkillManager {
	//	onoff: boolean[]
	skill_ranges: number[]

	readonly hpGrowth: number
	readonly cooltime_list: number[]

	readonly duration_list: number[]

	static readonly PROJ_ULT="ghost_r"
	static readonly SKILLNAME_STRONG_Q="ghost_w_q"
	static readonly SKILL_SCALES=SKILL_SCALES[ID]
	static readonly SKILL_EFFECT_NAME=["ghost_q", "hit", "ghost_r"]
	protected player: Player
	constructor(player: Player) {
		super(player,ID)
		//	this.onoff = [false, false, false]
		this.skill_ranges=[18,0,30]
		this.cooltime_list = [3, 6, 6]
		this.duration_list = [0, 1, 0]
	}




	getSkillScale(){
		return Timo.SKILL_SCALES
	}

	getSkillTrajectoryDelay(skilltype: string): number {
		if (skilltype === "ghost_q" || skilltype === "ghost_w_q") return 500
		return 0
	}

	private buildProjectile() {
		let _this: Player = this.player
		let effect = new TickDamageEffect(
			EFFECT.GHOST_ULT_DAMAGE,
			3,
			TickEffect.FREQ_EVERY_TURN,
			new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.ULT), 0)
		)
			.setAction(function(this: Player){
				this.effects.apply(EFFECT.SLOW, 1)
				return false
			})
			.setSourceSkill(ENUM.SKILL.ULT)
			.setSourceId(this.player.UEID)

		let hiteffect = new OnHitEffect(EFFECT.GHOST_ULT_WEAKEN,3, function(this:Player,target: Player, damage: Damage){
			damage.updateNormalDamage(CALC_TYPE.multiply, 0.5)
			return damage
		})
			.setSourceId(this.player.UEID)
			.on(OnHitEffect.EVERYATTACK)
			.to([this.player.UEID])



		return new ProjectileBuilder(this.player.game,Timo.PROJ_ULT,Projectile.TYPE_RANGE)
			.setSize(4)
			.setSource(this.player)
			.setSkillRange(30)
			.setAction(function (this: Player) {
				this.effects.applySpecial(effect, SpecialEffect.SKILL.GHOST_ULT.name)
				this.effects.applySpecial(hiteffect, SpecialEffect.SKILL.GHOST_ULT.name)
			})
			.setTrajectorySpeed(300)
			.setDuration(2)
			.setToTrap()
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(skill)
		this.pendingSkill=skill
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[skill])
				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(this.skill_ranges[skill]).setProjectileSize(4)
				break
		}
		return skillTargetSelector
	}
	useActivationSkill(skill: number): void {
		if(skill===ENUM.SKILL.W) this.useW()
	}

	private useW() {
		this.startCooltime(ENUM.SKILL.W)
		this.startDuration(ENUM.SKILL.W)
		this.player.effects.apply(EFFECT.INVISIBILITY, 1)
	}
	getSkillName(skill: number): string {
		if (skill === ENUM.SKILL.Q && this.player.effects.has(EFFECT.INVISIBILITY)) {
			return Timo.SKILLNAME_STRONG_Q
		}
		return Timo.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos:number): Projectile|null {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.ULT) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.ULT)
			return proj
		}
		return null
	}
	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Timo.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Timo.SKILL_SCALES.R!)
		}
		return 0
	}

	getSkillDamage(target: Entity,s:number): SkillAttack|null {
		let skillattr = null
		// let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)

				let admg = new Damage(0, 0, 0)
				if (this.player.level > 1 && this.player.effects.has(EFFECT.INVISIBILITY)) {
					admg = new PercentDamage(30, PercentDamage.MISSING_HP, Damage.MAGIC).pack(
						target.MaxHP,target.HP
					)
				}

				skillattr = new SkillAttack(
					new Damage(0, this.getSkillBaseDamage(s), 0).mergeWith(admg),
					this.getSkillName(s)
				,s,this.player).setOnHit(function (this: Player,source:Player) {
					this.effects.apply(EFFECT.BLIND, 1)
				}).setTrajectoryDelay(this.getSkillTrajectoryDelay(this.getSkillName(s)))
				break
		}

		return skillattr
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {}
	onSkillDurationEnd(skill: number) {}
}

export { Timo }
