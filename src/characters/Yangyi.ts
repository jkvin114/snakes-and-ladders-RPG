import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillTargetSelector, SkillDamage, PercentDamage } from "../Util"
import { Game } from "../Game"
import { Projectile } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { NormalEffect } from "../StatusEffect"
import { SpecialEffect } from "../SpecialEffect"
const ID = 3
class Yangyi extends Player {
	// onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	itemtree: {
		level: number
		items: number[]
		final: number
	}
	readonly duration_list: number[]

	private readonly skill_name: string[]

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		const basic_stats: number[] = [170, 40, 6, 6, 0, 0]
		super(turn, team, game, ai, ID, name, basic_stats)
		// this.onoff = [false, false, false]
		this.hpGrowth = 90
		this.cooltime_list = [1, 7, 8] //1 7
		this.duration_list = [0, 3, 0]
		this.skill_name = ["dinosaur_q", "hit", "dinosaur_r"]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.SWORD_OF_BLOOD,
				ITEM.ANCIENT_SPEAR,
				ITEM.EPIC_WHIP,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.EPIC_FRUIT
			],
			final: ITEM.ANCIENT_SPEAR
		}
	}

	getSkillInfoKor() {
		let info = []
		info[0] =
			"[양이의 주먹] 쿨타임:" +
			this.cooltime_list[0] +
			"턴<br>4칸내의 모든 플레이어 에게 " +
			this.getSkillBaseDamage(0) +
			"의 물리 피해(현재체력의 5% 소모,대상이 2명 이상이면 피해량 감소)"
		info[1] =
			"[양이의 고민] 쿨타임:" +
			this.cooltime_list[1] +
			"턴<br>[기본지속효과]: 뒤쳐져 있으면 주사위숫자 +1 <br>[사용시]: 3턴에 걸쳐 체력" +
			3 * this.wHealAmount() +
			" 회복, 회복 중엔 둔화에 걸림"
		info[2] =
			"[양이의 뿔] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br>사정거리:20 ,대상 플레이어에게 " +
			this.getSkillBaseDamage(2) +
			"+잃은 체력의 50%의 물리 피해를 입힘,대상 처치시 쿨타임 초기화"
		return info
	}
	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Claw Strike] cooltime:" +
			this.cooltime_list[0] +
			" turns<br>damage all players within 4 sqares with claw,deals " +
			this.getSkillBaseDamage(0) +
			" attack damage(cost: -5% of current health,damage reduced when attacking more than 1 player)"
		info[1] =
			"[Regeneration] cooltime:" +
			this.cooltime_list[1] +
			" turns<br> [Passive effect]: movement speed +1 when fall behind <br>[On use]: Heals total" +
			3 * this.wHealAmount() +
			" for 3 turns, get slowed while healing"
		info[2] =
			"[Burning at the stake] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>Range:20 ,Damage a player with fire, deals " +
			this.getSkillBaseDamage(2) +
			"+ 50% of target`s missing health as attack damage, Cooltime resets if the target dies."
		return info
	}
	private wHealAmount() {
		return Math.floor(30 + this.ability.AD * 0.4 + 0.15 * (this.MaxHP - this.HP))
	}

	private getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return Math.floor(5 + 0.6 * this.ability.AD)
		}
		if (skill === ENUM.SKILL.ULT) {
			return Math.floor(40 + 0.7 * this.ability.AD)
		}
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		if (skilltype === "dinosaur_r") {
			return 500
		}
		return 0
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill

		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				if (!this.AI) {
					if (!this.useQ()) {
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
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(20)
				break
		}
		return skillTargetSelector
	}
	useQ() {
		let skilldmg = new SkillDamage(new Damage(this.getSkillBaseDamage(ENUM.SKILL.Q), 0, 0), ENUM.SKILL.Q)

		let targets = this.game.playerSelector.getAvailableTarget(
			this,
			new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.NON_TARGET).setSkill(ENUM.SKILL.Q).setRange(4)
		)

		if (targets.length > 0) {
			this.doObstacleDamage(Math.floor(this.HP * 0.05), "noeffect")

			//플레이어 2명아면 데미지 20%, 3명아면 40% 감소
			let damagecoeff = 1 - 0.2 * (targets.length - 1)

			skilldmg.damage.updateAttackDamage(CALC_TYPE.multiply, damagecoeff)

			for (let p of targets) {
				this.hitOneTarget(p, skilldmg)
			}
		} else {
			return false
		}
		this.startCooltime(ENUM.SKILL.Q)
		return true
	}
	useW() {
		if (this.duration[ENUM.SKILL.W] === 0) {
			this.startDuration(ENUM.SKILL.W)
			this.startCooltime(ENUM.SKILL.W)
			this.effects.apply(ENUM.EFFECT.SLOW, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
			this.effects.applySpecial(
				new NormalEffect(ENUM.EFFECT.DINOSAUR_W, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL).setGood(),
				SpecialEffect.SKILL.DINOSAUR_W_HEAL.name
			)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		//무조건 궁
		let skillattr = null //-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill = -1

		this.startCooltime(ENUM.SKILL.ULT)
		//Math.floor(0.5 * (this.game.playerSelector.get(target).MaxHP - this.game.playerSelector.get(target).HP))

		let _this: Player = this.getPlayer()

		let k = function () {
			_this.resetCooltime([ENUM.SKILL.ULT])
		}

		skillattr = new SkillDamage(
			new Damage(this.getSkillBaseDamage(ENUM.SKILL.ULT), 0, 0).mergeWith(
				new PercentDamage(50, PercentDamage.MISSING_HP, Damage.ATTACK).pack(this.game.playerSelector.get(target))
			),
			ENUM.SKILL.ULT
		).setOnKill(k)

		return skillattr
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

	onSkillDurationEnd(skill: number) {
		// if(skill===ENUM.SKILL.W){
		//     this.w_end()
		// }
	}
	getSkillProjectile(pos:number): Projectile {
		return null
	}
	/**
	 * 자신의 매 턴 시작시마다 호출
	 */
	passive() {
		//w passive
		if (this.level > 1 && this.game.playerSelector.isLast(this)) {
			this.adice += 1
		}
	}

	onSkillDurationCount() {
		if (this.duration[ENUM.SKILL.W] > 0) {
			this.heal(this.wHealAmount())
		}
	}

	// w_end() {
	// 	this.effects.apply(ENUM.EFFECT.SPEED, this.w_speed,ENUM.EFFECT_TIMING.BEFORE_SKILL)
	// 	this.w_speed = 0
	// 	this.effects.reset(ENUM.EFFECT.STUN)

	// }
	/**
	 *
	 * @param {*} skilldata {targets:int[]}
	 * @param {*} skill 1~3
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
				//4칸이내에 플레이어가 있으면 사용
				if (this.game.playerSelector.getPlayersIn(this, this.pos - 4, this.pos + 4).length > 0) {
					this.useQ()
					return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
				}
				return null
			case ENUM.SKILL.W:
				//체력이 50% 이하면 사용
				if (this.HP < this.MaxHP * 0.5 && this.duration[ENUM.SKILL.W] === 0) {
					this.useW()
				}
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
			case ENUM.SKILL.ULT:
				let target = this.getUltTarget(skilldata.targets)
				if (target == null) {
					return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
				}
				return { type: ENUM.AI_SKILL_RESULT_TYPE.TARGET, data: target }
		}
	}
	/**
	 * 체력 30%이하인 플레이어중
	 *  가장 앞에있는 플레이어반환
	 * @param {} validtargets int[]
	 * return int
	 */
	getUltTarget(validtargets: number[]) {
		let ps = this.game.playerSelector.getAll()

		validtargets.sort((b: number, a: number): number => {
			return ps[a].pos - ps[b].pos
		})

		for (let p of validtargets) {
			if (ps[p].HP / ps[p].MaxHP < 0.3 && !ps[p].effects.has(ENUM.EFFECT.SHIELD)) {
				return p
			}
		}
		return null
	}
}
export { Yangyi }
