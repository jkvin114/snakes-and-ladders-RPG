import { Player } from "../player/player"
import type { Game } from "../Game"

import * as ENUM from "../data/enum"
import { ITEM } from "../data/enum"

import { CALC_TYPE } from "../core/Util"
import { Damage,PercentDamage } from "../core/Damage"
import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { AblityChangeEffect, NormalEffect, TickDamageEffect, TickEffect,ShieldEffect, EFFECT_TIMING } from "../StatusEffect"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import { SkillInfoFactory } from "../data/SkillDescription"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import BirdAgent from "../AiAgents/BirdAgent"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack, SkillOnHitFunction } from "../core/skill"
const ID = 7

class Bird extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	skill_ranges: number[]

	readonly duration_list:number[]


	static PROJ_ULT_TRACE="bird_r_trace"
	// static EFFECT_ULT="bird_r"
	static VISUALEFFECT_ULT="bird_r"
	static APPERANCE_ULT="bird_r"
	// static EFFECT_ULT_BURN="bird_r_burn"

	static SKILLNAME_ULT_WQ="bird_r_w_hit"
	static SKILLNAME_WQ="bird_w_hit"
	static SKILLNAME_ULT_Q="bird_r_hit"

	static AANAME_ULT_W="bird_r_w_hit"
	static AANAME_W="bird_w_hit"
	static AANAME_ULT="bird_r_hit"

	static EFFECT_ULT_SHIELD='bird_r_shield'

	static SKILL_SCALES=SKILL_SCALES[ID]

	static SKILL_EFFECT_NAME=["bird_q", "hit", "bird_r"]

	constructor(turn: number, team: number , game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] = [200, 30, 7, 7, 0, 30]
		super(turn, team, game, ai, ID, name)
		//	this.onoff = [false, false, false]
		this.cooltime_list = [3, 5, 10]
		this.duration_list=[0,2,4]
		this.skill_ranges=[20,0,0]
		
		this.AiAgent=new BirdAgent(this)
	}


	getSkillTrajectorySpeed(skilltype: string): number {
		if(skilltype==="bird_q" || skilltype === "bird_w_hit") return 250
		return 0
	}
	getSkillScale(){
		return Bird.SKILL_SCALES
	}
	private buildProjectile() {
		let _this: Player = this
		let ultburn=this.getUltBurn()
		return new ProjectileBuilder(this.game,Bird.PROJ_ULT_TRACE,Projectile.TYPE_RANGE)
			.setSize(3)
			.setSource(this)
			.setAction(function(this: Player){
				this.effects.applySpecial(ultburn,SpecialEffect.SKILL.BIRD_ULT_BURN.name)
			})
			.addFlag(Projectile.FLAG_NOT_DISAPPER_ON_STEP)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		this.pendingSkill = s
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s)//-1 when can`t use skill, 0 when it`s not attack skill
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])
				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
		}
		return skillTargetSelector
	}
	useActivationSkill(skill: number): void {
		if(skill===ENUM.SKILL.W) this.useW()
		if(skill===ENUM.SKILL.ULT) this.useUlt()
	}

	private getUltShield() {
		return new ShieldEffect(ENUM.EFFECT.BIRD_ULT_SHIELD,this.duration_list[ENUM.SKILL.ULT], 70)
	}
	private getUltAbility(){
		return new AblityChangeEffect(ENUM.EFFECT.BIRD_ULT_ABILITY,this.duration_list[ENUM.SKILL.ULT],new Map().set("attackRange",2))
	}
	private getUltBurn(){
		return new TickDamageEffect(
			ENUM.EFFECT.BIRD_ULT_BURN,
			2,
			TickEffect.FREQ_EVERY_PLAYER_TURN,
			new PercentDamage(3, PercentDamage.MAX_HP)
		).setSourceId(this.UEID)
	}

	private useW() {
		this.startCooltime(ENUM.SKILL.W)
		this.effects.apply(ENUM.EFFECT.SPEED, 1)
		this.effects.applySpecial(new NormalEffect(ENUM.EFFECT.BIRD_W,2,EFFECT_TIMING.TURN_START),SpecialEffect.SKILL.BIRD_W.name)
		this.startDuration(ENUM.SKILL.W)
	}
	private useUlt() {
		this.startCooltime(ENUM.SKILL.ULT)
		this.effects.applySpecial(this.getUltShield(),Bird.EFFECT_ULT_SHIELD)
		this.effects.applySpecial(this.getUltAbility(),SpecialEffect.SKILL.BIRD_ULT.name)

		this.startDuration(ENUM.SKILL.ULT)

		// this.ability.update("attackRange", 2)
		this.changeApperance(Bird.APPERANCE_ULT)
		this.changeSkillImage("bird_r_q",ENUM.SKILL.Q)

		this.showEffect(Bird.VISUALEFFECT_ULT, this.turn)
	}

	getSkillName(skill: number): string {
		if (this.duration[ENUM.SKILL.W] > 0 && skill === ENUM.SKILL.Q) {
			if (this.duration[ENUM.SKILL.ULT] > 0) {
				return Bird.SKILLNAME_ULT_WQ
			} else {
				return Bird.SKILLNAME_WQ
			}
		} else if (this.duration[ENUM.SKILL.ULT] > 0 && skill === ENUM.SKILL.Q) {
			return Bird.SKILLNAME_ULT_Q
		}
		return Bird.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		if (this.duration[ENUM.SKILL.W] > 0) {
			if (this.duration[ENUM.SKILL.ULT] > 0) {
				return Bird.AANAME_ULT_W
			} else {
				return Bird.AANAME_W
			}
		} else if (this.duration[ENUM.SKILL.ULT] > 0) {
			return Bird.AANAME_ULT
		}
		return super.getBasicAttackName()
	}

	getBaseBasicAttackDamage(): Damage {
		let damage = super.getBaseBasicAttackDamage()
		if (this.isSkillActivated(ENUM.SKILL.W)) {
			damage.updateMagicDamage(CALC_TYPE.plus,this.getSkillAmount("w_aa_adamage"))
			if (this.isSkillActivated(ENUM.SKILL.ULT)) {
				damage.updateMagicDamage(CALC_TYPE.multiply, 2)
			}
		}

		if (this.isSkillActivated(ENUM.SKILL.ULT)) {
			damage.updateAttackDamage(CALC_TYPE.plus,this.getSkillAmount("r_aa_adamage"))
		}
		return damage
	}

	getSkillProjectile(pos:number): Projectile|null {
		return null
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Bird.SKILL_SCALES.Q)
		}
		return 0
	}
	getSkillAmount(key: string): number {
		if(key==="w_q_adamage") return this.calculateScale(Bird.SKILL_SCALES.w_q_adamage!)
		if(key==="w_aa_adamage") return this.calculateScale(Bird.SKILL_SCALES.w_aa_adamage!)
		if(key==="r_aa_adamage") return this.calculateScale(Bird.SKILL_SCALES.r_aa_adamage!)

		return 0
	}

	getSkillDamage(target: Entity,s:number): SkillAttack|null {
		let skillattr = null
		
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				let onhit = function(this: Player,source:Player){
					this.inven.takeMoney(20)
					source.inven.giveMoney(20)
				}

				let damage = new Damage(0, this.getSkillBaseDamage(s), 0)

				if (this.isSkillActivated(ENUM.SKILL.W)) {
					onhit = function(this: Player,source:Player){
						this.inven.takeMoney(20)
						source.inven.giveMoney(20)
						this.effects.apply(ENUM.EFFECT.ROOT, 1)
					}
					damage.updateMagicDamage(CALC_TYPE.plus, this.getSkillAmount("w_q_adamage"))
					if (this.isSkillActivated(ENUM.SKILL.ULT)) 
					{
						damage.updateMagicDamage(CALC_TYPE.plus,  this.getSkillAmount("w_q_adamage"))
					}
				}

				if (this.isSkillActivated(ENUM.SKILL.ULT)) {
					let proj = this.buildProjectile()
					this.game.placeProjNoSelection(proj, target.pos - 1)
				}
				skillattr =new SkillAttack(damage,this.getSkillName(s),s,this).setOnHit(onhit)
				break
		}

		return skillattr
	}
	onSkillDurationEnd(skill: number) {
		if (skill === ENUM.SKILL.ULT) {
			// this.ability.update("attackRange", -2)
			this.changeApperance("")
			this.changeSkillImage("",ENUM.SKILL.Q)

		}
		if (skill === ENUM.SKILL.W) {
		}
	}
	passive() {}
	onSkillDurationCount() {}
	/**
	//  *
	//  * @param {*} skilldata
	//  * @param {*} skill 0~
	//  */
	// aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
	// //	console.log("aiSkillFinalSelection" + skill + "" + skilldata)
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
	// 			if (this.cooltime[ENUM.SKILL.Q] < 1) {
	// 				this.useW()
	// 			}
	// 			return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
	// 		case ENUM.SKILL.ULT:
	// 			this.useUlt()
	// 			return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
	// 	}
	// 	return null
	// }
}
export { Bird }
