import { SkillInfoFactory } from "../../data/SkillDescription"
import { BASICATTACK_TYPE, INIT_SKILL_RESULT, MAP_TYPE, SKILL, STAT } from "../../data/enum"
import type { Player } from "../../player/player"
import ABILITY = require("../../../../res/character_ability.json")
import type { Projectile } from "../../Projectile"
import{ SkillTargetSelector, SkillAttack, ValueScale } from "../../core/skill"
import type { Entity } from "../../entity/Entity"
import { PlayerComponent } from "../../player/PlayerComponent"
import { Damage } from "../../core/Damage"
import { decrement, removeDuplicate } from "../../core/Util"
import { ServerGameEventFormat } from "../../data/EventFormat"
import { EntityFilter } from "../../entity/EntityFilter"
import type { PlayerAbility } from "../../player/PlayerAbility"
import { EntityMediator } from "../../entity/EntityMediator"
import SKILLDATA = require("../../../../res/skill.json")


export abstract class CharacterSkillManager implements PlayerComponent{
    protected player:Player
	protected charId:number
	pendingSkill: number
	cooltime: number[]
	duration: number[]
	basicAttackCount: number //basic attack count avaliable in this turn
	readonly basicAttackType: BASICATTACK_TYPE
    protected ability:PlayerAbility
    protected mediator:EntityMediator
	abstract readonly cooltime_list: number[]
	abstract readonly duration_list: number[]
	abstract readonly skill_ranges: number[]
	// private skillInfoKor: SkillInfoFactory
	// private skillInfo: SkillInfoFactory
    abstract getSkillTrajectoryDelay(s: string): number
	/**
	 * for targeting, projectile, area targeting skill,
	 * return SkillTargetSelector to ask client about where to use the skill
	 * @param skill
	 */
	abstract getSkillTargetSelector(skill: number): SkillTargetSelector|null
	/**
	 * return projectile object of the pending skill of player
	 * @param projpos
	 */
	abstract getSkillProjectile(projpos: number): Projectile | null
	/**
	 * return SkillAttack of the pending skill of player
	 * @param target
	 */
	abstract getSkillDamage(target: Entity, skill: number): SkillAttack | null
	abstract getSkillScale(): any
	abstract getSkillName(skill: number): string
	/**
	 * called every time skill duration decrements
	 */
	abstract onSkillDurationCount(): void
	/**
	 * called if skill duration become 0 or on death
	 * @param skill
	 */
	abstract onSkillDurationEnd(skill: number): void
	abstract getSkillBaseDamage(skill: number): number
    constructor(player:Player,charId:number){
        this.player=player
		this.charId=charId
        this.ability=player.ability
        this.mediator=player.mediator

		this.cooltime = [0, 0, 0]
		this.duration = [0, 0, 0]
		this.basicAttackCount = 0
        // this.skillInfo = new SkillInfoFactory(charId, this, SkillInfoFactory.LANG_ENG)
		// this.skillInfoKor = new SkillInfoFactory(charId, this, SkillInfoFactory.LANG_KOR)
        this.basicAttackType = ABILITY[charId].basicAttackType === "ranged" ? BASICATTACK_TYPE.RANGED : BASICATTACK_TYPE.MELEE
        this.pendingSkill = -1
    }

    setPlayerBinding(player:Player){
        this.player=player
        this.ability=player.ability
    }
    onTurnStart()
    {
        this.onSkillDurationCount()
		this.decrementAllSkillDuration()
        this.rechargeBasicAttack()
		// this.passive()
		this.cooltime = this.cooltime.map(decrement)
    }
    onTurnEnd: () => void
    onDeath(){
        
		this.setAllSkillDuration([0, 0, 0])
    }

