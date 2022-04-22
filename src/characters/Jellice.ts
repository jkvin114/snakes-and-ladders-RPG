import { Player } from "../player"
import type { Game } from "../Game"


import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillTargetSelector, SkillAttack, PercentDamage } from "../Util"
import { TickDamageEffect, TickEffect,ShieldEffect, NormalEffect, EFFECT_TIMING } from "../StatusEffect"
import { Projectile, ProjectileBuilder } from "../Projectile"
import { SpecialEffect } from "../SpecialEffect"
import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import { EntityFilter } from "../EntityFilter"
import JelliceAgent from "../AiAgents/JelliceAgent"

// import SETTINGS = require("../../res/globalsettings.json")
const ID = 5
class Jellice extends Player {
	skillInfoKor: SkillInfoFactory
	skillInfo: SkillInfoFactory
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	skill_ranges: number[]

	
	private u_used: number
	readonly duration_list: number[]

	static readonly PROJ_ULT = "magician_r"
	// static readonly EFFECT_W="magician_w"
	// static readonly EFFECT_W_BURN="magician_w_burn"
	static readonly SKILLNAME_W_Q = "magician_w_q"
	static readonly SKILL_SCALES = SKILL_SCALES[ID]
	static readonly SKILL_EFFECT_NAME = ["magician_q", "hit", "magician_r"]
	static readonly EFFECT_W_SHIELD="magician_w_shield"

	constructor(turn: number, team: boolean, game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats = [170, 30, 6, 6, 0, 50]
		super(turn, team, game, ai, ID, name)
		//	this.onoff = [false, false, false]
		this.cooltime_list = [3, 4, 7] //3 5 7
		this.duration_list = [0, 1, 0]
		this.skill_ranges = [0, 0, 30]
		this.u_used = 0
		
		this.skillInfo = new SkillInfoFactory(ID, this, SkillInfoFactory.LANG_ENG)
		this.skillInfoKor = new SkillInfoFactory(ID, this, SkillInfoFactory.LANG_KOR)
		this.AiAgent=new JelliceAgent(this)

	}

