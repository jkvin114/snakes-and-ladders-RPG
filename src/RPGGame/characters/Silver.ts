import * as ENUM from "../data/enum"
import type { Player } from "../player/player"
import type { Game } from "../Game"
import { CALC_TYPE } from "../core/Util"
import { AblityChangeEffect,  NormalEffect ,ShieldEffect} from "../StatusEffect"
import { Projectile } from "../Projectile"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import type { Entity } from "../entity/Entity"
import SilverAgent from "../AiAgents/SilverAgent"
import { Damage,PercentDamage } from "../core/Damage"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { EFFECT, EFFECT_TIMING } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"

// import SETTINGS = require("../../res/globalsettings.json")
const ID = 1
class Silver extends CharacterSkillManager {
	//	onoff: boolean[]
	readonly hpGrowth: number
	usedQ: boolean
	readonly cooltime_list: number[]
	readonly skill_ranges: number[]

	private readonly skill_name: string[]
	// private u_active_amt: number
	// private u_passive_amt: number
	readonly duration_list: number[]


	static readonly VISUALEFFECT_ULT="elephant_r"
	static readonly APPERANCE_ULT="elephant_r"
	static readonly EFFECT_ULT_SHIELD="elephant_r_shield"
	static readonly SKILL_EFFECT_NAME=["elephant_q", "hit", "hit"]
	static readonly SKILL_SCALES=SKILL_SCALES[ID]


	constructor(player:Player) {
		super(player,ID)
		this.cooltime_list = [2, 4, 9]
		this.duration_list = [0, 2, 3]
		this.skill_ranges=[3,15,0]
		this.skill_name = Silver.SKILL_EFFECT_NAME
		
	}


		
	getSkillScale(){
		return Silver.SKILL_SCALES
	}
	getSkillTrajectoryDelay(skilltype: string): number {
		return 0
	}
	/**
	 * returns type,range, whether it is projectile,
	 * if the skill doesnt need target, use the skill
	 * @param {*} s
	 * @returns
	 */
	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s) //-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill=s
		switch (s) {
			case ENUM.SKILL.Q:
				let baserange=this.skill_ranges[s]
				let arange=this.isSkillActivated(ENUM.SKILL.ULT)? 4:0
				skillTargetSelector
					.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
					.setRange(baserange+arange)
					.setConditionedRange(function(this: Entity){
						return this.effects.has(EFFECT.ELEPHANT_W_SIGN)
					}, this.getSkillAmount("w_qrange")+arange)

				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])

				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
		}
		return skillTargetSelector
	}
	useActivationSkill(skill:ENUM.SKILL){
		if(skill===ENUM.SKILL.ULT) this.useUlt()
	}

	private useUlt() {
		this.startCooltime(ENUM.SKILL.ULT)
		this.startDuration(ENUM.SKILL.ULT)

		this.player.effects.applySpecial(this.getUltShield(),Silver.EFFECT_ULT_SHIELD)

		this.player.effects.applySpecial(this.getUltResistance(),SpecialEffect.SKILL.ELEPHANT_ULT.name)
		this.player.effects.apply(EFFECT.SPEED,1)

		this.player.showEffect(Silver.VISUALEFFECT_ULT, this.player.turn)
		this.player.changeApperance(Silver.APPERANCE_ULT)
	}

	getSkillName(skill: number): string {
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos:number): Projectile|null {
		return null
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Silver.SKILL_SCALES.Q)
		}
		return 0
	}
	getSkillAmount(key: string): number {
		if(key==="r_resistance") return this.player.HP < this.player.MaxHP / 10 ? 150 : 80
		if(key==="rshield") return this.calculateScale(Silver.SKILL_SCALES.rshield!)
		if(key==="qheal") return Math.floor(this.getSkillBaseDamage(ENUM.SKILL.Q) * 0.3)
		if(key==="r_qheal") return Math.floor(this.getSkillBaseDamage(ENUM.SKILL.Q) * 0.6)
		if(key==="w_qdamage") return this.calculateScale(Silver.SKILL_SCALES.w_qdamage!)
		if(key==="w_qrange") return 7

		return 0
	}

	private getUltResistance() {
		let amt=this.getSkillAmount("r_resistance")
		return new AblityChangeEffect(EFFECT.ELEPHANT_ULT_RESISTANCE, this.duration_list[2], new Map().set("AR", amt).set("MR", amt))
	}
	private getUltShield() {
		return new ShieldEffect(EFFECT.ELEPHANT_ULT_SHIELD, this.duration_list[2], this.getSkillAmount("rshield"))
	}

	private getWEffect() {
		return new NormalEffect(EFFECT.ELEPHANT_W_SIGN, this.duration_list[1], EFFECT_TIMING.TURN_END).setSourceId(this.player.UEID)
	}

	/**
	 * actually use the skill
	 * get specific damage and projectile objects
	 * starts cooldown
	 * @param {*} target
	 * @returns
	 */
	getSkillDamage(target: Entity,s:number): SkillAttack|null {
		let skillattr = null //-1 when can`t use skill, 0 when it`s not attack skill
		// let s = this.pendingSkill
		this.pendingSkill = -1

		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)

				let dmg = this.getSkillBaseDamage(s)
				let heal=this.isSkillActivated(ENUM.SKILL.ULT) ? this.getSkillAmount("r_qheal") : this.getSkillAmount("qheal")

				skillattr = new SkillAttack(new Damage(0, dmg, 0),this.getSkillName(s),s,this.player)
				.setOnHit(function(this:Player,source:Player){
					source.heal(heal)
				})
				if (target.effects.hasEffectFrom(EFFECT.ELEPHANT_W_SIGN, this.player.UEID)) {
					skillattr.damage.updateTrueDamage(CALC_TYPE.plus, this.getSkillAmount("w_qdamage"))
					target.effects.reset(EFFECT.ELEPHANT_W_SIGN)
				}
				break
			case ENUM.SKILL.W:
				this.startCooltime(ENUM.SKILL.W)
				let effect=this.getWEffect()
				skillattr = new SkillAttack(new Damage(0, 0, 0),this.getSkillName(s),s,this.player)
				.setOnHit(function(this:Player,source:Player){
					this.effects.applySpecial(effect,SpecialEffect.SKILL.ELEPHANT_W.name)
					this.effects.apply(EFFECT.CURSE, 1)				
				})
				break
		}

		return skillattr
	}
	/**
	 * called every turn before throw dice
	 */
	onTurnStart() {
		if (this.player.level >= 3 && this.player.HP <=250) {

			let passive = 0
			if (this.player.HP > this.player.MaxHP * 0.3) {
				passive = 30
			} else if (this.player.HP > this.player.MaxHP * 0.1) {
				passive = 45
			} else {
				passive = 60
			}

			this.player.effects.applySpecial(
				new AblityChangeEffect(EFFECT.ELEPHANT_PASSIVE_RESISTANCE, 2, new Map().set("AR", passive).set("MR", passive)),
				SpecialEffect.SKILL.ELEPHANT_PASSIVE.name
			)

		}
		super.onTurnStart()
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
			this.player.changeApperance("")
		}
	}

}
export { Silver }
