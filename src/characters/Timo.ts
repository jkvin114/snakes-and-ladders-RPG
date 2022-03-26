import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { Damage, SkillTargetSelector, SkillAttack, PercentDamage, CALC_TYPE } from "../Util"
import { Game } from "../Game"
import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { TickDamageEffect, TickEffect, OnHitEffect } from "../StatusEffect"
import { SpecialEffect } from "../SpecialEffect"
import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"
const ID = 2
class Timo extends Player {
	skillInfoKor: SkillInfoFactory
	skillInfo: SkillInfoFactory
	//	onoff: boolean[]
	skill_ranges: number[]

	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	readonly duration_list: number[]

	static readonly PROJ_ULT="ghost_r"
	static readonly SKILLNAME_STRONG_Q="ghost_w_q"
	static readonly SKILL_SCALES=SKILL_SCALES[ID]
	static readonly SKILL_EFFECT_NAME=["ghost_q", "hit", "ghost_r"]

	constructor(turn: number, team: boolean , game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] = [170, 30, 6, 6, 0, 30]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.skill_ranges=[18,0,30]
		this.hpGrowth = 100
		this.cooltime_list = [3, 6, 6]
		this.duration_list = [0, 1, 0]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.INVISIBILITY_CLOAK,
				ITEM.CARD_OF_DECEPTION,
				ITEM.ANCIENT_SPEAR,
				ITEM.POWER_OF_MOTHER_NATURE,
				ITEM.BOOTS_OF_HASTE
			],
			final: ITEM.EPIC_CRYSTAL_BALL
		}
		
		this.skillInfo=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_ENG)
		this.skillInfoKor=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_KOR)

	}




	getSkillScale(){
		return Timo.SKILL_SCALES
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		if (skilltype === "ghost_q" || skilltype === "ghost_w_q") return 500
		return 0
	}

	private buildProjectile() {
		let _this: Player = this.getPlayer()
		let effect = new TickDamageEffect(
			ENUM.EFFECT.GHOST_ULT_DAMAGE,
			3,
			TickEffect.FREQ_EVERY_TURN,
			new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.ULT), 0)
		)
			.setAction(function(this: Player){
				this.effects.apply(ENUM.EFFECT.SLOW, 1, ENUM.EFFECT_TIMING.TURN_START)
				return false
			})
			.setSourceSkill(ENUM.SKILL.ULT)
			.setSourcePlayer(this.turn)

		let hiteffect = new OnHitEffect(ENUM.EFFECT.GHOST_ULT_WEAKEN,3, function(this:Player,target: Player, damage: Damage){
			return damage.updateNormalDamage(CALC_TYPE.multiply, 0.5)
		})
			.setSourcePlayer(this.turn)
			.on(OnHitEffect.EVERYATTACK)
			.to([this.turn])



		return new ProjectileBuilder(this.game,Timo.PROJ_ULT,Projectile.TYPE_RANGE)
			.setSize(4)
			.setSource(this.turn)
			.setSkillRange(30)
			.setAction(function (this: Player) {
				this.effects.applySpecial(effect, SpecialEffect.SKILL.GHOST_ULT.name)
				this.effects.applySpecial(hiteffect, SpecialEffect.SKILL.GHOST_ULT.name)
			})
			.setTrajectorySpeed(300)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(
			skill
		) //-1 when can`t use skill, 0 when it`s not attack skill

		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[skill])

				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				if (!this.AI) {
					this.useW()
				}

				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(this.skill_ranges[skill]).setProjectileSize(4)
				break
		}
		return skillTargetSelector
	}

	useW() {
		this.startCooltime(ENUM.SKILL.W)
		this.startDuration(ENUM.SKILL.W)
		this.effects.apply(ENUM.EFFECT.INVISIBILITY, 1, ENUM.EFFECT_TIMING.TURN_END)
	}
	getSkillName(skill: number): string {
		if (skill === ENUM.SKILL.Q && this.effects.has(ENUM.EFFECT.INVISIBILITY)) {
			return Timo.SKILLNAME_STRONG_Q
		}
		return Timo.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos:number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.ULT) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.ULT)
			return proj
		}
	}
	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Timo.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Timo.SKILL_SCALES.R)
		}
	}

	getSkillDamage(target: number): SkillAttack {
		let skillattr: SkillAttack = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)

				let admg = new Damage(0, 0, 0)
				if (this.level > 1 && this.effects.has(ENUM.EFFECT.INVISIBILITY)) {
					admg = new PercentDamage(30, PercentDamage.MISSING_HP, Damage.MAGIC).pack(
						this.game.pOfTurn(target)
					)
				}

				skillattr = new SkillAttack(
					new Damage(0, this.getSkillBaseDamage(s), 0).mergeWith(admg),
					this.getSkillName(s)
				).ofSkill(s).setOnHit(function (this: Player) {
					this.effects.apply(ENUM.EFFECT.BLIND, 1, ENUM.EFFECT_TIMING.TURN_START)
				})
				break
		}

		return skillattr
	}

	passive() {}
	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {}
	onSkillDurationEnd(skill: number) {}
	/**
	 *
	 * @param {*} skilldata
	 * @param {*} skill 0~
	 */
	aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
		if (
			skilldata === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_COOL ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGET
		) {
			return null
		}
		switch (skill) {
			case ENUM.SKILL.Q:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
			case ENUM.SKILL.W:
				if (this.cooltime[ENUM.SKILL.Q] <= 1) {
					this.useW()
				}

				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET,
					data: null
				}
			case ENUM.SKILL.ULT:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill)
				}
		}
	}
}

export { Timo }
