import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import type { AbilityValues } from "./Ability/AbilityValues"
import { chooseRandom, clamp, randDice, range } from "./util"

const DICES: number[][][] = range(12).map((total) =>
	range(total - 1, 1)
		.filter((n) => n <= 6 && total - n <= 6)
		.map((n) => [n, total - n])
)

//double,dicecontrol,exactdicecontrol,oddeven
export namespace DiceNumberGenerator {
	export const ODD = 1
	export const EVEN = 2
	const DC_ERROR = 3

	/**
	 * 
	 * @param num 
	 * @param oddEven 
	 * @param modifiers 
	 * @returns [dice1,dice2]
	 */
	export function generate(num: number, oddEven: number,modifiers: {
		dc: boolean;
		exactDc: boolean;
		isDouble: boolean;
		multiplier: number;
	}) {
		let isdc=modifiers.dc
		let isExactDc=modifiers.exactDc
		let isDouble=modifiers.isDouble

		let dice: number[]
		num = clamp(num, 2, 12)
		if (isdc) {
			if (isExactDc) {
				dice = chooseRandom(DICES[num])
			} else {
				let min = clamp(num - DC_ERROR, 2, 12)
				let max = clamp(num + DC_ERROR, 2, 12)
				dice = chooseRandom(([] as number[][]).concat(...range(max, min).map((t) => DICES[t])))
			}
		} else {
			dice = [randDice(), randDice()]
		}
		let total = dice[0] + dice[1]
		if (oddEven === ODD && total % 2 === 0) {
			total = total === 12 ? total - 1 : total + 1
			dice = chooseRandom(DICES[total])
		}
		if (oddEven === EVEN && total % 2 === 1) {
			if (dice[0] >= 6) dice[1] += 1
			else if (dice[1] >= 6) dice[0] += 1
			else {
				dice[chooseRandom([0, 1])] += 1
			}
		}

		if (isDouble && oddEven !== ODD) {
			total = dice[0] + dice[1]
			if (total % 2 === 1) {
				total += 1
			}
			dice = [total / 2, total / 2]
		}

		return dice
		//.map((d)=>clamp(d,1,6))
	}
}
// console.log(DICES)
// gen()
function gen(){

    for(let i=0;i<100;++i){
        // let d=DiceNumberGenerator.generate(7,1,true,{})
        // if(d[0]>6 || d[1]>6 || (d[0]+d[1])>12 ) console.error("error!")
        // console.log(d+"     "+(d[0]+d[1]))
        // console.log()
    }
    
}