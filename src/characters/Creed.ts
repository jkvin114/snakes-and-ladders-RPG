import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"
import { Damage, SkillTargetSelector, SkillDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import { Projectile, ProjectileBuilder } from "../Projectile"
import SETTINGS = require("../../res/globalsettings.json")
const ID = 0
class Creed extends Player {
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private readonly skill_name: string[]
	private usedQ: boolean

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp:200, ad:20, ar, mr, attackrange,ap
		const basic_stats: number[] = [200, 20, 7, 7, 0, 0]
		super(turn, team, game, ai, ID, name, basic_stats)
		this.hpGrowth = 100

		this.cooltime_list = [3, 4, 9]
		this.skill_name = ["reaper_q", "reaper_w", "reaper_r"]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.SWORD_OF_BLOOD,
				ITEM.EPIC_WHIP,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SWORD
		}
		this.usedQ = false
	}

	getSkillInfoKor() {
		let info: string[] = []
		info[0] =
			"[절단] 쿨타임:" +
			this.cooltime_list[0] +
			"턴<br>사정거리:5,최대 두번 칼로 뚫어 " +
			this.getSkillBaseDamage(0) +
			"의 물리 피해를 입힘,두번째 사용시 50%의 피해를 입힘"
		info[1] =
			"[바람 가르기] 쿨타임:" +
			this.cooltime_list[1] +
			"턴<br>사정거리:30 ,맞은 플레이어를 4칸 뒤로 이동시키는 <br> 범위 3칸의 토네이도 발사"
		info[2] =
			"[태풍] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br>사정거리: 20, 사용시 대상에게 순간이동해 " +
			this.getSkillBaseDamage(2) +
			"의 물리 피해를 입힘<br>자신보다 앞에 있는 상대에게는 70%의 피해를 입힘"
		return info
	}

	getSkillInfoEng() {
		let info: string[] = []
		info[0] =
			"[Scythe Strike] cooltime:" +
			this.cooltime_list[0] +
			" turns<br>range:5,Damage a player by scythe, deals " +
			this.getSkillBaseDamage(0) +
			"attack damage,<br>Can use 2 times, second attack deals 50% less damage"
		info[1] =
			"[Reaping Wind] cooltime:" +
			this.cooltime_list[1] +
			" turns<br>range:30 ,Places a projectile of size 3 <br> that sends a player who steps on it to 4 squares back"
		info[2] =
			"[Grave Delivery] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>range: 20, Move to a player and deals  " +
			this.getSkillBaseDamage(2) +
			" attack damage<br>30% less damage to the target to the front"
		return info
	}
	getSkillTrajectorySpeed(skilltype: string): number {
		return 0
	}

	private buildProjectile() {
		let _this: Player = this
		return new ProjectileBuilder({
			owner: _this,
			size: 3,
			skill: ENUM.SKILL.W,
			type: "reaper_w"
		})
			.setGame(this.game)
			.setSkillRange(30)
			.setAction(function (target: Player) {
				target.forceMove(target.pos - 4, false, "simple")
			})
			.addFlag(Projectile.FLAG_IGNORE_OBSTACLE)
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(
			skill
		) //-1 when can`t use skill, 0 when it`s not attack skill

		console.log("getSkillAttr" + skill)
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(5)

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
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(target: number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.W) {
			let proj = this.buildProjectile()
			this.projectile.push(proj)
			this.startCooltime(ENUM.SKILL.W)
			return proj
		}
	}
	private getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return Math.floor(20 + this.ability.AD)
		}
		if (skill === ENUM.SKILL.ULT) {
			return Math.floor(70 + 0.8 * this.ability.AD)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		console.log(target + "getSkillDamage" + this.pendingSkill)
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				if (this.usedQ) {
					this.startCooltime(ENUM.SKILL.Q)
					this.usedQ = false
					this.effects.setShield("swordsman_q", new ShieldEffect(1, 40), false)

					skillattr = {
						damage: new Damage(this.getSkillBaseDamage(s) * 0.5, 0, 0),
						skill: ENUM.SKILL.Q
					}
				} else {
					this.usedQ = true
					this.effects.setShield("swordsman_q", new ShieldEffect(1, 30), false)
					skillattr = {
						damage: new Damage(this.getSkillBaseDamage(s), 0, 0),
						skill: ENUM.SKILL.Q
					}
				}
				break
			case ENUM.SKILL.ULT:
				this.startCooltime(ENUM.SKILL.ULT)
				this.effects.setShield("swordsman_r", new ShieldEffect(3, 70), false)
				let originalpos = this.pos
				this.forceMove(this.game.playerSelector.get(target).pos, true, "levitate")
				skillattr = {
					damage: new Damage(this.getSkillBaseDamage(s) * (originalpos < this.pos ? 0.7 : 1), 0, 0),
					skill: ENUM.SKILL.ULT
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
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill)
				}
			case ENUM.SKILL.ULT:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
		}
	}
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
