import * as ENUM from "../enum"
import { ITEM } from "../enum"
import { Damage, SkillAttack, SkillTargetSelector } from "../Util"
import { Player } from "../player"
import type { Game } from "../Game"


import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")

import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import { ShieldEffect } from "../StatusEffect"
import { DefaultAgent } from "../AiAgents/AiAgent"
const ID = 4
class Jean extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	skill_ranges: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private readonly skill_name: string[]
	private u_target: string
	readonly duration_list: number[]
	
	skillInfo:SkillInfoFactory
	skillInfoKor:SkillInfoFactory

	static readonly PROJ_W="sniper_w"
	static readonly EFFECT_ULT="sniper_r"
	static readonly SKILL_SCALES=SKILL_SCALES[ID]
	static readonly SKILL_EFFECT_NAME=["gun", "sniper_w", "sniper_r"]

	constructor(turn: number, team: boolean, game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] = [190, 40, 7, 7, 0, 0]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.hpGrowth = 90
		this.cooltime_list = [3, 4, 9]
		this.duration_list=[0,0,2]
		this.skill_ranges=[20,40,40]
		this.u_target = null
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.SWORD_OF_BLOOD,
				ITEM.EPIC_WHIP,
				ITEM.BOOTS_OF_HASTE,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.WARRIORS_SHIELDSWORD
			],
			final: ITEM.EPIC_SWORD
		}
		
		this.skillInfo=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_ENG)
		this.skillInfoKor=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_KOR)
		this.AiAgent=new DefaultAgent(this)

	}


	getSkillScale(){
		return Jean.SKILL_SCALES
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		if (skilltype === Jean.SKILL_EFFECT_NAME[ENUM.SKILL.Q]) return 150

		if (skilltype === Jean.SKILL_EFFECT_NAME[ENUM.SKILL.ULT]) return 170

		return 0
	}

	private buildProjectile() {
		return new ProjectileBuilder(this.game,Jean.PROJ_W,Projectile.TYPE_RANGE)
			.setAction(function (this: Player) {
				this.effects.apply(ENUM.EFFECT.STUN, 2)
			})
			.setTrajectorySpeed(300)
			.setSize(3)
			.setSource(this.turn)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s) //-1 when can`t use skill, 0 when it`s not attack skill
		//console.log("getSkillAttr" + s)
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])

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

	getSkillProjectile(pos:number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.W) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.W)

			return proj
		}
	}
	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Jean.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Jean.SKILL_SCALES.R)
		}
	}
	getSkillAmount(key: string): number {
		if(key==="rshield") return 80

		return 0
	}

	private getUltShield(){
		return new ShieldEffect(ENUM.EFFECT.SNIPER_ULT_SHIELD,4,this.getSkillAmount("rshield"))
	}

	getSkillDamage(target: number): SkillAttack {
	//	console.log(target + "getSkillDamage" + this.pendingSkill)
		let skillattr: SkillAttack = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				let _this = this
				let onhit = function (this: Player) {
					if (this.effects.has(ENUM.EFFECT.STUN)) {
						_this.setCooltime(ENUM.SKILL.Q, 1)
					}
				}

				skillattr = new SkillAttack(new Damage(this.getSkillBaseDamage(s), 0, 0), this.getSkillName(s)).setOnHit(onhit).ofSkill(s)

				break
			case ENUM.SKILL.ULT:
				this.effects.applySpecial(this.getUltShield(),Jean.EFFECT_ULT)
				if (this.duration[ENUM.SKILL.ULT] === 0) {
					let onhit = function (this: Player) {
						this.effects.apply(ENUM.EFFECT.SLOW, 1)
					}

					skillattr = new SkillAttack(new Damage(this.getSkillBaseDamage(s), 0, 0), this.getSkillName(s)).setOnHit(onhit).ofSkill(s)
					this.startDuration(ENUM.SKILL.ULT)

					this.effects.apply(ENUM.EFFECT.STUN, 1)
					this.u_target = this.game.turn2Id(target)
					this.startCooltime(ENUM.SKILL.ULT)
				}
				break
		}

		return skillattr
	}

	passive() {}
	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	onSkillDurationCount() {
		if (this.duration[ENUM.SKILL.ULT] === 2) {
			this.effects.apply(ENUM.EFFECT.STUN, 1)
			let onhit = function (this: Player) {
				this.effects.apply(ENUM.EFFECT.SLOW, 1)
			}
			let skillattr = new SkillAttack(new Damage(this.getSkillBaseDamage(ENUM.SKILL.ULT), 0, 0), this.getSkillName(ENUM.SKILL.ULT)).ofSkill(ENUM.SKILL.ULT).setOnHit(onhit)
			this.mediator.skillAttackSingle(this,this.u_target)(skillattr)
			// this.hitOneTarget(this.u_target, skillattr)
		}
		//궁 세번째 공격
		if (this.duration[ENUM.SKILL.ULT] === 1) {
			let onhit = function (this: Player) {
				this.effects.apply(ENUM.EFFECT.SLOW, 1)
			}
			let skillattr = new SkillAttack(new Damage(0,0,this.getSkillBaseDamage(ENUM.SKILL.ULT)),this.getSkillName(ENUM.SKILL.ULT)).ofSkill(ENUM.SKILL.ULT).setOnHit(onhit)

			this.mediator.skillAttackSingle(this,this.u_target)(skillattr)

			this.u_target = null
		}
	}
	onSkillDurationEnd(skill: number) {
		if (skill === ENUM.SKILL.ULT) {
			this.u_target = null
			this.effects.apply(ENUM.EFFECT.DOUBLEDICE, 1)
			this.effects.reset(ENUM.EFFECT.STUN)
		}
	}
	// /**
	//  *
	//  * @param {*} skilldata
	//  * @param {*} skill 0~
	//  */
	// aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
	// 	if (
	// 		skilldata === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
	// 		skilldata === ENUM.INIT_SKILL_RESULT.NO_COOL ||
	// 		skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
	// 	) {
	// 		return null
	// 	}
	// 	switch (skill) {
	// 		case ENUM.SKILL.Q:
	// 			return {
	// 				type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
	// 				data: this.getAiTarget(skilldata.targets)
	// 			}
	// 		case ENUM.SKILL.W:
	// 			return {
	// 				type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
	// 				data: this.getAiProjPos(skilldata, skill)
	// 			}
	// 		case ENUM.SKILL.ULT:
	// 			if (this.duration[ENUM.SKILL.ULT] > 0) return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }

	// 			return {
	// 				type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
	// 				data: this.getAiTarget(skilldata.targets)
	// 			}
	// 	}
	// }
}

export { Jean }
