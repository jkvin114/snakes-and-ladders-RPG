import { Player} from "../player"
import * as ENUM from "../enum"
import { Damage, SkillTargetSelector, SkillDamage, SkillEffect } from "../Util"
import { Game } from "../Game"
import {Projectile,ProjectileBuilder} from "../Projectile"
class Timo extends Player {
	onoff: boolean[]
	hpGrowth: number
	projectile: Projectile[]
	cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private skill_name: string[]

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, char: number, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		let basic_stats: number[] = [170, 30, 6, 6, 1, 30]
		super(turn, team, game, ai, char, name, "Ghost", basic_stats)
		this.onoff = [false, false, false]
		this.hpGrowth = 100
		this.projectile = []
		this.cooltime_list = [3, 6, 6]
		this.skill_name = ["ghost_q", "hit", "ghost_r"]
		this.itemtree = {
			level: 0,
			items: [4, 23, 34, 19, 16],
			final: 4,
		}
	}

    getSkillInfoKor() {
		let info = []
		info[0] =
			"[실명] 쿨타임:" +
			this.cooltime_list[0] +
			"턴<br>범위:18,사용시 맞은 대상을 2턴 실명시키고 " +
			this.getSkillBaseDamage(0) +
			"의 마법 피해를 입힘"
		info[1] =
			"[재빠른 이동] 쿨타임:" +
			this.cooltime_list[1] +
			"턴<br>[기본 지속 효과]:투명화 상태에서 실명 사용시 대상의 잃은 체력의 30%의 추가 마법피해를 입힘[사용시]: 1턴간 모든 스킬과 장애물/강제이동 무시, "
		info[2] =
			"[죽음의 버섯] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br>사정거리:30 , 범위 4칸의 버섯 설치, 맞은 플레이어는 둔화에 걸리고 3턴에 걸쳐 " +
			this.getSkillBaseDamage(2)*3 +
			"의 마법 피해를 받음"
		return info
	}
	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Blind Curse] cooltime:" +
			this.cooltime_list[0] +
			" turns<br>range:18,deals  " +
			this.getSkillBaseDamage(0) +
			"magic damage, and blinds the target for 2 turns"
		info[1] =
			"[Phantom Menace] cooltime:" +
			this.cooltime_list[1] +
			" turns<br>[Passive]:When invisible, deals additional (30% of target`s missing health) magic damage on use of 'Blind curse'[On use]: Gains invisibility effect for 1 turn., "
		info[2] =
			"[Poison Bomb] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>range:30 ,Places a projectile with size 4, player steps on it slowed and receive total" +
			this.getSkillBaseDamage(2)*3 +
			"magic damage for 3 turns"
		return info
	}

	getSkillTrajectorySpeed(skilltype:string):number{
        if(skilltype==="ghost_q"||skilltype==="ghost_w_q")
            return 500



		return 0
	}

	private buildProjectile() {
		let _this: Player = this.getPlayer()
        let dmg=new Damage(0,this.getSkillBaseDamage(ENUM.SKILL.ULT),0)
		return new ProjectileBuilder({
			owner: _this,
			size: 4,
			skill: ENUM.SKILL.ULT,
			type: "ghost_r"
		})
		.setGame(this.game)
		.setSkillRange(30)
		.setAction(function (target: Player) {
			target.giveSkillEffect(new SkillEffect("timo_u",_this.turn,4,"Death Poison",dmg))
		})
        .setTrajectorySpeed(300)
		.setDuration(2)
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
				.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
				.setRange(18)
				
				break
			case ENUM.SKILL.W:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				if(!this.AI){
                    this.useW()
                }

				break
			case ENUM.SKILL.ULT:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE)
				.setRange(30)
                .setProjectileSize(4)
				break
		}
		return skillTargetSelector
	}

    useW(){
        
		this.startCooltime(ENUM.SKILL.W)
		this.duration[ENUM.SKILL.W] = 1
		this.applyEffectAfterSkill(ENUM.EFFECT.INVISIBILITY, 1)

    }
	getSkillName(skill: number): string {
        if(skill===ENUM.SKILL.Q && this.haveEffect(ENUM.EFFECT.INVISIBILITY)){
            return "ghost_w_q"
        }
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(target: number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.ULT) {
			let proj = this.buildProjectile()
			this.projectile.push(proj)
			this.startCooltime(ENUM.SKILL.ULT)
			return proj
		}
	}
	private getSkillBaseDamage(skill:number):number{
		if(skill===ENUM.SKILL.Q){
			return Math.floor(20 + this.ability.AP*0.8)
		}
		if(skill===ENUM.SKILL.ULT){
			return Math.floor(30 + 0.5 * this.ability.AP)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		console.log(target+"getSkillDamage"+this.pendingSkill)
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				
				let admg = 0
				if (this.level > 1 && this.haveEffect(ENUM.EFFECT.INVISIBILITY)) {
					admg = Math.floor(
						0.3 * (this.players[target].MaxHP - this.players[target].HP)
					)
				}
				skillattr = {
					damage: new Damage(0,this.getSkillBaseDamage(s) + admg, 0),
					skill: ENUM.SKILL.Q,
                    onHit:function(target:Player){
                       target.applyEffectAfterSkill(ENUM.EFFECT.BLIND, 2)
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
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
			case ENUM.SKILL.W:
                if(this.cooltime[ENUM.SKILL.Q]<=1){
                    this.useW()
                }
                
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET,
					data: null
				}
			case ENUM.SKILL.ULT:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill)
				}
		}
	}

}

export { Timo }
