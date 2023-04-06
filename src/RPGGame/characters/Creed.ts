import type { Player } from "../player/player"

import * as ENUM from "../data/enum"
import { ITEM } from "../data/enum"
import { Damage,PercentDamage } from "../core/Damage"

import { Projectile, ProjectileBuilder } from "../Projectile"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import { ShieldEffect } from "../StatusEffect"
import { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { EFFECT } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"

const ID = 0
class Creed extends CharacterSkillManager {
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly skill_ranges: number[]

	private usedQ: boolean
	readonly duration_list: number[]

	static readonly PROJ_W='reaper_w'
	static readonly Q_SHIELD="reaper_q"
	static readonly ULT_SHIELD="reaper_ult"
	static readonly SKILL_EFFECT_NAME=["reaper_q", "hit", "reaper_r"]

	static readonly SKILL_SCALES=SKILL_SCALES[ID]
	private transformPlayer:Player

	constructor(player:Player) {
		super(player,ID)
		this.skill_ranges=[7,30,20]

		this.cooltime_list = [3, 4, 8]
		this.duration_list=[0,0,0]
		this.usedQ = false
	}



	getSkillScale(){
		return Creed.SKILL_SCALES
	}

	getSkillTrajectoryDelay(skilltype: string): number {
		return 0
	}

	private buildProjectile() {
		let _this: Player = this.player
		return new ProjectileBuilder(this.player.game,Creed.PROJ_W,Projectile.TYPE_RANGE)
			.setSize(3)
			.setSource(this.player)
			.setAction(function (this: Player) {
				this.game.playerForceMove(this,this.pos - 4, false, ENUM.FORCEMOVE_TYPE.SIMPLE)
			})
			.setDamage(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.W), 0))
			.setTrajectorySpeed(300)
			.addFlag(Projectile.FLAG_IGNORE_OBSTACLE)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(skill) //-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill = skill
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

	getSkillProjectile(pos:number): Projectile|null {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.W) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.W)
			return proj
		}
		else if(s==ENUM.SKILL.ULT){
			this.startCooltime(ENUM.SKILL.ULT)
		}
		return null
	}
	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Creed.SKILL_SCALES.Q!)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Creed.SKILL_SCALES.R!)
		}
		if (skill === ENUM.SKILL.W) {
			return this.calculateScale(Creed.SKILL_SCALES.W!)
		}
		return 0
	}
	private getQShield(shieldamt:number){
		return new ShieldEffect(EFFECT.REAPER_Q_SHIELD,1, shieldamt)
	}
	private getUltShield(){
		return new ShieldEffect(EFFECT.REAPER_ULT_SHIELD,3, 70)
	}

	getSkillDamage(target: Entity,s:number): SkillAttack |null{
	//	console.log(target + "getSkillDamage" + this.pendingSkill)
		let damage = null
		// let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				if (this.usedQ) {
					this.startCooltime(ENUM.SKILL.Q)
					this.usedQ = false
					//this.effects.applySpecial(this.getQShield(40),Creed.Q_SHIELD)

					damage = new SkillAttack (new Damage(this.getSkillBaseDamage(s) * 0.5, 0, 0),this.getSkillName(s),s,this.player)
				} else {
					this.usedQ = true
				//	this.effects.applySpecial(this.getQShield(30),Creed.Q_SHIELD)
					damage = new SkillAttack (new Damage(this.getSkillBaseDamage(s), 0, 0),this.getSkillName(s),s,this.player)
				}
				break
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)
				this.player.effects.applySpecial(this.getUltShield(),Creed.ULT_SHIELD)
				// this.effects.setShield("swordsman_r", new ShieldEffect(3, 70), false)
				let originalpos = this.player.pos
				this.player.game.playerForceMove(this.player,target.pos, true, ENUM.FORCEMOVE_TYPE.LEVITATE)
				damage = new SkillAttack (new Damage(this.getSkillBaseDamage(s) * (originalpos < this.player.pos ? 0.7 : 1), 0, 0),this.getSkillName(s),s,this.player)
				break
		}

		return damage
	}
	useActivationSkill(skill: number): void {
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {
	}
	onSkillDurationEnd(skill: number) {}
}

export { Creed }