	getSkillAmount(key: string): number {
		return 0
	}
	getSkillValues():Object{
		let obj={} as any
		for(const skill of SKILLDATA[this.charId]){
			for(const [key,scale] of Object.entries(skill.values)){
				let val=this.calculateScale(scale)
				obj[key]=val
			}
		}
		return obj
	}
	getSkillValueSingle(charId:number,skillId:number):Object{
		let obj={} as any

		for(const [key,scale] of Object.entries(SKILLDATA[charId][skillId].values)){
			let val=this.calculateScale(scale)
			obj[key]=val
		}
		return obj
	}
	
	getSkillInfoKor() {
		// return this.skillInfoKor.get()
	}
	getSkillInfoEng() {
		// return this.skillInfo.get()
	}
    /**
         *
         * @param {*} skill 0 ~
         */
    isSkillLearned(skill: number): boolean {
        if (this.player.level < 2 && skill === SKILL.W) {
            return false
        }
        if (this.player.level < 3 && skill === SKILL.ULT) {
            return false
        }
        return true
    }
    /**
         * 스킬 사용가능여부 체크
         * @param {} s (0~) 스킬
         * @returns
         */
    isCooltimeAvaliable(s: number): boolean {
        if (this.cooltime[s] > 0) {
            return false
        }
        return true
    }
    getSkillStatus(): ServerGameEventFormat.SkillStatus {
		return {
			turn: 0,
			cooltime: this.cooltime,
			cooltimeratio: this.getCooltimePercent(),
			duration: this.getDurationPercent(),
			level: 1,
			basicAttackCount: this.basicAttackCount,
			canBasicAttack: false,
			canUseSkill: false,
			basicAttackType: this.basicAttackType,
		}
	}
	protected rechargeBasicAttack() {
		this.basicAttackCount = this.ability.basicAttackSpeed.get()
	}
	hasBasicAttackTarget(): boolean {
		return (
			this.player.mediator.count(this.getBasicAttackEntityFilter()) + this.player.mediator.count(this.getBasicAttackPlayerFilter()) >
			0
		)
	}
	

	/**
	 * 	decrement all skill durations at once
	 */
	decrementAllSkillDuration() {
		for (let i = 0; i < this.duration.length; i++) this.setSingleSkillDuration(i, this.duration[i] - 1)
	}
	/**
	 * set all skill durations at once
	 * @param durations
	 */
	setAllSkillDuration(durations: number[]) {
		for (let i = 0; i < durations.length; i++) this.setSingleSkillDuration(i, durations[i])
	}

