import { Player } from "../player/player"
import type { Game } from "../Game"

import * as ENUM from "../data/enum"
import { ITEM } from "../data/enum"
import { Damage, SkillTargetSelector, SkillAttack } from "../core/Util"
import { Projectile, ProjectileBuilder } from "../Projectile"
import { SkillInfoFactory } from "../core/helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import { ShieldEffect } from "../StatusEffect"
import CreedAgent from "../AiAgents/CreedAgent"

const ID = 0
class Creed extends Player {
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly skill_ranges: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private usedQ: boolean
	readonly duration_list: number[]

	skillInfo:SkillInfoFactory
	skillInfoKor:SkillInfoFactory
	static readonly PROJ_W='reaper_w'
	static readonly Q_SHIELD="reaper_q"
	static readonly ULT_SHIELD="reaper_ult"
	static readonly SKILL_EFFECT_NAME=["reaper_q", "reaper_w", "reaper_r"]

	static readonly SKILL_SCALES=SKILL_SCALES[ID]

	constructor(turn: number, team: boolean , game: Game, ai: boolean, name: string) {
		//hp:200, ad:20, ar, mr, attackrange,ap
		const basic_stats: number[] = [200, 20, 7, 7, 0, 0]
		super(turn, team, game, ai, ID, name)
		this.skill_ranges=[7,30,20]

		this.cooltime_list = [3, 4, 9]
		this.duration_list=[0,0,0]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.EPIC_WHIP,
				ITEM.SWORD_OF_BLOOD,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SWORD
		}
		this.usedQ = false
		this.AiAgent=new CreedAgent(this)
	}



	getSkillScale(){
		return Creed.SKILL_SCALES
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		return 0
	}

	private buildProjectile() {
		let _this: Player = this
		return new ProjectileBuilder(this.game,Creed.PROJ_W,Projectile.TYPE_RANGE)
			.setSize(3)
			.setSource(this.turn)
			.setAction(function (this: Player) {
				this.game.playerForceMove(this,this.pos - 4, false, ENUM.FORCEMOVE_TYPE.SIMPLE)
			})
			.setTrajectorySpeed(300)
			.addFlag(Projectile.FLAG_IGNORE_OBSTACLE)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(skill) //-1 when can`t use skill, 0 when it`s not attack skill

	//	console.log("getSkillAttr" + skill)
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(7)

				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(30).setProjectileSize(3)

				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(20)
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		return Creed.SKILL_EFFECT_NAME[skill]
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
			return this.calculateScale(Creed.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Creed.SKILL_SCALES.Q)
		}
	}
	private getQShield(shieldamt:number){
		return new ShieldEffect(ENUM.EFFECT.REAPER_Q_SHIELD,1, shieldamt)
	}
	private getUltShield(){
		return new ShieldEffect(ENUM.EFFECT.REAPER_ULT_SHIELD,3, 70)
	}

	getSkillDamage(target: number): SkillAttack {
	//	console.log(target + "getSkillDamage" + this.pendingSkill)
		let damage: SkillAttack = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				if (this.usedQ) {
					this.startCooltime(ENUM.SKILL.Q)
					this.usedQ = false
					this.effects.applySpecial(this.getQShield(40),Creed.Q_SHIELD)

					damage = new SkillAttack(new Damage(this.getSkillBaseDamage(s) * 0.5, 0, 0),this.getSkillName(s)).ofSkill(s)
				} else {
					this.usedQ = true
					this.effects.applySpecial(this.getQShield(30),Creed.Q_SHIELD)
					damage = new SkillAttack(new Damage(this.getSkillBaseDamage(s), 0, 0),this.getSkillName(s)).ofSkill(s)
				}
				break
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)
				this.effects.applySpecial(this.getUltShield(),Creed.ULT_SHIELD)
				// this.effects.setShield("swordsman_r", new ShieldEffect(3, 70), false)
				let originalpos = this.pos
				this.game.playerForceMove(this,this.game.pOfTurn(target).pos, true, ENUM.FORCEMOVE_TYPE.LEVITATE)
				damage = new SkillAttack(new Damage(this.getSkillBaseDamage(s) * (originalpos < this.pos ? 0.7 : 1), 0, 0),this.getSkillName(s)).ofSkill(s)
				break
		}

		return damage
	}

	passive() {}
	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {}
	onSkillDurationEnd(skill: number) {}
	/**
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
	// 			return {
	// 				type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
	// 				data: this.getAiTarget(skilldata.targets)
	// 			}
	// 	}
	// }
	/*

	aiSkillFinalSelection_Q(skilldata,targets): { type: number; data: number }{
		return {
			type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
			data: this.getAiTarget(skilldata.targets)
		}
	}
	aiSkillFinalSelection_W(){
		return {
			type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
			data: this.getAiProjPos(skilldata, ENUM.SKILL.W)
		}
	}
	aiSkillFinalSelection_Ult(){
		return {
			type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
			data: this.getAiTarget(skilldata.targets)
		}
	}



	aiUseSkills(){
		for (let i of [ENUM.SKILL.Q,ENUM.SKILL.W,ENUM.SKILL.ULT]) {
			//let slist = ["Q", "W", "ult"]
			let skillatr=this.game.initSkill(i)
			if (
				skillatr === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
				skillatr === ENUM.INIT_SKILL_RESULT.NO_COOL ||
				skillatr === ENUM.INIT_SKILL_RESULT.NO_TARGET
			){
				return
			}

			if(i===ENUM.SKILL.Q){
				let skillresult=aiSkillFinalSelection_Q()


			}
			else if(i===ENUM.SKILL.W){



			}
			else if(i===ENUM.SKILL.ULT){



			}
			


			let skillresult = p.aiSkillFinalSelection(this.initSkill(i), i)
			if (!skillresult) {
				continue
			}

			if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.LOCATION) {
				console.log(skillresult)
				if (skillresult.data === -1) {
					return
				}
				this.game.placeProj(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.TARGET) {

				this.game.useSkillToTarget(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET) {
			}
		}
	}
	*/
}

export { Creed }
