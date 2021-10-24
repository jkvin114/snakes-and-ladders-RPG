import { Player, Projectile, ProjectileBuilder } from "../player"
import * as ENUM from "../enum"
import { Damage, SkillDamage, SkillTargetSelector } from "../Util"
import { Game } from "../Game"

class Jean extends Player {
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
	private playersign: number[]
	private u_target: number
	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, char: number, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		let basic_stats: number[] = [200, 40, 7, 7, 0, 0]
		super(turn, team, game, ai, char, name, "Sniper", basic_stats)
		this.onoff = [false, false, false]
		this.hpGrowth = 70
		this.projectile = []
		this.cooltime_list = [3, 4, 9]
		this.skill_name = ["gun", "sniper_w", "sniper_r"]
		this.playersign = [0, 0, 0, 0]
		this.u_target = -1
		this.itemtree = {
			level: 0,
			items: [1, 18, 24, 30, 10],
			final: 1
		}
	}
	getSkillInfoKor() {
		let info = []
		info[0] =
			"[원거리 소총] 쿨타임:" +
			this.cooltime_list[0] +
			"턴<br>사정거리:20, 사용시 대상에게 " +
			this.getSkillBaseDamage(0) +
			"의 물리 피해를 입힘. 속박된 대상 적중시 Q 쿨타임 2턴을 돌려받음."
		info[1] =
			"[둔화의 덫] 쿨타임:" +
			this.cooltime_list[1] +
			"턴<br>사정거리:40, 시용시 3칸범위의 덫을 발사, 덫에 맞은 적은 속박"
		info[2] =
			"[저격수의 극장] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br> 사용시 대상 고정 후 3턴동안 최대 3번 발사해 각각" +
			this.getSkillBaseDamage(2) +
			"의 물리 피해를 입힘(3번째에는 고정 피해를 입힘, 사용중에는 움직일 수 없음)다시한번 사용시 중지하고 주사위2배 효과를 받음"
		return info
	}

	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Gunfire] cooltime:" +
			this.cooltime_list[0] +
			" turns<br>range:20, deals  " +
			this.getSkillBaseDamage(0) +
			" attack damage.if the target is rooted, gets back 2 turns of cooltime "
		info[1] =
			"[Net Trap] cooltime:" +
			this.cooltime_list[1] +
			" turns<br>range:20, Places a projectile with size 3, player steps on it get rooted"
		info[2] =
			"[Target Locked] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>range:40 Lock up a target and deals " +
			this.getSkillBaseDamage(2) +
			" for 3 turns. 3rd attack deals fixed damage.(Cannot throw dice in use. Can stop by pressing skill button again.)Gains doubledice effect after use"
		return info
	}
	getSkillTrajectorySpeed(skilltype: string): number {
		if (skilltype === "sniper_r") return 170
	}

	private buildProjectile() {
		let _this: Player = this.getPlayer()
		let playersign = this.playersign
		return new ProjectileBuilder({
			owner: _this,
			size: 3,
			skill: ENUM.SKILL.W,
			type: "sniper_w"
		})
			.setGame(this.game)
			.setSkillRange(30)
			.setAction(function (target: Player) {
				target.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
			})
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill
		console.log("getSkillAttr" + s)
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(20)

				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(20).setProjectileSize(3)

				break
			case ENUM.SKILL.ULT:
				if (this.duration[ENUM.SKILL.ULT] === 0) {
					skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(40)
				}
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
			return Math.floor(10 + this.AD*0.8)
		}
		if (skill === ENUM.SKILL.ULT) {
			return Math.floor(60 + 0.7 * this.AD)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		console.log(target + "getSkillDamage" + this.pendingSkill)
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				let _this = this
				let onhit = function (target: Player) {
					if (target.haveEffect(ENUM.EFFECT.STUN)) {
						_this.setCooltime(ENUM.SKILL.Q,1)
					}
				}

				skillattr = {
					damage: new Damage(this.getSkillBaseDamage(s), 0, 0),
					skill: ENUM.SKILL.Q,
					onHit: onhit
				}
				break
			case ENUM.SKILL.ULT:
				this.setShield(80, false)
				if (this.duration[ENUM.SKILL.ULT] === 0) {
					let onhit = function (target: Player) {
						target.applyEffectAfterSkill(ENUM.EFFECT.SLOW, 1)
					}

					skillattr = {
						damage: new Damage(this.getSkillBaseDamage(s), 0, 0),
						skill: ENUM.SKILL.ULT,
						onHit: onhit
					}
					this.duration[ENUM.SKILL.ULT] = 2

					this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
					this.u_target = target
					this.startCooltime(ENUM.SKILL.ULT)
				}
				break
		}

		return skillattr
	}

	passive() {}
	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	onSkillDurationCount() {
		if (this.duration[ENUM.SKILL.ULT] === 2) {
			this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
			let onhit = function (target: Player) {
				target.applyEffectAfterSkill(ENUM.EFFECT.SLOW, 1)
			}
			let skillattr = {
				damage: new Damage(this.getSkillBaseDamage(ENUM.SKILL.ULT), 0, 0),
				skill: ENUM.SKILL.ULT,
				onHit: onhit
			}
			this.hitOneTarget(this.u_target, skillattr)
		}
		//궁 세번째 공격
		if (this.duration[ENUM.SKILL.ULT] === 1) {
			let onhit = function (target: Player) {
				target.applyEffectAfterSkill(ENUM.EFFECT.SLOW, 1)
			}
			let skillattr = {
				damage: new Damage(0, 0, this.getSkillBaseDamage(ENUM.SKILL.ULT)),
				skill: ENUM.SKILL.ULT,
				onHit: onhit
			}
			this.hitOneTarget(this.u_target, skillattr)

			this.u_target = -1
		}
	}
	onSkillDurationEnd(skill: number) {
		if (skill === ENUM.SKILL.ULT) {
			this.u_target = -1
			this.applyEffectAfterSkill(ENUM.EFFECT.DOUBLEDICE, 1)
			this.resetEffect(ENUM.EFFECT.STUN)
		}
	}
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
				if (this.duration[ENUM.SKILL.ULT] > 0) return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }

				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
		}
	}
}

export { Jean }
