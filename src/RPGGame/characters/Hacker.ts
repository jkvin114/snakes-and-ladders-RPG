import { Player } from "../player/player"

import { SKILL, FORCEMOVE_TYPE, SKILL_INIT_TYPE, CHARACTER } from "../data/enum"
import { ITEM } from "../data/enum"
import { Damage, PercentDamage } from "../core/Damage"

import { Projectile, ProjectileBuilder } from "../Projectile"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import { AblityChangeEffect, ShieldEffect } from "../StatusEffect"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import { CALC_TYPE } from "../core/Util"
import { EFFECT } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"

const ID = 9
class Hacker extends CharacterSkillManager {
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly skill_ranges: number[]

	readonly duration_list: number[]

	static readonly ULT_ABILITY_STEAL_PERCENT = 1
	static readonly ULT_ABILITY_STEAL_PERCENT_BASE = 10
	static readonly Q_STACK_DAMAGE = 6
	static readonly SKILL_EFFECT_NAME = ["hacker_q", "hacker_w", "hacker_r"]

	static readonly SKILL_SCALES = SKILL_SCALES[ID]
	private virtualCharacter: CharacterSkillManager | null
	private copiedCharId: number
	private stacks: number[]
	private totalstacks: number

	constructor(player: Player) {
		super(player, ID)
		this.skill_ranges = [12, 15, 25]

		this.cooltime_list = [2, 6, 6]
		this.duration_list = [0, 0, 2]
		this.virtualCharacter = null
		this.copiedCharId = -1
		this.stacks = [0, 0, 0, 0]
		this.totalstacks = 0
	}

	/**
	 * create dummy player that shares component with this player
	 * @param charId
	 */
	private createTransformPlayer(charId: number) {
		const dummy = this.player.game.createPlayer(
			this.player.team,
			charId,
			this.player.name,
			this.player.turn,
			this.player.AI
		)
		this.virtualCharacter = dummy.skillManager
		this.virtualCharacter.setPlayerBinding(this.player)

		dummy.changeSkillImage("", SKILL.ULT)
		dummy.changeSkillInfo(SKILL.ULT,SKILL.ULT)
	}
	/**
	 * set dummy player`s data to be same with player
	 * @returns
	 */
	private syncTransformPlayer() {
		if (!this.virtualCharacter) return
		// this.virtualCharacter.inven = this.inven
		// this.virtualCharacter.pos = this.pos
		// this.virtualCharacter.level = this.level
	}
	/**
	 *
	 * @param charId character to copy
	 * @returns
	 */
	copyCharacter(charId: number): boolean {
		if (charId == ID) return false
		this.createTransformPlayer(charId)
		this.copiedCharId = charId
		this.ability.sendToClient()
		return true
	}
	/**
	 * create dummy player of copied character
	 */
	private onBeforeCopiedSkillUse() {
		if (this.copiedCharId !== -1) this.syncTransformPlayer()
	}
	/**
	 * remove dummy player and reset copied character
	 */
	private onAfterCopiedSkill() {
		this.copiedCharId = -1
		this.virtualCharacter = null
		this.player.changeSkillImage("", SKILL.ULT)
		this.player.changeSkillInfo(SKILL.ULT,SKILL.ULT)
		this.ability.sendToClient()
	}
	private getStackList() {
		let str = "<hr>"
		let i=0
		for (const p of this.mediator.allPlayer()) {
			if (p.turn === this.player.turn) continue
			str += ((i > 0 ? ", " : "" )+ p.name + ":<b>" + this.stacks[p.turn]+"</b>")
			// console.log(str)
			i++
		}
		return str +  "<br>Total: <b>" + this.totalstacks+"</b>"
	}
	//override
	getSkillInfoEng(): string[] {
		// let info = super.getSkillInfoEng()
		// info[0] += "<br>Vulnerability stacks collected:<br>"
		// info[0] += this.getStackList()
		// if (this.virtualCharacter && this.copiedCharId !== -1) {
		// 	// info[2] = this.virtualCharacter.getSkillInfoEng()[2]
		// }
		return []
	}
	//override
	getSkillInfoKor(): string[] {
		let info = super.getSkillInfoKor()
		// info[0] += "<br>수집한 취약점 중첩:<br>"
		// info[0] += this.getStackList()
		// if (this.virtualCharacter && this.copiedCharId !== -1) {
		// 	// info[2] = this.virtualCharacter.getSkillInfoKor()[2]
		// }
		return []
	}
	getSkillValues(): Object {
		let val = super.getSkillValues() as any
		let otherval={} as any
		if (this.virtualCharacter && this.copiedCharId !== -1) {
			otherval=this.getSkillValueSingle(this.copiedCharId,SKILL.ULT)
		}
		val["stacks"] = this.getStackList()
		return {...val,...otherval}
	}
	getSkillAmount(key: string): number {
		if (key === "stack_damage") return Hacker.Q_STACK_DAMAGE
		if (key === "r_steal") return Hacker.ULT_ABILITY_STEAL_PERCENT
		if (key === "r_steal_base") return Hacker.ULT_ABILITY_STEAL_PERCENT_BASE
		return 0
	}
	getSkillScale() {
		return Hacker.SKILL_SCALES
	}

