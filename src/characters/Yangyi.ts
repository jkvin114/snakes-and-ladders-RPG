import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillTargetSelector, SkillAttack, PercentDamage } from "../Util"
import { Game } from "../Game"
import { Projectile } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { NormalEffect } from "../StatusEffect"
import { SpecialEffect } from "../SpecialEffect"
import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"
import { EntityFilter } from "../EntityFilter"
const ID = 3
class Yangyi extends Player {
	skillInfoKor: SkillInfoFactory
	skillInfo: SkillInfoFactory
	// onoff: boolean[]	
	skill_ranges: number[]

	readonly hpGrowth: number
	readonly cooltime_list: number[]
	itemtree: {
		level: number
		items: number[]
		final: number
	}
	readonly duration_list: number[]
	static readonly SKILL_EFFECT_NAME= ["dinosaur_q", "hit", "dinosaur_r"]
	static readonly SKILL_SCALES=SKILL_SCALES[ID]

	constructor(turn: number, team: boolean , game: Game, ai: boolean, name: string) {
		const basic_stats: number[] = [180, 40, 6, 6, 0, 0]
		super(turn, team, game, ai, ID, name, basic_stats)
		// this.onoff = [false, false, false]
		this.hpGrowth = 105
		this.cooltime_list = [1, 7, 8] //1 7
		this.duration_list = [0, 3, 0]
		this.skill_ranges=[0,0,20]
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


	getSkillScale(){
		return Yangyi.SKILL_SCALES
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Yangyi.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Yangyi.SKILL_SCALES.R)
		}
	}
	getSkillAmount(key: string): number {
		if(key==="wheal") return this.calculateScale(Yangyi.SKILL_SCALES.wheal)
		return 0
	}
	getSkillTrajectorySpeed(skilltype: string): number {
		if (skilltype === "dinosaur_r") {
			return 500
		}
		return 0
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s)//-1 when can`t use skill, 0 when it`s not attack skill

		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.W:
				
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])
				break
		}
		return skillTargetSelector
	}
	useNonTargetSkill(skill: number): boolean {
		if (skill===ENUM.SKILL.Q) {
			return this.useQ()
		}
		return false
	}
	useActivationSkill(skill:ENUM.SKILL){
		if (skill===ENUM.SKILL.W) {
			this.useW()
		}
	}
	useQ() {
		let skilldmg = new SkillAttack(new Damage(this.getSkillBaseDamage(ENUM.SKILL.Q), 0, 0),this.getSkillName(ENUM.SKILL.Q)).ofSkill(ENUM.SKILL.Q)


		let targets=this.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(4))

		if (targets.length > 0) {
			this.doObstacleDamage(Math.floor(this.HP * 0.05), "noeffect")

			//플레이어 2명아면 데미지 20%, 3명아면 40% 감소
			let damagecoeff = 1 - 0.2 * (targets.length - 1)

			skilldmg.damage.updateAttackDamage(CALC_TYPE.multiply, damagecoeff)
			
			this.mediator.skillAttack(this,EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(4))(skilldmg)

			// for (let p of targets) {
			// 	this.mediator.skillAttackSingle(this,p.turn)(skilldmg)
			// }

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

	getSkillDamage(target: number): SkillAttack {
		//무조건 궁
		let skillattr = null //-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill = -1

		this.startCooltime(ENUM.SKILL.ULT)
		//Math.floor(0.5 * (this.game.playerSelector.get(target).MaxHP - this.game.playerSelector.get(target).HP))

		let k = function (this:Player) {
			this.resetCooltime([ENUM.SKILL.ULT])
		}

		skillattr = new SkillAttack(
			new Damage(this.getSkillBaseDamage(ENUM.SKILL.ULT), 0, 0).mergeWith(
				new PercentDamage(50, PercentDamage.MISSING_HP, Damage.ATTACK).pack(this.game.pOfTurn(target))
			),
			this.getSkillName(ENUM.SKILL.ULT)
		).ofSkill(ENUM.SKILL.ULT).setOnKill(k)

		return skillattr
	}

	getSkillName(skill: number): string {
		return Yangyi.SKILL_EFFECT_NAME[skill]
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
		if (this.level > 1 && this.mediator.isFellBehind(this)) {
			this.adice += 1
		}
	}

	onSkillDurationCount() {
		if (this.duration[ENUM.SKILL.W] > 0) {
			this.heal(this.getSkillAmount("wheal"))
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
			skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
		) {
			return null
		}
		switch (skill) {
			case ENUM.SKILL.Q:
				//4칸이내에 플레이어가 있으면 사용
				this.useQ()
					
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
				
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
		let ps = this.mediator.allPlayer()

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
