import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { Damage, SkillTargetSelector, SkillDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import {Projectile,ProjectileBuilder} from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")

import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"
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
	
	skillInfo:SkillInfoFactory
	skillInfoKor:SkillInfoFactory

	static PROJ_Q="kraken_q"
	static EFFECT_W="kraken_w"
	static SKILL_EFFECT_NAME=["kraken_q", "hit", "kraken_r"]
	static SKILL_SCALES=SKILL_SCALES[ID]

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp:220, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] =  [220, 40, 8, 8, 0, 40]
		super(turn, team, game, ai, ID, name,  basic_stats)
		this.hpGrowth = 125
		this.cooltime_list = [2, 4, 6]
		this.duration_list=[0,2,0]
		this.skill_ranges=[15,0,20]
		this.itemtree = {
			level: 0,
			items: [ITEM.FULL_DIAMOND_ARMOR,
				 	ITEM.EPIC_FRUIT,
				 	ITEM.EPIC_SHIELD, 
				 	ITEM.EPIC_ARMOR,
				  	ITEM.POWER_OF_MOTHER_NATURE,
					ITEM.WARRIORS_SHIELDSWORD
				],
			final: ITEM.FULL_DIAMOND_ARMOR,
		}
		this.skillInfo=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_ENG)
		this.skillInfoKor=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_KOR)

	}

	getSkillTrajectorySpeed(skilltype:string):number{
		return 0
	}

	getSkillScale(){
		return Gorae.SKILL_SCALES
	}

	private buildProjectile() {
		let _this: Player = this.getPlayer()
		return new ProjectileBuilder(this.game,Gorae.PROJ_Q,Projectile.TYPE_RANGE)
		.setSize(2)
		.setSource(this.turn)
		.setDuration(2)
        .setDamage(new Damage( 0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0))
		.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector 
		= new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE)
		.setSkill(skill) //-1 when can`t use skill, 0 when it`s not attack skill

		//console.log("getSkillAttr" + skill)
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE)
				.setRange(this.skill_ranges[0])
                .setProjectileSize(2)
				
				break
			case ENUM.SKILL.W:
                if(!this.AI){
                    this.useW()
                }
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
	getSkillName(skill: number): string {
		return Gorae.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}
	getWShield(){
		return new ShieldEffect(ENUM.EFFECT.KRAKEN_W_SHIELD,this.duration_list[ENUM.SKILL.W],this.getSkillAmount("wshield"))
	}

    useW() {
		let targets = this.game.playerSelector.getPlayersIn(this,this.pos - 3, this.pos + 3)

	//	console.log(targets)
		let dmg = new SkillDamage( new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.W), 0),ENUM.SKILL.W)

		this.effects.applySpecial(this.getWShield(),Gorae.EFFECT_W)

		for (let p of targets) {
			this.game.playerSelector.get(p).effects.apply(ENUM.EFFECT.SLOW, 1,ENUM.EFFECT_TIMING.TURN_END)
			this.hitOneTarget(p, dmg)
		}
		this.startCooltime(ENUM.SKILL.W)
	}
	getSkillProjectile(pos:number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.Q) {
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.Q)
			return proj
		}
	}
	getSkillBaseDamage(skill:number):number{
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Gorae.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.W) {
			return this.calculateScale(Gorae.SKILL_SCALES.W)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Gorae.SKILL_SCALES.R)
		}
	}
	getSkillAmount(key: string): number {
		if(key==="wshield") return this.calculateScale(Gorae.SKILL_SCALES.wshield)
		return 0
	}
	getSkillDamage(target: number): SkillDamage {
	//	console.log(target+"getSkillDamage"+this.pendingSkill)
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)

				skillattr = new SkillDamage(new Damage(0, 0, this.getSkillBaseDamage(s)),ENUM.SKILL.ULT)
				.setOnKill(() => this.ability.addMaxHP(50))

				break
		}

		return skillattr
	}

	passive() {}
	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {}
	onSkillDurationEnd(skill: number) {}
	/**
	 *
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
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill),
				}
			case ENUM.SKILL.W:
				//사거리내에 1~3 명이상 있으면 사용
				if (
					this.game.playerSelector.getPlayersIn(this,this.pos - 5, this.pos + 5).length >=
					this.game.totalnum- 1 || (this.HP/this.MaxHP < 0.3)
				) {
					this.useW()
					return {type:ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET,data:null}
				}
				return null

			case ENUM.SKILL.ULT:
				let target = this.getUltTarget(skilldata.targets)
				if (target == null) {
					return null
				}
				return { type: ENUM.AI_SKILL_RESULT_TYPE.TARGET, data: target }
		}
	}
    getUltTarget(validtargets:number[]) {
		let ps = this.game.playerSelector.getAll()
		validtargets.sort((b:number, a:number):number => {
			return ps[a].pos - ps[b].pos
		})

		for (let p of validtargets) {
			if (ps[p].HP+ ps[p].shield < this.getSkillBaseDamage(ENUM.SKILL.ULT) 
			&& !ps[p].effects.has(ENUM.EFFECT.SHIELD)) {
				return p
			}
		}
		return null
	}

}

export { Gorae }