	getSkillTrajectoryDelay(skilltype: string): number {
		if (skilltype === "hacker_q") return 200
		// if(this.virtualCharacter) return this.virtualCharacter.getSkillTrajectoryDelay(skilltype)
		return 0
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(skill) //-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill = skill
		//	console.log("getSkillAttr" + skill)
		switch (skill) {
			case SKILL.Q:
				skillTargetSelector.setType(SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[skill])

				break
			case SKILL.W:
				skillTargetSelector.setType(SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[skill])

				break
			case SKILL.ULT:
				if (this.copiedCharId === -1)
					skillTargetSelector.setType(SKILL_INIT_TYPE.TARGETING).setConditionedRange(function (this: Entity) {
						return !(this instanceof Player && this.champ == CHARACTER.HACKER)
					}, this.skill_ranges[skill])
				else if (this.virtualCharacter) skillTargetSelector = this.virtualCharacter.getSkillTargetSelector(skill)
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		if (skill === SKILL.ULT && this.virtualCharacter && this.copiedCharId !== -1)
			return this.virtualCharacter.getSkillName(skill)

		return Hacker.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		if (this.copiedCharId !== -1 && this.virtualCharacter) {
			return this.virtualCharacter.getBasicAttackName()
		}
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos: number): Projectile | null {
		let s: number = this.pendingSkill
		this.pendingSkill = -1

		if (s == SKILL.ULT && this.copiedCharId !== -1 && this.virtualCharacter) {
			this.onBeforeCopiedSkillUse()
			this.startCooltime(s)
			let proj = this.virtualCharacter.getSkillProjectile(pos)
			this.onAfterCopiedSkill()
			if (proj) proj.sourcePlayer = this.player
			return proj
		}
		return null
	}
	getSkillBaseDamage(skill: number): number {
		switch (skill) {
		}
		if (skill === SKILL.Q) {
			return this.calculateScale(Hacker.SKILL_SCALES.Q!)
		}
		if (skill === SKILL.W) {
			return this.calculateScale(Hacker.SKILL_SCALES.W!)
		}
		return 0
	}
	addStack(turn: number) {
		this.stacks[turn] += 1
		this.totalstacks += 1
		this.ability.sendToClient()
	}
	getSkillDamage(target: Entity, s: number): SkillAttack | null {
		//	console.log(target + "getSkillDamage" + this.pendingSkill)
		let damage = null
		// let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case SKILL.Q:
				let pdmg = this.getSkillBaseDamage(s)
				let moneytake = 0
				if (target instanceof Player) {
					pdmg += this.totalstacks * Hacker.Q_STACK_DAMAGE
					moneytake = 3 * this.stacks[target.turn]
				}
				const addStack = (turn: number) => this.addStack(turn)
				damage = new SkillAttack(new Damage(pdmg, 0, 0), this.getSkillName(s), s, this.player)
					.setOnHit(function (this: Player, source: Player) {
						this.inven.takeMoney(moneytake)
						source.inven.giveMoney(moneytake)

						addStack(this.turn)
					})
					.setTrajectoryDelay(this.getSkillTrajectoryDelay(this.getSkillName(s)))
				this.startCooltime(s)
				break
			case SKILL.W:
				damage = new SkillAttack(Damage.zero(), this.getSkillName(s), s, this.player)
				if (target instanceof Player) {
					let distance = 2 + Math.floor(0.33334 * this.stacks[target.turn])
					damage.setOnHit(function (this: Player, source: Player) {
						this.effects.apply(EFFECT.CURSE, 1)
						this.game.playerForceMove(this, this.pos - distance, true, FORCEMOVE_TYPE.WALK)
					})
				}
				this.startCooltime(s)
				break
			case SKILL.ULT:
				if (this.copiedCharId !== -1 && this.virtualCharacter) {
					this.onBeforeCopiedSkillUse()
					damage = this.virtualCharacter.getSkillDamage(target, this.virtualCharacter.pendingSkill)
					if (damage) damage.source = this.player
					this.startCooltime(s)
					this.onAfterCopiedSkill()
				} else if (target instanceof Player) {
					let stealRatio =
						(Hacker.ULT_ABILITY_STEAL_PERCENT_BASE + Hacker.ULT_ABILITY_STEAL_PERCENT * this.totalstacks) / 100
					let dur = this.duration_list[2]
					const copyFunc = () => this.copyCharacter(target.champ)
					damage = new SkillAttack(Damage.zero(), this.getSkillName(s), s, this.player).setOnHit(function (
						this: Player,
						source: Player
					) {
						let AP = Math.floor(this.ability.AP.get() * stealRatio)
						let AD = Math.floor(this.ability.AD.get() * stealRatio)
						this.effects.applySpecial(
							new AblityChangeEffect(EFFECT.HACKER_ULT_ENEMY, dur, new Map().set("AP", -AP).set("AD", -AD))
								.setSourceId(source.UEID)
								.addData(Math.floor(stealRatio * 100)),
							SpecialEffect.SKILL.HACKER_ULT_ENEMY.name
						)
						source.effects.applySpecial(
							new AblityChangeEffect(EFFECT.HACKER_ULT, dur, new Map().set("AP", AP).set("AD", AD))
								.addData(AD)
								.addData(AP),
							SpecialEffect.SKILL.HACKER_ULT.name
						)
						if (copyFunc()) this.sendConsoleMessage("Hacker extracted " + target.champ_name + "`s ultimate!")
					})
				}
				break
			default:
				return null
		}

		return damage
	}

