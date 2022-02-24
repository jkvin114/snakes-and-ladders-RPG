import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillTargetSelector, SkillDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import { Projectile, ProjectileBuilder } from "../Projectile"
import SETTINGS = require("../../res/globalsettings.json")
const ID = 7
class Bird extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private readonly skill_name: string[]

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] = [200, 30, 7, 7, 0, 30]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.hpGrowth = 100
		this.cooltime_list = [3, 5, 10]
		this.skill_name = ["hit", "hit", "bird_r"]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_WHIP,
				ITEM.ANCIENT_SPEAR,
				ENUM.ITEM.EPIC_CRYSTAL_BALL,
				ITEM.SWORD_OF_BLOOD,
				ITEM.CARD_OF_DECEPTION,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.ANCIENT_SPEAR
		}
	}

	getSkillInfoKor() {
		let info: string[] = []
		info[0] =
			"[날렵한 침] 쿨타임:" +
			this.cooltime_list[0] +
			"턴<br>사정거리:20,적을 공격해 <b>" +
			Math.floor(10 + this.ability.AP) +
			"</b>의 마법 피해를 입히고 20골드를 빼앗음"
		info[1] =
			"[아기새 소환] 쿨타임:" +
			this.cooltime_list[1] +
			"턴, 지속시간: 2턴<br>사용시 즉시 신속 효과를 받고 지속중에 기본 공격시  <b>" +
			Math.floor(10 + this.ability.AP * 0.3) +
			"</b>, " +
			" '날렵한 침' 사용시 " +
			Math.floor(10 + this.ability.AP * 0.5) +
			"의 추가 마법 피해를 입히고 속박시킴"
		info[2] =
			"[불사조 소환] 쿨타임:" +
			this.cooltime_list[2] +
			"턴, 지속시간: 4턴<br> 지속 중에 기본공격 사거리가 2 증가하고 <b>" +
			Math.floor(this.ability.AD * 0.3) +
			"</b>의 추가 물리 피해를 입힘." +
			"또한 '아기새 소환'의 추가 피해가 2배 증가하고 '날렵한 침' 적중시 " +
			"밟은 적에게 점화 2턴을 주는 영역을 생성함"
		return info
	}

	getSkillInfoEng() {
		let info: string[] = []
		info[0] =
			"[Beak attack] cooltime:" +
			this.cooltime_list[0] +
			" turn<br>range:20,Attack a target, deals " +
			this.getSkillBaseDamage(ENUM.SKILL.Q) +
			" magic damage and take away 20$"
		info[1] =
			"[Baby Birds] cooltime:" +
			this.cooltime_list[1] +
			" turn, duration: 2 turn<br>Receive speed effect on use. Basic attack deals additional " +
			Math.floor(10 + this.ability.AP * 0.3) +
			" magic damage, " +
			" 'Beak attack' deals additional " +
			Math.floor(10 + this.ability.AP * 0.5) +
			" magic damage and stuns target"
		info[2] =
			"[Summon phenix] cooltime:" +
			this.cooltime_list[2] +
			" turn, duration: 4 turn<br> Basic attack range increase by 2, deals additional " +
			Math.floor(this.ability.AD * 0.3) +
			" attack damage." +
			"Also, 'Baby Bird'`s additional damage doubles, and 'beak attack' creates an area" +
			" that applies ignite effect to players who step on it"
		return info
	}
	getSkillTrajectorySpeed(skilltype: string): number {
		if (skilltype === "hit" && !this.isSkillActivated(ENUM.SKILL.W) && !this.isSkillActivated(ENUM.SKILL.ULT)) {
			return 0
		}
		return 0
	}
	private buildProjectile() {
		let _this: Player = this.getPlayer()
		return new ProjectileBuilder({
			owner: _this,
			size: 3,
			skill: ENUM.SKILL.ULT,
			type: "bird_r_trace"
		})
			.setGame(this.game)
			.setAction(function (target: Player) {
				target.effects.giveIgniteEffect(2, _this.turn)
			})
			.setNotDisappearWhenStep()
			.setDuration(2)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(20)
				break
			case ENUM.SKILL.W:
				if (!this.AI) {
					this.useW()
				}
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.ULT:
				if (!this.AI) {
					this.useUlt()
				}
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
		}
		return skillTargetSelector
	}

	private useW() {
		this.startCooltime(ENUM.SKILL.W)
		this.effects.apply(ENUM.EFFECT.SPEED, 1, ENUM.EFFECT_TIMING.TURN_END)
		this.duration[ENUM.SKILL.W] = 2
	}
	private useUlt() {
		this.startCooltime(ENUM.SKILL.ULT)
		this.effects.setShield("bird_r", new ShieldEffect(4, 70), false)
		this.duration[ENUM.SKILL.ULT] = 4
		this.ability.update("attackRange", 2)
		this.changeApperance("bird_r")
		this.showEffect("bird_r", this.turn)
	}

	getSkillName(skill: number): string {
		if (this.duration[ENUM.SKILL.W] > 0 && skill === ENUM.SKILL.Q) {
			if (this.duration[ENUM.SKILL.ULT] > 0) {
				return "bird_r_w_hit"
			} else {
				return "bird_w_hit"
			}
		} else if (this.duration[ENUM.SKILL.ULT] > 0) {
			return "bird_r_hit"
		}
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		if (this.duration[ENUM.SKILL.W] > 0) {
			if (this.duration[ENUM.SKILL.ULT] > 0) {
				return "bird_r_w_hit"
			} else {
				return "bird_w_hit"
			}
		} else if (this.duration[ENUM.SKILL.ULT] > 0) {
			return "bird_r_hit"
		}
		return super.getBasicAttackName()
	}

	getBaseBasicAttackDamage(): Damage {
		let damage = super.getBaseBasicAttackDamage()
		if (this.isSkillActivated(ENUM.SKILL.W)) {
			damage.updateMagicDamage(CALC_TYPE.plus, 10 + this.ability.AP * 0.3)
		}
		if (this.isSkillActivated(ENUM.SKILL.ULT)) {
			damage.updateMagicDamage(CALC_TYPE.multiply, 2)
			damage.updateAttackDamage(CALC_TYPE.multiply, 1.3)
		}
		return damage
	}

	getSkillProjectile(t: number): Projectile {
		return null
	}

	private getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return Math.floor(20 + 0.8 * this.ability.AP)
		}
	}

	getSkillDamage(target: number): SkillDamage {
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)
				let _this = this

				let onhit = function (target: Player) {
					target.inven.takeMoney(20)
					_this.inven.giveMoney(20)
				}

				let damage = new Damage(0, this.getSkillBaseDamage(s), 0)

				if (this.isSkillActivated(ENUM.SKILL.W)) {
					this.game.playerSelector.get(target).effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.TURN_END)
					damage.updateMagicDamage(CALC_TYPE.plus, 10 + this.ability.AP * 0.5)
				}

				if (this.isSkillActivated(ENUM.SKILL.ULT)) {
					let proj = this.buildProjectile()
					this.projectile.push(proj)
					this.game.placeProjNoSelection(proj, this.game.playerSelector.get(target).pos - 1)
					damage.updateMagicDamage(CALC_TYPE.plus, this.ability.AP * 0.5)
				}
				skillattr = {
					damage: damage,
					skill: ENUM.SKILL.Q,
					onHit: onhit
				}
				break
		}

		return skillattr
	}
	onSkillDurationEnd(skill: number) {
		console.log("birdattackrange:" + this.ability.attackRange)
		if (skill === ENUM.SKILL.ULT) {
			this.ability.update("attackRange", -2)
			this.changeApperance("")
		}
		if (skill === ENUM.SKILL.W) {
		}
	}
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
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
			case ENUM.SKILL.W:
				if (this.cooltime[ENUM.SKILL.Q] < 1) {
					this.useW()
				}
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
			case ENUM.SKILL.ULT:
				this.useUlt()
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
		}
		return null
	}
}
export { Bird }
