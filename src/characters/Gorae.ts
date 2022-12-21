import * as ENUM from "../data/enum"
import { Player } from "../player/player"
import type { Game } from "../Game"

import { Damage,PercentDamage } from "../core/Damage"

import {Projectile,ProjectileBuilder} from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { ShieldEffect } from "../StatusEffect"
import { SkillInfoFactory } from "../data/SkillDescription"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import { EntityFilter } from "../entity/EntityFilter"
import GoraeAgent from "../AiAgents/GoraeAgent"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
const ID=6
class Gorae extends Player {
	skill_ranges: number[]
	//onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	readonly duration_list: number[]
	
	static readonly VISUALEFFECT_W='kraken_w_wave'
	static readonly PROJ_Q="kraken_q"
	static readonly EFFECT_W="kraken_w"
	static readonly SKILL_EFFECT_NAME=["kraken_q", "kraken_w", "kraken_r"]
	static readonly SKILL_SCALES=SKILL_SCALES[ID]

	constructor(turn: number, team: number , game: Game, ai: boolean, name: string) {
		//hp:220, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] =  [220, 40, 8, 8, 0, 40]
		super(turn, team, game, ai, ID, name)
		this.cooltime_list = [2, 4, 6]
		this.duration_list=[0,2,0]
		this.skill_ranges=[15,0,20]
		
		this.AiAgent=new GoraeAgent(this)
	}

	getSkillTrajectorySpeed(skilltype:string):number{
		return 0
	}

	getSkillScale(){
		return Gorae.SKILL_SCALES
	}

	private buildProjectile() {
		return new ProjectileBuilder(this.game,Gorae.PROJ_Q,Projectile.TYPE_RANGE)
		.setSize(2)
		.setSource(this)
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
	useNonTargetSkill(skill: number): boolean {
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
		return new ShieldEffect(ENUM.EFFECT.KRAKEN_W_SHIELD,this.duration_list[ENUM.SKILL.W],this.getSkillAmount("wshield"))
	}

    private useW() {
		let dmg = new SkillAttack( new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.W), 0),this.getSkillName(ENUM.SKILL.W))
		.ofSkill(ENUM.SKILL.W)
		.setOnHit(function(this:Player,source:Player){
			this.effects.apply(ENUM.EFFECT.SLOW, 1)
		})
		
		this.effects.applySpecial(this.getWShield(),Gorae.EFFECT_W)

		this.mediator.skillAttack(this,EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(3),dmg)
		this.showEffect(Gorae.VISUALEFFECT_W, this.turn)

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
	getSkillDamage(target: Entity): SkillAttack |null {
	//	console.log(target+"getSkillDamage"+this.pendingSkill)
		let skillattr = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)

				skillattr = new SkillAttack(new Damage(0, 0, this.getSkillBaseDamage(s)),this.getSkillName(s)).ofSkill(s)
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
	/**
	 *
	 * @param {*} skilldata
	 * @param {*} skill 0~
	//  */
	// aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
	// 	if (
	// 		skilldata === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
	// 		skilldata === ENUM.INIT_SKILL_RESULT.NO_COOL ||
	// 		skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
	// 	) {
	// 		return null
	// 	}
    //     switch (skill) {
	// 		case ENUM.SKILL.Q:
	// 			return {
	// 				type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
	// 				data: this.getAiProjPos(skilldata, skill),
	// 			}
	// 		case ENUM.SKILL.W:
	// 			//사거리내에 1~3 명이상 있으면 사용
	// 			if (
	// 				this.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(5)).length >=
	// 				this.game.totalnum- 1 || (this.HP/this.MaxHP < 0.3)
	// 			) {
	// 				this.useW()
	// 				return {type:ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET,data:null}
	// 			}
	// 			return null

	// 		case ENUM.SKILL.ULT:
	// 			let target = this.getUltTarget(skilldata.targets)
	// 			if (target == null) {
	// 				return null
	// 			}
	// 			return { type: ENUM.AI_SKILL_RESULT_TYPE.TARGET, data: target }
	// 	}
	// }
    // getUltTarget(validtargets:number[]) {
	// 	let ps = this.mediator.allPlayer()
	// 	validtargets.sort((b:number, a:number):number => {
	// 		return ps[a].pos - ps[b].pos
	// 	})

	// 	for (let p of validtargets) {
	// 		if (ps[p].HP+ ps[p].shield < this.getSkillBaseDamage(ENUM.SKILL.ULT) 
	// 		&& !ps[p].effects.has(ENUM.EFFECT.SHIELD)) {
	// 			return p
	// 		}
	// 	}
	// 	return null
	// }

}

export { Gorae }
