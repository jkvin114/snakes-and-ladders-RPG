import * as ENUM from "../data/enum"
import type { Player } from "../player/player"
import { Damage,PercentDamage } from "../core/Damage"

import { CALC_TYPE, randInt } from "../core/Util"
import { Projectile, ProjectileBuilder } from "../Projectile"
import { AblityChangeEffect, OnDamageEffect, ShieldEffect } from "../StatusEffect"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import { EntityFilter } from "../entity/EntityFilter"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { EFFECT } from "../StatusEffect/enum"
import TreePlant from "./SummonedEntity/TreePlantEntity"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"
import { ServerGameEventFormat } from "../data/EventFormat"

const ID = 8
class Tree extends CharacterSkillManager {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly duration_list: number[]
	readonly skill_ranges: number[]

	private isWithered: boolean
	private plantEntities: Set<string>

	static readonly PROJ_W = "tree_w"
	static readonly SKILLNAME_STRONG_R = "tree_wither_r"
	static readonly APPERANCE_WITHERED = "tree_low_hp"
	static readonly Q_AREA_SIZE = 3
	static readonly PLANT_LIFE_SPAN = 2
	static readonly RANGES = [25, 30, 25]
	static readonly BASIC_STATS = [160, 20, 6, 6, 0, 30] //hp, ad, ar, mr, attackrange,ap
	static readonly SKILL_EFFECT_NAME = ["tree_q", "tree_w", "tree_r"]
	static readonly COOLTIME = [2, 5, 9]

	static readonly SKILL_SCALES = SKILL_SCALES[ID]
	protected player: Player
	constructor(player:Player) {
		super(player,ID)
		this.isWithered = false
		this.plantEntities = new Set<string>()
		this.cooltime_list = Tree.COOLTIME
		this.duration_list = [0, 0, 0]
		this.skill_ranges = Tree.RANGES
	}

	// getSkillInfoKor() {
	// 	return [this.skillInfoKor.getQ(),this.skillInfoKor.getW(),this.skillInfoKor.getUlt()]
	// }
	// getSkillInfoEng() {
	// 	return [this.skillInfo.getQ(),this.skillInfo.getW(),this.skillInfo.getUlt()]
	// }
	getSkillScale() {
		return Tree.SKILL_SCALES
	}

	getSkillTrajectoryDelay(skilltype: string): number {
		if (skilltype === "tree_q") {
			return 300
		}
		if (skilltype === "tree_r" || skilltype === Tree.SKILLNAME_STRONG_R) {
			return 450
		}
		return 0
	}

