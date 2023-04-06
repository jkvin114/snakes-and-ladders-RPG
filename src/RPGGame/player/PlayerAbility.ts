import type { Player } from "./player"
import {  CALC_TYPE } from "../core/Util"
import { ITEM } from "../data/enum"
import ABILITY = require("../../../res/character_ability.json")
import { PlayerComponent } from "./PlayerComponent"
import { Damage,PercentDamage } from "../core/Damage"
import { HPChange } from "../core/health"
import { ValueScale } from "../core/skill"

class Ability {
	protected amount: number
	protected isPercent: boolean
	protected readonly name: string
	constructor(name: string) {
		this.name = name
		this.amount = 0
		this.isPercent = false
	}
	setPercent() {
		this.isPercent = true
		return this
	}
	update(amt: number) {
		if (amt > 0) {
			this.add(amt)
		} else {
			this.subtract(-1 * amt)
		}
	}

	add(amt: number) {
		amt = Math.max(0, amt)
		this.amount += amt
		return this
	}
	set(amt: number) {
		this.amount = Math.max(0, amt)
		return this
	}
	subtract(amt: number) {
		amt = Math.max(0, amt)
		this.amount = Math.max(0, this.amount - amt)
		return this
	}
	get val(){
		return this.amount
	}
	get() {
		return this.amount
	}
	is_percent() {
		return this.isPercent
	}
}

class ConstrainedAbility extends Ability {
	protected constrain: number
	protected actual: number //actual amount exceeding the constrain
	constructor(name: string, constrain: number) {
		super(name)
		this.constrain = constrain
		this.actual = 0
	}

	add(amt: number) {
		this.actual += amt
		if (this.actual > this.constrain) {
			amt = this.constrain
		}
		return super.set(Math.min(this.actual, this.constrain))
	}
	subtract(amt: number) {
		let amtExceeded = Math.max(0, this.actual - this.constrain)
		this.actual = Math.max(0, this.actual - amt)
		return super.subtract(Math.max(amt - amtExceeded, 0))
	}
}

class PlayerAbility implements PlayerComponent{
	AD: Ability
	AR: Ability
	MR: Ability
	attackRange: ConstrainedAbility
	AP: Ability
	// basicAttack_multiplier: number
	arP: Ability
	MP: Ability
	extraHP: number
	regen: Ability
	absorb: Ability
	adaptativeStat: Ability
	// skillDmgReduction: number
	// addMdmg: number
	private adStatAD: boolean
	obsR: Ability
	ultHaste: ConstrainedAbility
	moveSpeed: ConstrainedAbility
	basicAttackSpeed: Ability
	player: Player
	private pendingMaxHpChange: number

	static readonly MAX_ATTACKRANGE = 5
	static readonly MAX_MOVESPEED = 3
	static readonly MAX_ULTHASTE = 3
	constructor(player: Player) {
		this.player = player
		this.AD = new Ability("AD")
		this.AR = new Ability("AR")
		this.MR = new Ability("MR")
		// basic_stats[4]=2
		this.attackRange = new ConstrainedAbility("attackRange", PlayerAbility.MAX_ATTACKRANGE)
		this.AP = new Ability("AP")
		// this.basicAttack_multiplier = 1 //평타 데미지 계수
		this.extraHP = 0 //추가체력
		this.basicAttackSpeed = new Ability("attackSpeed").add(1)
		this.arP = new Ability("arP")
		this.MP = new Ability("MP")
		this.regen = new Ability("regen")
		this.absorb = new Ability("absorb").setPercent()
		this.adaptativeStat = new Ability("adStat")
		// this.skillDmgReduction = 0
		// this.addMdmg = 0
		this.adStatAD = true
		this.obsR = new Ability("obsR").setPercent()
		this.ultHaste = new ConstrainedAbility("ultHaste", PlayerAbility.MAX_ULTHASTE)
		this.moveSpeed = new ConstrainedAbility("moveSpeed", PlayerAbility.MAX_MOVESPEED)
		this.pendingMaxHpChange = 0
	}
	onDeath: () => void
	onTurnStart(){

	}
	init(char:number){
		this.AD.add(ABILITY[char].initial.AD)
		this.AR.add(ABILITY[char].initial.AR)
		this.MR.add(ABILITY[char].initial.MR)
		// basic_stats[4]=2
		this.attackRange.add(ABILITY[char].initial.attackRange)
		this.AP.add(ABILITY[char].initial.AP)
	}
	growth(){
		return ABILITY[this.player.champ].growth
	}
	transfer(func: Function, ...args: any[]) {
		this.player.mediator.sendToClient(func, ...args)
	}
	getByStr(ability: string): number {
		switch (ability) {
			case "AD":
				return this.AD.val
			case "AP":
				return this.AP.val
			case "AR":
				return this.AR.val
			case "MR":
				return this.MR.val
			case "arP":
				return this.arP.val
			case "MP":
				return this.MP.val
			case "extraHP":
				return this.extraHP
			case "HP":
				return this.player.HP
			case "MaxHP":
				return this.player.MaxHP
			case "missingHP":
				return this.player.MaxHP - this.player.HP
		}
		return 0
	}

