import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillDamage, SkillTargetSelector } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { AblityChangeEffect, NormalEffect } from "../StatusEffect"
import { Game } from "../Game"
import { Projectile } from "../Projectile"
import { SpecialEffect } from "../SpecialEffect"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import { Creed } from "./Creed"
import { SkillInfoFactory } from "../helpers"

// import SETTINGS = require("../../res/globalsettings.json")
const ID = 1
class Silver extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	usedQ: boolean
	readonly cooltime_list: number[]
	readonly skill_ranges: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}

	private readonly skill_name: string[]
	// private u_active_amt: number
	// private u_passive_amt: number
	readonly duration_list: number[]
	skillInfo:SkillInfoFactory
	skillInfoKor:SkillInfoFactory


	static VISUALEFFECT_ULT="elephant_r"
	static APPERANCE_ULT="elephant_r"
	static EFFECT_ULT_SHIELD="elephant_r_shield"
	static SKILL_EFFECT_NAME=["elephant_q", "hit", "hit"]
	static SKILL_SCALES=SKILL_SCALES[ID]


	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats = [250, 25, 15, 15, 0, 20]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.cooltime_list = [2, 4, 9]
		this.duration_list = [0, 2, 3]
		this.hpGrowth = 130
		this.skill_ranges=[3,15,0]
		this.skill_name = Silver.SKILL_EFFECT_NAME
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SHIELD,
				ITEM.EPIC_ARMOR,
				ITEM.POWER_OF_MOTHER_NATURE,
				ITEM.EPIC_FRUIT,
				ITEM.BOOTS_OF_ENDURANCE,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SHIELD
		}

	}

	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Tusk Attack] cooltime:" +
			this.cooltime_list[0] +
			" turns<br>range:3,(7 to players that have mark of ivory),Damage a player by tusk, deals " +
			this.getSkillBaseDamage(0) +
			"magic damageDeals 30 more damage if the target has mark of ivory"
		info[1] =
			"[Curse of Ivory]<br> cooltime:" +
			this.cooltime_list[1] +
			" turns<br>range:15, Leaves mark of ivory to a player and applies curse effect"
		info[2] =
			"[Strengthen] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>[Passive effect]: attack and magic resistance increase based on missing health<br>" +
			" [On use]: Attack and magic resistance increases by" +
			(this.HP < this.MaxHP / 10 ? 150 : 80) +
			" and heal amount of 'tusk attack' doubles"
		return info
	}

		
	getSkillScale(){
		return Silver.SKILL_SCALES
	}
	getSkillTrajectorySpeed(skilltype: string): number {
		return 0
	}
	/**
	 * returns type,range, whether it is projectile,
	 * if the skill doesnt need target, use the skill
	 * @param {*} s
	 * @returns
	 */
	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill

		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector
					.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
					.setRange(this.skill_ranges[s])
					.setConditionedRange((target: Player) => {
						return target.effects.has(ENUM.EFFECT.ELEPHANT_W_SIGN)
					}, 7)

				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])

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

	useUlt() {
		this.startCooltime(ENUM.SKILL.ULT)
		this.startDuration(ENUM.SKILL.ULT)

		this.effects.applySpecial(this.getUltShield(),Silver.EFFECT_ULT_SHIELD)

		this.effects.applySpecial(this.getUltResistance(),SpecialEffect.SKILL.ELEPHANT_ULT.name)

		this.showEffect(Silver.VISUALEFFECT_ULT, this.turn)
		this.changeApperance(Silver.APPERANCE_ULT)
	}

	getSkillName(skill: number): string {
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos:number): Projectile {
		return null
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Silver.SKILL_SCALES.Q)
		}
		return 0
	}
	getSkillAmount(key: string): number {
		if(key==="r_resistance") return this.HP < this.MaxHP / 10 ? 150 : 80
		if(key==="rshield") return this.calculateScale(Silver.SKILL_SCALES.rshield)
		if(key==="qheal") return Math.floor(this.getSkillBaseDamage(ENUM.SKILL.Q) * 0.3)
		if(key==="r_qheal") return Math.floor(this.getSkillBaseDamage(ENUM.SKILL.Q) * 0.6)
		if(key==="w_qdamage") return this.calculateScale(Silver.SKILL_SCALES.w_qdamage)
		if(key==="w_qrange") return 7

		return 0
	}

	private getUltResistance() {
		let amt=this.getSkillAmount("r_resistance")
		return new AblityChangeEffect(ENUM.EFFECT.ELEPHANT_ULT_RESISTANCE, this.duration_list[2], new Map().set("AR", amt).set("MR", amt))
	}
	private getUltShield() {
		return new ShieldEffect(ENUM.EFFECT.ELEPHANT_ULT_SHIELD, this.duration_list[2], this.getSkillAmount("rshield"))
	}

	private getWEffect() {
		return new NormalEffect(ENUM.EFFECT.ELEPHANT_W_SIGN, this.duration_list[1], ENUM.EFFECT_TIMING.TURN_END).setSourcePlayer(this.turn)
	}

	/**
	 * actually use the skill
	 * get specific damage and projectile objects
	 * starts cooldown
	 * @param {*} target
	 * @returns
	 */
	getSkillDamage(target: number): SkillDamage {
		let skillattr: SkillDamage = null //-1 when can`t use skill, 0 when it`s not attack skill
		let s = this.pendingSkill
		this.pendingSkill = -1

		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)

				let _this = this
				let dmg = this.getSkillBaseDamage(s)
				let heal=_this.isSkillActivated(ENUM.SKILL.ULT) ? this.getSkillAmount("r_qheal") : this.getSkillAmount("qheal")
				
				skillattr = new SkillDamage(new Damage(0, dmg, 0), ENUM.SKILL.Q).setOnKill((target: Player)=> {
					this.heal(heal)
				})

				if (this.game.playerSelector.get(target).effects.hasEffectFrom(ENUM.EFFECT.ELEPHANT_W_SIGN, this.turn)) {
					skillattr.damage.updateTrueDamage(CALC_TYPE.plus, this.getSkillAmount("w_qdamage"))
					this.game.playerSelector.get(target).effects.reset(ENUM.EFFECT.ELEPHANT_W_SIGN)
				}
				break
			case ENUM.SKILL.W:
				this.startCooltime(ENUM.SKILL.W)
				let effect = this.getWEffect()
				let onhit = function (target: Player) {
					target.effects.applySpecial(effect,SpecialEffect.SKILL.ELEPHANT_W.name)
					target.effects.apply(ENUM.EFFECT.CURSE, 1, ENUM.EFFECT_TIMING.TURN_START)
				}
				skillattr = new SkillDamage(new Damage(0, 0, 0), ENUM.SKILL.W).setOnHit(onhit)

				break
		}

		return skillattr
	}
	/**
	 * called every turn before throw dice
	 */
	passive() {
		if (this.level < 3 || this.HP > 250) {
			return
		}
		let passive = 0
		if (this.HP > this.MaxHP * 0.3) {
			passive = 30
		} else if (this.HP > this.MaxHP * 0.1) {
			passive = 45
		} else {
			passive = 60
		}

		this.effects.applySpecial(
			new AblityChangeEffect(ENUM.EFFECT.ELEPHANT_PASSIVE_RESISTANCE, 2, new Map().set("AR", passive).set("MR", passive)),
			SpecialEffect.SKILL.ELEPHANT_PASSIVE.name
		)

	}

	/**
	 * called every turn after obstacle
	 */
	onSkillDurationCount() {}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	onSkillDurationEnd(skill: number) {
		if (skill === ENUM.SKILL.ULT) {
			this.changeApperance("")
		}
	}

	/**
	 * ai actually uses the skill
	 * chooses target or location and returns it
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
				//  return {type:"location",data:1}
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
			case ENUM.SKILL.ULT:
				this.useUlt()
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
		}
	}
}
export { Silver }
