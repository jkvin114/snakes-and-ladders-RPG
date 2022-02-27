import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { Damage, SkillTargetSelector, SkillDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import {Projectile,ProjectileBuilder} from "../Projectile"
import SETTINGS = require("../../res/globalsettings.json")
const ID=6
class Gorae extends Player {
	//onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private readonly skill_name: string[]

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp:220, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] =  [220, 40, 8, 8, 0, 40]
		super(turn, team, game, ai, ID, name,  basic_stats)
		this.hpGrowth = 125
		this.cooltime_list = [2, 4, 6]
		this.skill_name = ["kraken_q", "hit", "kraken_r"]
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
	}

	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Tenacle Strike] cooltime:" +
			this.cooltime_list[0] +
			" turn <br>range:15 , Places a projectile with size 2.Players steps on it receives  " +
			this.getSkillBaseDamage(0) +
			"magic damage"
		info[1] =
			"[Mucus Shower] cooltime:" +
			this.cooltime_list[1] +
			" turn<br>Damage all players within 7 squares, deals " +
			this.getSkillBaseDamage(1) +
			" magic damage and slow them. Gains shield of" +
			Math.floor(0.1 * this.MaxHP)
		info[2] =
			"[Predation] cooltime:" +
			this.cooltime_list[2] +
			" turn<br>range:20 ,Devour a target, dealing  " +
			this.getSkillBaseDamage(2)+
			"fixed damage If the target dies, maximum HP increases permanently by 50."
		return info
	}

	getSkillInfoKor() {
		let info = []
		info[0] =
			"[촉수 채찍] 쿨타임:" +
			this.cooltime_list[0] +
			"턴 <br>사정거리:15 , 범위 2칸의 촉수 설치,  맞은 플레이어에게  " +
			this.getSkillBaseDamage(0) +
			"의 마법 피해를 입힘"
		info[1] =
			"[보호의 물] 쿨타임:" +
			this.cooltime_list[1] +
			"턴<br>7칸 이내의 플레이어에게 " +
			this.getSkillBaseDamage(1) +
			" 의 마법 피해를 입히고 둔화시키고 자신은 " +
			Math.floor(0.15 * this.MaxHP) +
			"의 보호막을 얻음"
		info[2] =
			"[블랙홀] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br>사정거리:20 ,대상에게  " +
			this.getSkillBaseDamage(2) +
			"의 고정 피해를 입히고 대상 처치시 최대체력 50 증가"
		return info
	}
	getSkillTrajectorySpeed(skilltype:string):number{
		return 0
	}


	private buildProjectile() {
		let _this: Player = this.getPlayer()
		return new ProjectileBuilder({
			owner: _this,
			size: 2,
			skill: ENUM.SKILL.Q,
			type: "kraken_q"
		})
		.setGame(this.game)
		.setSkillRange(15)
		.setDuration(2)
        .setDamage(new Damage( 0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0))
		.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector 
		= new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE)
		.setSkill(skill) //-1 when can`t use skill, 0 when it`s not attack skill

		console.log("getSkillAttr" + skill)
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE)
				.setRange(15)
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
				.setRange(20)
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

    useW() {
		let targets = this.game.playerSelector.getPlayersIn(this,this.pos - 3, this.pos + 3)

		console.log(targets)
		let dmg = {
			damage: new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.W), 0),
			skill: ENUM.SKILL.W,
		}
		this.effects.setShield("kraken_w",new ShieldEffect(2,Math.floor(0.15 * this.MaxHP)), false)
		for (let p of targets) {
			this.game.playerSelector.get(p).effects.apply(ENUM.EFFECT.SLOW, 1,ENUM.EFFECT_TIMING.TURN_END)
			this.hitOneTarget(p, dmg)
		}
		this.startCooltime(ENUM.SKILL.W)
	}
	getSkillProjectile(target: number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.Q) {
			let proj = this.buildProjectile()
			this.projectile.push(proj)
			this.startCooltime(ENUM.SKILL.Q)
			return proj
		}
	}
	private getSkillBaseDamage(skill:number):number{
		if(skill===ENUM.SKILL.Q){
			return Math.floor(10 + 0.2 * this.HP + this.ability.AP)
		}
        if(skill===ENUM.SKILL.W){
			return Math.floor(this.ability.AP * 0.5 + 30)
		}
		if(skill===ENUM.SKILL.ULT){
			return Math.floor(40 + 0.15 * this.MaxHP + 0.6 * this.ability.AD)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		console.log(target+"getSkillDamage"+this.pendingSkill)
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)

                let _this=this
				skillattr = {
					damage: new Damage(0, 0, this.getSkillBaseDamage(s)),
					skill: ENUM.SKILL.ULT,
                    onKill: function () {
                        _this.ability.addMaxHP(50)
                    }
				}
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
