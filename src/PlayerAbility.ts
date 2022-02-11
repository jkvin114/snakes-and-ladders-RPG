import { Player } from "./player"
import {PlayerClientInterface} from "./app"
import { HPChangeData, CALC_TYPE, Damage } from "./Util"

class Ability{
	AD: number
	AR: number
	MR: number
	attackRange: number
	AP: number
	basicAttack_multiplier: number
	arP: number
	MP: number
	regen: number
	absorb: number
	adaptativeStat: number
	skillDmgReduction: number
	addMdmg: number
	adStatAD: boolean
	obsR: number
	ultHaste: number
	moveSpeed: number
	player:Player
	static MAX_ATTACKRANGE=5
	static MAX_MOVESPEED=3
	static MAX_ULTHASTE=3
	constructor(player: Player, basic_stats: number[]) {
		this.player=player
		this.AD = basic_stats[1]
		this.AR = basic_stats[2]
		this.MR = basic_stats[3]
		this.attackRange = basic_stats[4]
		this.AP = basic_stats[5]
		this.basicAttack_multiplier = 1 //평타 데미지 계수

		this.arP = 0
		this.MP = 0
		this.regen = 0
		this.absorb = 0
		this.adaptativeStat = 0
		this.skillDmgReduction = 0
		this.addMdmg = 0
		this.adStatAD = true
		this.obsR = 0
		this.ultHaste = 0
		this.moveSpeed = 0
		
	}
	transfer(func:Function,...args:any[]){
        this.player.game.sendToClient(func,...args)
    }
	


	update(ability: string, change_amt: number) {
		let maxHpChange = 0
		switch (ability) {
			case "HP":
				maxHpChange += change_amt
				break
			case "AD":
				this.AD += change_amt
				if (this.AD > this.AP && this.adaptativeStat > 0 && !this.adStatAD) {
					this.AP -= this.adaptativeStat
					this.AD += this.adaptativeStat
					this.adStatAD = true
				}
				break
			case "AP":
				this.AP += change_amt
				if (this.AD < this.AP && this.adaptativeStat > 0 && this.adStatAD) {
					this.AD -= this.adaptativeStat
					this.AP += this.adaptativeStat
					this.adStatAD = false
				}
				break
			case "AR":
				this.AR += change_amt
				break
			case "MR":
				this.MR += change_amt
				break
			case "arP":
				this.arP += change_amt
				break
			case "MP":
				this.MP += change_amt
				break
			case "absorb":
				this.absorb += change_amt
				break
			case "regen":
				this.regen += change_amt
				break
			case "skillDmgReduction":
				this.skillDmgReduction = Math.min(75, this.skillDmgReduction + change_amt)
				break
			case "adStat":
				this.adaptativeStat += change_amt
				if (this.AD >= this.AP) {
					this.AD += change_amt
					this.adStatAD = true
				} else {
					this.AP += change_amt
					this.adStatAD = false
				}
				break
			case "addMdmg":
				this.addMdmg += change_amt
				break
			case "attackRange":
				this.attackRange = Math.min(this.attackRange + change_amt, Ability.MAX_ATTACKRANGE)
				break
			case "obsR":
				this.obsR += change_amt
				break
			case "ultHaste":
				this.ultHaste = Math.min(this.ultHaste + change_amt, Ability.MAX_ULTHASTE)
				break
			case "moveSpeed":
				this.moveSpeed = Math.min(this.moveSpeed + change_amt, Ability.MAX_ULTHASTE)
				break
		}

		this.sendToClient()

		return maxHpChange
	}
	getAll() {
		return {
			level: this.player.level,
			AD: this.AD,
			AP: this.AP,
			AR: this.AR,
			MR: this.MR,
			regen: this.regen,
			absorb: this.absorb,
			arP: this.arP,
			MP: this.MP,
			attackRange: this.attackRange,
			obsR: this.obsR,
			ultHaste: this.ultHaste,
			moveSpeed: this.moveSpeed
		}
	}
	sendToClient() {
		let info_kor = this.player.getSkillInfoKor()
		let info_eng = this.player.getSkillInfoEng()

		if (this.player.game.instant) return
		this.transfer(PlayerClientInterface.update,"stat", this.player.turn, this.getAll())
		this.transfer(PlayerClientInterface.updateSkillInfo, this.player.turn, info_kor, info_eng)
	}

	onLevelUp(resistanceChange: number) {
		this.MR += resistanceChange
		this.AR += resistanceChange
		this.AD += 10
		this.sendToClient()
	}
	//게임 길어지는거 방지용 저항 추가부여
	addExtraResistance(amt: number) {
		this.MR += amt
		this.AR += amt
		this.sendToClient()
	}
	//모든피해 흡혈
	absorb_hp(damage: number) {
		this.player.changeHP_heal(new HPChangeData().setHpChange(5 + Math.floor((damage * this.absorb) / 100)))
	}

	basicAttackDamage(target: Player) {
		return this.player.getBaseBasicAttackDamage().updateAttackDamage(CALC_TYPE.multiply, this.basicAttack_multiplier)
	}
	onTurnEnd() {
		if (this.regen > 0) {
			this.player.changeHP_heal(new HPChangeData().setHpChange(this.regen))
		}
	}
	applyResistanceToDamage(damage: Damage, target: Player, percentPenetration: number): number {
		return damage.applyResistanceToDamage({
			AR: target.ability.AR,
			MR: target.ability.MR,
			arP: this.arP,
			MP: this.MP,
			percentPenetration
		})
	}
}

export default Ability