	/**
	 * change one skill`s duration
	 * checks if the skill duration ends
	 * @param skill
	 * @param val
	 */
	setSingleSkillDuration(skill: number, val: number) {
		if (val === 0 && this.isSkillActivated(skill)) {
			this.onSkillDurationEnd(skill)
		}
		if (val < 0) val = 0
		this.duration[skill] = val
	}
    resetCooltime(list: SKILL[]) {
		//this.message(this.name + "`s cooltime has been reset")
		for (let i of list) {
			this.cooltime[i] = 0
		}
	}
	/**
	 * 스킬사용후 쿨타임 시작
	 * apply all cooltime reductions
	 * @param {} skill 스킬종류,0에서시작
	 */
	startCooltime(skill: SKILL) {
		this.cooltime[skill] = this.cooltime_list[skill]

		if (this.player.mapId === MAP_TYPE.RAPID) this.cooltime[skill] = Math.ceil(this.cooltime_list[skill] * 0.66)

		if (skill === SKILL.ULT) {
			this.cooltime[skill] -= this.ability.ultHaste.get()
		}

		this.cooltime[skill] = Math.max(0, this.cooltime[skill])
	}
	startDuration(skill: SKILL) {
		this.duration[skill] = this.duration_list[skill]
	}
	/**
	 *set skill cooltime as it is(no modifier)
	 * @param skill skill
	 * @param amt has to be positive
	 */
	setCooltime(skill: SKILL, amt: number) {
		this.cooltime[skill] = amt
	}
	potionObstacle() {
		this.resetCooltime([SKILL.Q, SKILL.W])
		this.cooltime[SKILL.ULT] = Math.floor(this.cooltime[SKILL.ULT] / 2)
	}
	isSkillActivated(skill: SKILL) {
		return this.duration[skill] > 0
	}
    getDurationPercent() {
		return this.duration.map((d, i) => {
			if (this.duration_list[i] === 0) return 0
			else return d / this.duration_list[i]
		})
	}
	getCooltimePercent() {
		return this.cooltime.map((c, i) => {
			if (this.cooltime_list[i] === 0) return 0
			else return c / this.cooltime_list[i]
		})
	}
    /**
	 * use skill that will be activated for certain amount of time
	 * @param skill
	 */
	useActivationSkill(skill: number): void {}
	/**
	 * use skill that will immediately do an action such as attack
	 * @param skill
	 * @returns
	 */
	useInstantSkill(skill: number): boolean {
		return false
	}
	/**
	 * check skill avalibility, get avaliable targets or locations from skilltargetselector
	 * @param {*} skill
	 */
	initSkill(skill: number): ServerGameEventFormat.SkillInit {
		let payload: ServerGameEventFormat.SkillInit = {
			turn: this.player.turn,
			crypt_turn: this.player.game.getGameTurnToken(this.player.turn),
			type: INIT_SKILL_RESULT.NON_TARGET,
			data: null,
			skill: skill,
		}
		if (!this.isSkillLearned(skill)) {
			//	return "notlearned"
			payload.type = INIT_SKILL_RESULT.NOT_LEARNED
			return payload
		} else if (!this.isCooltimeAvaliable(skill)) {
			payload.type = INIT_SKILL_RESULT.NO_COOL
			return payload
		}
		let skillTargetSelector: SkillTargetSelector = this.getSkillTargetSelector(skill)


        //"No CharacterSkillManager is binded for the player" Error
        if(!skillTargetSelector){
            payload.type = INIT_SKILL_RESULT.NOT_LEARNED
			return payload
        }

		if (skillTargetSelector.isNonTarget()) {
			payload.type = INIT_SKILL_RESULT.NON_TARGET
			if (!this.player.AI) {
				let result = this.useInstantSkill(skill)
				if (!result) payload.type = INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			}
			return payload
		}

		if (skillTargetSelector.isActivation()) {
			if (!this.player.AI) this.useActivationSkill(skill)
			payload.type = INIT_SKILL_RESULT.ACTIVATION
			return payload
		} else if (skillTargetSelector.isNoTarget()) {
			payload.type = INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			return payload
		}
		skillTargetSelector.range = this.player.effects.modifySkillRange(skillTargetSelector.range)
		//마법의성,실명 적용

		if (skillTargetSelector.isProjectile()) {
			payload.type = INIT_SKILL_RESULT.PROJECTILE
			payload.data = {
				kind: "location",
				pos: this.player.pos,
				range: skillTargetSelector.range,
				size: skillTargetSelector.projSize,
			}
			return payload
		}
		if (skillTargetSelector.isAreaTarget()) {
			payload.type = INIT_SKILL_RESULT.AREA_TARGET

			payload.data = {
				kind: "location",
				pos: this.player.pos,
				range: skillTargetSelector.range,
				size: skillTargetSelector.areaSize,
			}
			return payload
		}
		let targets = this.player.mediator
			.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).inRadius(skillTargetSelector.range))
			.map((pl: Player) => pl.turn)
		let conditionedTargets = this.player.mediator
			.selectAllFrom(
				EntityFilter.ALL_ATTACKABLE_PLAYER(this.player)
					.inRadius(skillTargetSelector.conditionedRange)
					.onlyIf(skillTargetSelector.condition)
			)
			.map((pl: Player) => pl.turn)

		targets = removeDuplicate(targets.concat(conditionedTargets))

		//test================
		// targets.push(this.player.turn)
		//===================================
		
		//	console.log("skillattr" + targets + " " + skillTargetSelector.range)
		if (targets.length === 0) {
			//return "notarget"
			payload.type = INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			return payload
		}
		payload.type = INIT_SKILL_RESULT.TARGTING
		payload.data = { targets: targets, kind: "target" }
		return payload
	}
	getBaseBasicAttackDamage(): Damage {
		return new Damage(this.ability.AD.get(), 0, 0)
	}
	getBasicAttackName(): string {
		return "basicattack"
	}
	/**
	 * similar with useNonTargetSkill() but contains targeted position
	 * @param pos
	 */
	usePendingAreaSkill(pos: number):ServerGameEventFormat.AreaEffect|null { 
		
		return null
	}

	usePendingTargetingSkill(target:Player):number {
		let damage=this.getSkillDamage(target,this.pendingSkill)
	
		if(!damage || !damage.source) return
		this.player.mediator.skillAttackSingle(damage.source, target.UEID,damage)
		return damage.trajectoryDelay
	}
	/**
	 *
	 * @returns default entityfilter fo basic attack
	 */
	protected getBasicAttackPlayerFilter(): EntityFilter<Player> {
		return EntityFilter.ALL_ENEMY_PLAYER(this.player).excludeUnattackable().inRadius(this.ability.attackRange.get())
	}
	/**
	 * attack range halves for ranged characters
	 * @returns
	 */
	protected getBasicAttackEntityFilter(): EntityFilter<Entity> {
		return EntityFilter.ALL_ENEMY(this.player)
			.excludePlayer()
			.excludeUnattackable()
			.inRadius(this.ability.attackRange.get() * (this.basicAttackType === BASICATTACK_TYPE.RANGED ? 0.5 : 1))
	}
    getBasicAttackFilters():[EntityFilter<Player>,EntityFilter<Entity>]{
        return [this.getBasicAttackPlayerFilter(),this.getBasicAttackEntityFilter()]
    }
    
	calculateScale(data: ValueScale) {
		return this.ability.calculateScale(data)
	}
    /**
	 * perform basic attack if possible
	 * call mapHandler.onBasicAttack()
	 * @returns true if performed basic attack
	 */
	basicAttack(): boolean {
		
		if (this.basicAttackCount <= 0) return false

		this.basicAttackCount -= 1
		
		let damage: Damage = this.ability.basicAttackDamage()

		damage = this.player.mapHandler.onBasicAttack(damage)

		//	console.log("basicattack")
		const [pfilter,efilter]=this.getBasicAttackFilters()

		if (this.basicAttackType === BASICATTACK_TYPE.MELEE)
			this.mediator.basicAttackMelee(this.player, pfilter,efilter, damage)
		else if (this.basicAttackType === BASICATTACK_TYPE.RANGED)
			this.mediator.basicAttackRanged(
				this.player,pfilter,efilter,damage
			)
		return true
	}
	
}
export class EmptySkillManager extends CharacterSkillManager{
    cooltime_list: number[]
    duration_list: number[]
    skill_ranges: number[]
    getSkillTrajectoryDelay(s: string): number {
        console.error("No CharacterSkillManager is binded for the player")
        return 0
    }
    getSkillTargetSelector(skill: number): SkillTargetSelector|null {
        console.error("No CharacterSkillManager is binded for the player")
        return null
    }
    getSkillProjectile(projpos: number): Projectile|null {
        console.error("No CharacterSkillManager is binded for the player")
        return null
    }
    getSkillDamage(target: Entity, skill: number): SkillAttack|null {
        console.error("No CharacterSkillManager is binded for the player")
        return null
    }
    getSkillScale() {
        console.error("No CharacterSkillManager is binded for the player")
    }
    getSkillName(skill: number): string {
        console.error("No CharacterSkillManager is binded for the player")
        return ''
    }
    onSkillDurationCount(): void {
        console.error("No CharacterSkillManager is binded for the player")
    }
    onSkillDurationEnd(skill: number): void {
        console.error("No CharacterSkillManager is binded for the player")
    }
    getSkillBaseDamage(skill: number): number {
        console.error("No CharacterSkillManager is binded for the player")
        return 0
    }
    constructor(player:Player){
        super(player,0)
    }
}