	useActivationSkill(skill: number): void {
		if (skill == SKILL.ULT && this.copiedCharId !== -1 && this.virtualCharacter) {
			this.onBeforeCopiedSkillUse()
			this.virtualCharacter.useActivationSkill(skill)
			this.setSingleSkillDuration(skill, this.virtualCharacter.duration_list[skill])
			this.startCooltime(skill)
			if (this.copiedCharId === CHARACTER.BIRD) this.player.changeSkillImage("", SKILL.Q)
		}
	}

	getBaseBasicAttackDamage(): Damage {
		let damage = super.getBaseBasicAttackDamage()
		if (this.isSkillLearned(SKILL.W)) {
			damage.updateMagicDamage(CALC_TYPE.plus, this.getSkillBaseDamage(SKILL.W))
		}
		return damage
	}
	onSkillDurationCount() {
		if (this.virtualCharacter && this.copiedCharId !== -1 && this.virtualCharacter)
			this.virtualCharacter.onSkillDurationCount()
	}
	onSkillDurationEnd(skill: number) {
		if (skill == SKILL.ULT && this.copiedCharId !== -1 && this.virtualCharacter) {
			this.virtualCharacter.onSkillDurationEnd(skill)
			if (this.copiedCharId === CHARACTER.BIRD) this.player.changeSkillImage("", SKILL.Q)
			this.onAfterCopiedSkill()
		}
	}
}

export { Hacker }