	getSkillScale() {
		return Jellice.SKILL_SCALES
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		return 0
	}
	private buildProjectile() {
		let _this: Player = this.getPlayer()
		return new ProjectileBuilder(this.game, Jellice.PROJ_ULT, Projectile.TYPE_RANGE)
			.setSize(3)
			.setSource(this.turn)
			.setAction(function (this: Player) {
				this.effects.apply(ENUM.EFFECT.SILENT, 1)
			})
			.setDamage(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.ULT), 0))
			.setDuration(2)
			.setTrajectorySpeed(300)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s) //-1 when can`t use skill, 0 when it`s not attack skill
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
			case ENUM.SKILL.ULT:
				let range = (this.isSkillActivated(ENUM.SKILL.W) ? 2 : 1) * this.skill_ranges[s]
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(range).setProjectileSize(3)

				break
		}
		return skillTargetSelector
	}
	useActivationSkill(skill: number): void {
		if(skill===ENUM.SKILL.W) this.useW()
	}
	useNonTargetSkill(skill: number): boolean {
		if(skill===ENUM.SKILL.Q) return this.useQ()
	}
	private getWShield() {
		return new ShieldEffect(ENUM.EFFECT.MAGICIAN_W_SHIELD, 2, 50)
	}
	private getWEffect(){
		return new NormalEffect(ENUM.EFFECT.MAGICIAN_W,2,EFFECT_TIMING.TURN_START)
	}
	private getWBurnEffect() {
		return new TickDamageEffect(
			ENUM.EFFECT.MAGICIAN_W_BURN,
			2, //2
			TickEffect.FREQ_EVERY_PLAYER_TURN,
			new PercentDamage(this.getSkillBaseDamage(ENUM.SKILL.W), PercentDamage.MAX_HP)
		).setSourceId(this.UEID)
	}
	private useW() {
		console.log("usew")
		this.effects.applySpecial(this.getWShield(), Jellice.EFFECT_W_SHIELD)
		this.effects.applySpecial(this.getWEffect(), SpecialEffect.SKILL.MAGICIAN_W.name)

		this.startCooltime(ENUM.SKILL.W)
		this.duration[ENUM.SKILL.W] = 2
		this.effects.apply(ENUM.EFFECT.STUN, 1)
	}

	private qRange(){
		let w_on = this.isSkillActivated(ENUM.SKILL.W)
		let end_front = this.effects.modifySkillRange((w_on ? 2 : 1) * this.getSkillAmount("qrange_end_front"))
		let end_back = this.effects.modifySkillRange((w_on ? 2 : 1) * this.getSkillAmount("qrange_end_back"))
		let start = this.getSkillAmount("qrange_start") - (w_on ? 1 : 0)
		return {end_front:end_front,end_back:end_back,start:start}
	}
	private useQ(): boolean {
		
		
		let dmg = new SkillAttack(
			new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0),
			this.getSkillName(ENUM.SKILL.Q)
		).ofSkill(ENUM.SKILL.Q)

		if (this.isSkillActivated(ENUM.SKILL.W)) {
			// let burn = this.
			let _this=this
			dmg.setOnHit(function (this: Player) {
				this.effects.applySpecial(_this.getWBurnEffect(), SpecialEffect.SKILL.MAGICIAN_W_BURN.name)
			})
		}
		let range=this.qRange()
		let attacked=this.mediator.skillAttack(
			this,
			EntityFilter.ALL_ATTACKABLE_PLAYER(this)
				.in(this.pos + range.start + 1, this.pos + range.end_front)
				.in(this.pos - range.end_back, this.pos - range.start)
		)(dmg)

		
		if(!attacked) return false


		this.startCooltime(ENUM.SKILL.Q)
		return true
	}

	getSkillName(skill: number): string {
		if (skill === ENUM.SKILL.Q && this.isSkillActivated(ENUM.SKILL.W)) {
			return Jellice.SKILLNAME_W_Q
		}
		return Jellice.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	getSkillProjectile(pos: number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1

		if (s === ENUM.SKILL.ULT) {
			let proj = this.buildProjectile()
			this.u_used += 1
			if (this.u_used === 3) {
				this.startCooltime(ENUM.SKILL.ULT)
				this.u_used = 0
			}

			return proj
		}
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Jellice.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.W) {
			return this.calculateScale(Jellice.SKILL_SCALES.W)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Jellice.SKILL_SCALES.R)
		}
	}
	getSkillAmount(key: string): number {
		if (key === "qrange_start") return 3
		if (key === "qrange_end_front") return 20
		if (key === "qrange_end_back") return 8
		//앞 3~15, 뒤 3~8
		return 0
	}
	getSkillDamage(target: number): SkillAttack {
		return null
	}
	onSkillDurationEnd(skill: number) {}
	passive() {}
	onSkillDurationCount() {}
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

	// 	console.log("aiSkillFinalSelection" + skill + "" + skilldata)
	// 	switch (skill) {
	// 		case ENUM.SKILL.Q:
	// 			//사거리네에 플레이어 있거나 w 쓰고 사거리안에 1~3명 있을때 사용
	// 			if (
	// 				this.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this)
	// 				.in(this.pos + this.qRange().start + 1, this.pos + this.qRange().end_front)
	// 				.in(this.pos - this.qRange().end_back, this.pos - this.qRange().start)).length>0
	// 			) {
	// 				this.useQ()
	// 				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
	// 			}
	// 			break
	// 		case ENUM.SKILL.W:
	// 			//q 쿨 있고 사거리내에 1~3 명이상 있으면 사용
	// 			if (
	// 				this.cooltime[0] === 0 &&
	// 				this.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this).in(this.pos-23,this.pos+30)).length >= this.game.totalnum - 1
	// 			) {
	// 				this.useW()
	// 				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
	// 			}
	// 			break
	// 		case ENUM.SKILL.ULT:
	// 			return {
	// 				type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
	// 				data: this.getAiProjPos(skilldata, skill)
	// 			}
	// 	}
	// 	return null
	// }
}
export { Jellice }
