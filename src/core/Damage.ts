class PercentDamage {
	percent: number
	base: number
	type: number

	static readonly MAX_HP = 1
	static readonly MISSING_HP = 2
	static readonly CURR_HP = 3
	constructor(percent: number, base: number, type?: number) {
		this.percent = percent
		this.base = base
		if (!type) this.type = Damage.TRUE
		else this.type = type
	}

	getTotal(maxhp:number,hp:number) {
		if (this.base === PercentDamage.MAX_HP) {
			return Math.floor((maxhp * this.percent) / 100)
		}
		if (this.base === PercentDamage.MISSING_HP) {
			return Math.floor(((maxhp - hp) * this.percent) / 100)
		}
		if (this.base === PercentDamage.CURR_HP) {
			return Math.floor((hp * this.percent) / 100)
		}
		return 0
	}
	/**
	 * converts it to damage object
	 * @param target
	 * @returns Damage
	 */
	pack(maxhp:number,hp:number) {
		if (this.type === Damage.ATTACK) {
			return new Damage(this.getTotal(maxhp,hp), 0, 0)
		} else if (this.type === Damage.MAGIC) {
			return new Damage(0, this.getTotal(maxhp,hp), 0)
		} else {
			return new Damage(0, 0, this.getTotal(maxhp,hp))
		}
	}
}

class Damage {
	attack: number
	magic: number
	fixed: number
	static readonly ATTACK = 1
	static readonly MAGIC = 2
	static readonly TRUE = 3

	constructor(attack: number, magic: number, fixed: number) {
		this.attack = Math.floor(attack)
		this.magic = Math.floor(magic)
		this.fixed = Math.floor(fixed)
	}
	static zero():Damage{
        return new Damage(0,0,0)
    }
	copy():Damage{
		return new Damage(this.attack,this.magic,this.fixed)
	}

	getTotalDmg(): number {
		return this.attack + this.magic + this.fixed
	}
	mergeWith(d: Damage) {
		this.attack += d.attack
		this.magic += d.magic
		this.fixed += d.fixed
		return this
	}

	updateDamages(calctype: Function, val: number, type: number[]) {
		for (const t of type) {
			if (t == Damage.ATTACK) {
				this.attack = Math.floor(calctype(this.attack, val))
			}
			if (t == Damage.MAGIC) {
				this.magic = Math.floor(calctype(this.magic, val))
			}
			if (t == Damage.TRUE) {
				this.fixed = Math.floor(calctype(this.fixed, val))
			}
		}
		return this
	}

	updateMagicDamage(calctype: Function, val: number) {
		this.magic = Math.floor(calctype(this.magic, val))
		return this
	}
	updateAttackDamage(calctype: Function, val: number) {
		this.attack = Math.floor(calctype(this.attack, val))
		return this
	}
	updateTrueDamage(calctype: Function, val: number) {
		this.fixed = Math.floor(calctype(this.fixed, val))
		return this
	}
	/**
	 * update attack and magic damage
	 * @param calctype
	 * @param val
	 * @returns
	 */
	updateNormalDamage(calctype: Function, val: number) {
		this.magic = Math.floor(calctype(this.magic, val))
		this.attack = Math.floor(calctype(this.attack, val))
		return this
	}

	updateAllDamage(calctype: Function, val: number) {
		this.magic = Math.floor(calctype(this.magic, val))
		this.attack = Math.floor(calctype(this.attack, val))
		this.fixed = Math.floor(calctype(this.fixed, val))

		return this
	}

	applyResistance(data: { AR: number; MR: number; arP: number; MP: number; percentPenetration: number }): Damage {
		let AR: number = data.AR
		let MR: number = data.MR
		let arP: number = data.arP
		let MP: number = data.MP
		let percentPenetration: number = data.percentPenetration

		AR = AR * (1 - percentPenetration / 100)
		MR = MR * (1 - percentPenetration / 100)

		this.attack = Math.floor(this.attack * (100 / (100 + (AR - arP))))
		this.magic = Math.floor(this.magic * (100 / (100 + (MR - MP))))

		return this
	}
}
export{Damage,PercentDamage}