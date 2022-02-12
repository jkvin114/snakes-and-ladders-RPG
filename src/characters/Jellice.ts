import { Player} from "../player"
import * as ENUM from "../enum"
import { CALC_TYPE, Damage, SkillTargetSelector, SkillDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import {Projectile,ProjectileBuilder} from "../Projectile"
import SETTINGS = require("../../res/globalsettings.json")
const ID=5
class Jellice extends Player {
//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private readonly skill_name: string[]
    private u_used:number

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean,name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats = [170, 30, 6, 6, 0, 50]
		super(turn, team, game, ai, ID, name, SETTINGS.characterNames[ID], basic_stats)
	//	this.onoff = [false, false, false]
		this.hpGrowth = 80
		this.cooltime_list = [3, 5, 7]
		this.skill_name = ["magician_q", "hit", "magician_r"]
		this.u_used = 0
		this.itemtree = {
			level: 0,
			items: [4, 23, 34, 32, 19],
			final: 4,
		}
	}
	getSkillInfoKor() {
		let info = []
		info[0] =
			"[직선 번개] 쿨타임:" +
			this.cooltime_list[0] +
			"턴 <br>사용시 앞 5~15칸,뒤 3~8칸 이내 대상들에게 " +
			this.getSkillBaseDamage(0) +
			"의 마법 피해를 입힘"
		info[1] =
			"[몸체 고정] 쿨타임:" +
			this.cooltime_list[1] +
			"턴<br>사용시 한턴 속박 후 모든 스킬 사거리 2배 증가, 다음턴에 신속 효과를 받음,이 상태에서 직선번개 사용시 적중한 적에게 점화 2턴"
		info[2] =
			"[번개파티] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br>사정거리:30 , 범위 3칸의 번개 발사,  맞은 플레이어는 침묵에 걸리고 " +
			this.getSkillBaseDamage(2) +
			"의 마법 피해를 받음, 총 3번 시전할 수 있음"
		return info
	}

	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Spell Attack] cooltime:" +
			this.cooltime_list[0] +
			" turns <br>Damage all players within 5~15 squares front, 3~8 squares back, deals " +
			this.getSkillBaseDamage(0) +
			"magic damage"
		info[1] =
			"[Burning Spellbook] cooltime:" +
			this.cooltime_list[1] +
			" turns<br>Doubles range for all skills for 1 turn, Applies ignite effect on lv1 skill use.Can`t throw dice this turn, gains speed effect after use"
		info[2] =
			"[Dark Sorcery] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>range:30 , Places a projectile with size 3, players steps on it receives " +
			this.getSkillBaseDamage(2) +
			"magic damage and silenced, Can use skill 3 times"
		return info
	}



	getSkillTrajectorySpeed(skilltype: string): number {
		return 0
	}
	private buildProjectile() {
		let _this: Player = this.getPlayer()
		return new ProjectileBuilder({
			owner: _this,
			size: 3,
			skill: ENUM.SKILL.ULT,
			type: "magician_r"
		})
			.setGame(this.game)
            .setSkillRange(30)
			.setAction(function (target: Player) {
				target.effects.apply(ENUM.EFFECT.SILENT,1,ENUM.EFFECT_TIMING.BEFORE_SKILL)
			})
            .setDamage(new Damage(0,this.getSkillBaseDamage(ENUM.SKILL.ULT),0))
			.setDuration(2)
			.setTrajectorySpeed(300)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)	
                if (!this.AI) {
					if(!this.useQ()){
						skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NO_TARGET)	
					}
				}
							
                break
			case ENUM.SKILL.W:
				if (!this.AI) {
					this.useW()
				}
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.ULT:
                let range = this.isSkillActivated(ENUM.SKILL.W) ? 60 : 30
				

				skillTargetSelector
                .setType(ENUM.SKILL_INIT_TYPE.PROJECTILE)
                .setRange(range).setProjectileSize(3)
				break
		}
		return skillTargetSelector
	}

	private useW() {
		this.effects.setShield("magician_w",new ShieldEffect(2,50), false)

		this.startCooltime(ENUM.SKILL.W)
		this.duration[ENUM.SKILL.W] = 2
		this.effects.apply(ENUM.EFFECT.STUN, 1,ENUM.EFFECT_TIMING.TURN_START)
	}
	private useQ():boolean {
		let end = this.isSkillActivated(ENUM.SKILL.W)? 30 : 15
		let start = this.isSkillActivated(ENUM.SKILL.W) ? 3 : 5

		let targets = this.game.playerSelector.getPlayersIn(this,this.pos + start, this.pos + end)
		targets = targets.concat(
			this.game.playerSelector.getPlayersIn(this,this.pos - end + 7, this.pos - start)
		)
		let dmg:SkillDamage = {
			damage: new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0),
			skill: ENUM.SKILL.Q,
            onHit:null
		}

		if (targets.length === 0) {
			return false
		}
		for (let p of targets) {
			if (this.isSkillActivated(ENUM.SKILL.W)) {
                dmg.onHit=(target: Player)=>{
                    target.effects.giveIgniteEffect(2, this.turn)
                }
				
			}
			this.hitOneTarget(p, dmg)
		}
		this.startCooltime(ENUM.SKILL.Q)
		return true
	}

	getSkillName(skill: number): string {
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	getSkillProjectile(t: number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1

        if (s === ENUM.SKILL.ULT) {
			let proj = this.buildProjectile()
			this.projectile.push(proj)
			this.u_used+=1
			if(this.u_used===3){
				this.startCooltime(ENUM.SKILL.ULT)
				this.u_used=0
			}

			return proj
            
		}

	}

	private getSkillBaseDamage(skill:number):number{
		if(skill===ENUM.SKILL.Q){
			return Math.floor(this.ability.AP * 0.8 + 10)
		}
        if(skill===ENUM.SKILL.ULT){
			return 60 + Math.floor(0.4 * this.ability.AP)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		return null
	}
	onSkillDurationEnd(skill: number) {}
	passive() {}
	onSkillDurationCount() {}
	/**
	 *
	 * @param {*} skilldata
	 * @param {*} skill 0~
	 */
	aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
		console.log("aiSkillFinalSelection" + skill + "" + skilldata)
		if (
			skilldata === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_COOL ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGET
		) {
			return null
		}
		switch (skill) {
			case ENUM.SKILL.Q:
				//사거리네에 플레이어 있거나 w 쓰고 사거리안에 1~3명 있을때 사용
				if (
					this.game.playerSelector.getPlayersIn(this,this.pos - 7, this.pos + 15).length > 0 ||
					(this.duration[ENUM.SKILL.W] > 0 &&
						this.game.playerSelector.getPlayersIn(this,this.pos - 23, this.pos + 30).length >=
							this.game.totalnum- 1)
				) {
					this.useQ()
					return {type:ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET,data:null}
				}
			case ENUM.SKILL.W:
				//q 쿨 있고 사거리내에 1~3 명이상 있으면 사용
				if (
					this.cooltime[0] === 0 &&
					this.game.playerSelector.getPlayersIn(this,this.pos - 23, this.pos + 30).length >=
						this.game.totalnum - 1
				) {
					this.useW()
					return {type:ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET,data:null}
				}

			case ENUM.SKILL.ULT:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill),
				}
		}
		return null
	}
}
export { Jellice }
