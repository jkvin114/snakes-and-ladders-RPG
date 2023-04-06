import * as ENUM from "../data/enum"
import type { Player } from "../player/player"

import { Damage,PercentDamage } from "../core/Damage"

import {Projectile,ProjectileBuilder} from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { ShieldEffect } from "../StatusEffect"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import { EntityFilter } from "../entity/EntityFilter"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { EFFECT } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"
const ID=6
class Gorae extends CharacterSkillManager {
	skill_ranges: number[]
	//onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	readonly duration_list: number[]
	
	static readonly VISUALEFFECT_W='kraken_w_wave'
	static readonly PROJ_Q="kraken_q"
	static readonly EFFECT_W="kraken_w"
	static readonly SKILL_EFFECT_NAME=["kraken_q", "kraken_w", "kraken_r"]
	static readonly SKILL_SCALES=SKILL_SCALES[ID]

	constructor(player:Player) {
		super(player,ID)
		this.cooltime_list = [1, 4, 7]
		this.duration_list=[0,2,0]
		this.skill_ranges=[15,0,20]
	}

	getSkillTrajectoryDelay(skilltype:string):number{
		return 0
	}

	getSkillScale(){
		return Gorae.SKILL_SCALES
	}

	private buildProjectile() {
		return new ProjectileBuilder(this.player.game,Gorae.PROJ_Q,Projectile.TYPE_RANGE)
		.setSize(2)
		.setSource(this.player)
		.setTrajectorySpeed(300)
		.setDuration(2)
        .setDamage(new Damage( 0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0))
		.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector 
		= new SkillTargetSelector(skill)
		 //-1 when can`t use skill, 0 when it`s not attack skill
		 this.pendingSkill=skill
		//console.log("getSkillAttr" + skill)
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE)
				.setRange(this.skill_ranges[0])
                .setProjectileSize(2)
				
				break
			case ENUM.SKILL.W:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)

				break
			case ENUM.SKILL.ULT:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
				.setRange(this.skill_ranges[0])
				break
		}
		return skillTargetSelector
	}
	useInstantSkill(skill: number): boolean {
		if(skill===ENUM.SKILL.W) this.useW()
		return true
	}
	getSkillName(skill: number): string {
		return Gorae.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}
	getWShield(){
		return new ShieldEffect(EFFECT.KRAKEN_W_SHIELD,this.duration_list[ENUM.SKILL.W],this.getSkillAmount("wshield"))
	}

    private useW() {
		let dmg = new SkillAttack( new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.W), 0),this.getSkillName(ENUM.SKILL.W),ENUM.SKILL.W,this.player)
		.setOnHit(function(this:Player,source:Player){
			this.effects.apply(EFFECT.SLOW, 1)
		})
		
		this.player.effects.applySpecial(this.getWShield(),Gorae.EFFECT_W)

		this.mediator.skillAttack(this.player,EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).inRadius(3),dmg)
		this.player.showEffect(Gorae.VISUALEFFECT_W, this.player.turn)

		this.startCooltime(ENUM.SKILL.W)
	}
	getSkillProjectile(pos:number): Projectile |null{
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.Q) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.Q)
			return proj
		}
		return null
	}
	getSkillBaseDamage(skill:number):number{
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Gorae.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.W) {
			return this.calculateScale(Gorae.SKILL_SCALES.W!)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Gorae.SKILL_SCALES.R!)
		}
		return 0
	}
	getSkillAmount(key: string): number {
		if(key==="wshield") return this.calculateScale(Gorae.SKILL_SCALES.wshield!)
		return 0
	}
	getSkillDamage(target: Entity,s:number): SkillAttack |null {
	//	console.log(target+"getSkillDamage"+this.pendingSkill)
		let skillattr = null
		// let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)

				skillattr = new SkillAttack(new Damage(0, 0, this.getSkillBaseDamage(s)),this.getSkillName(s),s,this.player)
				.setOnKill(function(this:Player){this.ability.addMaxHP(50)})

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

export { Gorae }