	private buildProjectile() {
		const _this = this.player
		return new ProjectileBuilder(this.player.game, Tree.PROJ_W, Projectile.TYPE_PASS)
			.setSource(this.player)
			.setAction(function (this: Player) {
				if (!this.isEnemyOf(_this)) {
					this.effects.apply(EFFECT.SPEED, 2)
				}
			})
			.setDuration(3)
			.setCanApplyToAlly()
			.setTrajectorySpeed(300)
			.addFlag(Projectile.FLAG_STOP_PLAYER)
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(skill) //-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill=skill
		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector
					.setType(ENUM.SKILL_INIT_TYPE.AREA_TARGETING)
					.setRange(Tree.RANGES[skill])
					.setAreaSize(Tree.Q_AREA_SIZE)
				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(Tree.RANGES[skill]).setProjectileSize(1)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(Tree.RANGES[skill])
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		if (this.isWithered && skill === ENUM.SKILL.ULT) {
			return Tree.SKILLNAME_STRONG_R
		}
		return Tree.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos: number): Projectile |null{
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.W) {
			this.summonPlantAt(pos + 1)
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.W)
			return proj
		}
		return null
	}
	getSkillAmount(key: string): number {
		if (key === "qshield") return this.calculateScale(Tree.SKILL_SCALES.qshield!)
		if (key === "qheal") return this.calculateScale(Tree.SKILL_SCALES.qheal!)
		if (key === "plantdamage") return this.calculateScale(Tree.SKILL_SCALES.plantdamage!)
		if (key === "plant_lifespan") return 3

		return 0
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Tree.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Tree.SKILL_SCALES.R!)
		}
		return 0
	}

	private createPlantEntity() {
		return TreePlant.create(this.player.game, new Damage(0, this.getSkillAmount("plantdamage"), 0))
	}
	private summonPlantAt(pos: number) {
		if (!this.isSkillLearned(ENUM.SKILL.ULT)) return
		let entity = this.player.game.summonEntity(this.createPlantEntity(), this.player, Tree.PLANT_LIFE_SPAN, pos)

		this.plantEntities.add(entity.UEID)
	}
	private moveAllPlantTo(pos: number) {
		this.mediator.withdrawDeadEntities()
		for (let plantId of this.plantEntities) {
			this.mediator.moveSummonedEntityTo(plantId, pos + randInt(3) - 1)
			// this.game.updateSummonedEntityPos(plantId, pos + randInt(3) - 1)
		}
	}
	private plantAttack() {
		this.mediator.withdrawDeadEntities()
		this.plantEntities.forEach((plantId) => {
			let plant = this.player.game.getEntityById(plantId)
			if (plant != null) plant.basicAttack()
		})
	}

	getUltEffect() {
		return new OnDamageEffect(EFFECT.TREE_ULT, this.isWithered ? 2 : 1, (damage: Damage, source: Player) => {
			damage.updateAllDamage(CALC_TYPE.multiply, 1.2)
			return damage
		})
			.on([OnDamageEffect.BASICATTACK_DAMAGE, OnDamageEffect.SKILL_DAMAGE])
			.from(this.mediator.selectAllFrom(EntityFilter.ALL_PLAYER(this.player).excludeEnemy()).map((p: Player) => p.UEID))
			.setSourceId(this.player.UEID)
	}

	getSkillDamage(target: Entity,s:number): SkillAttack|null {
		let skillattr = null
		// let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.ULT:
				this.summonPlantAt(target.pos)
				this.startCooltime(ENUM.SKILL.ULT)
				let rootDur=this.isWithered ? 2 : 1
				const effect=this.getUltEffect()
				skillattr = new SkillAttack(new Damage(0, this.getSkillBaseDamage(s), 0), this.getSkillName(s),s,this.player)
					.setOnHit(function (this: Player,source:Player) {
						this.effects.apply(EFFECT.ROOT, rootDur)
						this.effects.applySpecial(effect, SpecialEffect.SKILL.TREE_ULT.name)

					}).setTrajectoryDelay(this.getSkillTrajectoryDelay(this.getSkillName(s)))
				this.moveAllPlantTo(target.pos)
				// setTimeout(()=>this.plantAttack(),200)

				break
		}

		return skillattr
	}
	usePendingAreaSkill(pos: number): ServerGameEventFormat.AreaEffect {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.Q) {
			this.startCooltime(ENUM.SKILL.Q)
			this.summonPlantAt(pos)

			// let opponents = this.game.playerSelector.getPlayersIn(this, pos, pos + Tree.Q_AREA_SIZE - 1)
			let dmg = new SkillAttack(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0), this.getSkillName(s),s,this.player)
			.setTrajectoryDelay(this.getSkillTrajectoryDelay(this.getSkillName(s)))

			let hit=this.mediator.skillAttack(this.player, EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).in(pos, pos + Tree.Q_AREA_SIZE - 1), dmg)

			if (!this.isWithered){
				const healamt = this.getSkillAmount("qheal")
				const shieldamt = this.getSkillAmount("qshield")
	
				this.mediator.forEachPlayer(
					EntityFilter.ALL_ALIVE_PLAYER(this.player)
						.excludeEnemy()
						.in(pos, pos + Tree.Q_AREA_SIZE - 1)
				,function (source) {
					this.heal(healamt)
					this.effects.applySpecial(new ShieldEffect(EFFECT.TREE_Q_SHIELD, 2, shieldamt))
				})
			}

			return {
				turn:this.player.turn,
				from:this.player.pos,
				to:[pos,pos+1,pos+2],
				type:this.getSkillName(s),
				delay:hit?this.getSkillTrajectoryDelay(this.getSkillName(s)):0
			}
		}	
		return null
	}

	onTurnStart() {
		if (this.player.HP < this.player.MaxHP * 0.4) {
			this.isWithered = true

			this.player.effects.applySpecial(
				new AblityChangeEffect(EFFECT.TREE_WITHER, 2, new Map().set("absorb", 35)),
				SpecialEffect.SKILL.TREE_WITHER.name
			)
			this.player.changeSkillImage(Tree.SKILLNAME_STRONG_R, ENUM.SKILL.ULT)
			this.player.changeApperance(Tree.APPERANCE_WITHERED)
		} else {
			this.player.effects.reset(EFFECT.TREE_WITHER)
			this.isWithered = false
			this.player.resetApperance()
			this.player.resetSkillImage(ENUM.SKILL.ULT)
		}
		super.onTurnStart()
	}
	//override
	basicAttack(): boolean {
		//식충식물은 공격속도 미적용
		if (this.basicAttackCount === this.ability.basicAttackSpeed.get()) this.plantAttack()
		super.basicAttack()
		return true
	}
	//override
	hasBasicAttackTarget(): boolean {
		if(super.hasBasicAttackTarget()) return true
		return this.hasBasicAttackAndPlantAttackTarget()
	}
	private hasBasicAttackAndPlantAttackTarget() {
		

		let filter=EntityFilter.ALL_ENEMY_PLAYER(this.player).excludeUnattackable().in(0,0)
		this.plantEntities.forEach((plant) => {
			let entity=this.mediator.getEntity(plant)
			if(!entity) return

			filter.in(
				entity.pos - TreePlant.ATTACKRANGE,
				entity.pos + TreePlant.ATTACKRANGE
			)
		})
		return this.mediator.count(filter) > 0
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {}
	onSkillDurationEnd(skill: number) {}
}

export { Tree }
