export class Ability {
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
