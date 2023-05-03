import { Ability } from "./Ability"

export class ConstrainedAbility extends Ability {
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
