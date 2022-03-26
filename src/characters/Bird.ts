import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillTargetSelector, SkillAttack, PercentDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { AblityChangeEffect, NormalEffect, TickDamageEffect, TickEffect } from "../StatusEffect"
import { SpecialEffect } from "../SpecialEffect"
import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"

const ID = 7

class Bird extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	skill_ranges: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	readonly duration_list:number[]

	skillInfo:SkillInfoFactory
	skillInfoKor:SkillInfoFactory

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

	static SKILL_SCALES=SKILL_SCALES[ID]

	static SKILL_EFFECT_NAME=["hit", "hit", "bird_r"]

	constructor(turn: number, team: boolean , game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] = [200, 30, 7, 7, 0, 30]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.hpGrowth = 100
		this.cooltime_list = [3, 5, 10]
		this.duration_list=[0,2,4]
		this.skill_ranges=[20,0,0]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.EPIC_WHIP,
				ITEM.ANCIENT_SPEAR,
				ITEM.SWORD_OF_BLOOD,
				ITEM.CARD_OF_DECEPTION,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.ANCIENT_SPEAR
		}
		this.skillInfo=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_ENG)
		this.skillInfoKor=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_KOR)

	}


	getSkillTrajectorySpeed(skilltype: string): number {
		
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
			.setSource(this.turn)
			.setAction(function(this: Player){
				this.effects.applySpecial(ultburn,SpecialEffect.SKILL.BIRD_ULT_BURN.name)
			})
			.addFlag(Projectile.FLAG_NOT_DISAPPER_ON_STEP)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])
				break
			case ENUM.SKILL.W:
				if (!this.AI) {
					this.useW()
				}
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.ULT:
				if (!this.AI) {
					this.useUlt()
				}
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
		}
		return skillTargetSelector
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
		).setSourcePlayer(this.turn)
	}

	private useW() {
		this.startCooltime(ENUM.SKILL.W)
		this.effects.apply(ENUM.EFFECT.SPEED, 1, ENUM.EFFECT_TIMING.TURN_END)
		this.effects.applySpecial(new NormalEffect(ENUM.EFFECT.BIRD_W,2,ENUM.EFFECT_TIMING.TURN_END),SpecialEffect.SKILL.BIRD_W.name)
		this.startDuration(ENUM.SKILL.W)
	}
	private useUlt() {
		this.startCooltime(ENUM.SKILL.ULT)
		this.effects.applySpecial(this.getUltShield(),SpecialEffect.SKILL.BIRD_ULT.name)
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

	getSkillProjectile(pos:number): Projectile {
		return null
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Bird.SKILL_SCALES.Q)
		}
	}
	getSkillAmount(key: string): number {
		if(key==="w_q_adamage") return this.calculateScale(Bird.SKILL_SCALES.w_q_adamage)
		if(key==="w_aa_adamage") return this.calculateScale(Bird.SKILL_SCALES.w_aa_adamage)
		if(key==="r_aa_adamage") return this.calculateScale(Bird.SKILL_SCALES.r_aa_adamage)

		return 0
	}

	getSkillDamage(target: number): SkillAttack {
		let skillattr: SkillAttack = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				let _this=this
				let onhit = function(this: Player){
					this.inven.takeMoney(20)
					_this.inven.giveMoney(20)
				}

				let damage = new Damage(0, this.getSkillBaseDamage(s), 0)

				if (this.isSkillActivated(ENUM.SKILL.W)) {
					this.game.pOfTurn(target).effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					damage.updateMagicDamage(CALC_TYPE.plus, this.getSkillAmount("w_q_adamage"))
					if (this.isSkillActivated(ENUM.SKILL.ULT)) 
					{
						damage.updateMagicDamage(CALC_TYPE.plus,  this.getSkillAmount("w_q_adamage"))
					}
				}

				if (this.isSkillActivated(ENUM.SKILL.ULT)) {
					let proj = this.buildProjectile()
					this.game.placeProjNoSelection(proj, this.game.pOfTurn(target).pos - 1)
				}
				skillattr =new SkillAttack(damage,this.getSkillName(s)).setOnHit(onhit).ofSkill(s)
				break
		}

		return skillattr
	}
	onSkillDurationEnd(skill: number) {
		// console.log("birdattackrange:" + this.ability.attackRange)
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
	 *
	 * @param {*} skilldata
	 * @param {*} skill 0~
	 */
	aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
	//	console.log("aiSkillFinalSelection" + skill + "" + skilldata)
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
				if (this.cooltime[ENUM.SKILL.Q] < 1) {
					this.useW()
				}
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
			case ENUM.SKILL.ULT:
				this.useUlt()
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
		}
		return null
	}
}
export { Bird }