	update(ability: string, change_amt: number) {
		switch (ability) {
			case "HP":
				//		console.log("hp"+change_amt)

				this.pendingMaxHpChange += change_amt
				break
			case "AD":
				this.AD.update(change_amt)
				if (this.AD.val > this.AP.val && this.adaptativeStat.val > 0 && !this.adStatAD) {
					this.AP.update(-this.adaptativeStat.val)
					this.AD.update(this.adaptativeStat.val)
					this.adStatAD = true
				}
				break
			case "AP":
				this.AP.update(change_amt)
				if (this.AD.val < this.AP.val && this.adaptativeStat.val > 0 && this.adStatAD) {
					this.AD.update(-this.adaptativeStat.val)
					this.AP.update(this.adaptativeStat.val)
					this.adStatAD = false
				}
				break
			case "AR":
				this.AR.update(change_amt)
				break
			case "MR":
				this.MR.update(change_amt)
				break
			case "arP":
				this.arP.update(change_amt)
				break
			case "MP":
				this.MP.update(change_amt)
				break
			case "absorb":
				this.absorb.update(change_amt)
				break
			case "regen":
				this.regen.update(change_amt)
				break
			// case "skillDmgReduction":
			// 	this.skillDmgReduction = Math.min(75, this.skillDmgReduction + change_amt)
			// 	break
			case "adStat":
				this.adaptativeStat.update(change_amt)
				if (this.AD.get() >= this.AP.get()) {
					this.AD.update(change_amt)
					this.adStatAD = true
				} else {
					this.AP.update(change_amt)
					this.adStatAD = false
				}
				break
			// case "addMdmg":
			// 	this.addMdmg += change_amt
			// 	break
			case "attackRange":
				this.attackRange.update(change_amt)
				// console.log("update attackrange"+this.attackRange.get())
				break
			case "obsR":
				this.obsR.update(change_amt)
				break
			case "ultHaste":
				this.ultHaste.update(change_amt)
				break
			case "moveSpeed":
				this.moveSpeed.update(change_amt)
				break
			case "basicAttackSpeed":
				this.basicAttackSpeed.update(change_amt)
				break
		}
		return this
	}
	/**
	 * should be called after sequence of updating stats
	 *
	 */
	flushChange() {
		//	console.log("flushChange"+this.pendingMaxHpChange)
		this.addMaxHP(this.pendingMaxHpChange)
		this.pendingMaxHpChange = 0
		this.sendToClient()
	}

	serializeAll() {
		return {
			level: this.player.level,
			AD: this.AD.val,
			AP: this.AP.val,
			AR: this.AR.val,
			MR: this.MR.val,
			regen: this.regen.val,
			absorb: this.absorb.val,
			arP: this.arP.val,
			MP: this.MP.val,
			attackRange: this.attackRange.val,
			obsR: this.obsR.val,
			ultHaste: this.ultHaste.val,
			moveSpeed: this.moveSpeed.val,
			basicAttackSpeed: this.basicAttackSpeed.val
		}
	}
	getStatusLabel(){
		return `${(this.AR.val+this.MR.val)/100},${(this.AD.val+this.AP.val)/100}`
		let str=''
		for (const [k, v] of Object.entries(this.serializeAll())){
			if(k!=="level") str+=v+","
		}
		return str
	}
	sendToClient() {
		let info_kor = this.player.skillManager.getSkillInfoKor()
		let info_eng = this.player.skillManager.getSkillInfoEng()

		if (this.player.game.instant) return
		this.player.game.eventEmitter.update("stat", this.player.turn, this.serializeAll())
		this.player.game.eventEmitter.updateSkillInfo(this.player.turn, info_kor, info_eng)
	}

	onLevelUp(playercount: number) {
		this.MR.update(playercount * this.growth().MR)
		this.AR.update(playercount * this.growth().AR)
		this.AD.add(this.growth().AD)
		this.flushChange()
	}
	//게임 길어지는거 방지용 저항 추가부여
	addExtraResistance(amt: number) {
		this.MR.add(amt)
		this.AR.add(amt)
		this.flushChange()
	}
	//모든피해 흡혈
	absorb_hp(damage: number) {
		this.player.changeHP_heal(new HPChange(Math.floor((damage * this.absorb.val) / 100)))
	}
	/**
	 * 공격속도 비례 데미지 감소
	 * 공속 2: 기본 평타데미지 총 14%증가
	 * 3: 18%, 4:20% ...
	 * 
	 * @returns
	 */
	basicAttackMultiplier() {
		return 1 / (1 + (this.basicAttackSpeed.val - 1) * 0.75)
	}

	basicAttackDamage() {
		return this.player.skillManager.getBaseBasicAttackDamage()
	}
	addMaxHP(maxHpChange: number) {
		this.extraHP += maxHpChange
		this.player.addMaxHP(maxHpChange)
	}
	onTurnEnd() {
		if (this.regen.get() > 0) {
			this.player.changeHP_heal(new HPChange(this.regen.get()))
		}
	}
	applyResistanceToDamage(damage: Damage, target: PlayerAbility): Damage {
		let pp = 0
		if (this.player.inven.haveItem(ITEM.CROSSBOW_OF_PIERCING)) pp = 40

		return damage
			.applyResistance({
				AR: target.AR.val,
				MR: target.MR.val,
				arP: this.arP.val,
				MP: this.MP.val,
				percentPenetration: pp
			})
	}

	getMagicCastleDamage() {
		return Math.floor(this.AD.val * 0.3 + this.AP.val * 0.24 + this.extraHP * 0.3) 
	}
	calculateScale(data: ValueScale): number {
		let v =
			data.base +
			data.scales.reduce((prev, curr) => {
				return prev + this.getByStr(curr.ability) * curr.val
			}, 0)

		return Math.floor(v)
	}
	static applySkillDmgReduction(damage: Damage, reduction: number) :number{
		return damage.updateNormalDamage(CALC_TYPE.multiply, 1 - reduction * 0.01)
	}
}
export { PlayerAbility }
