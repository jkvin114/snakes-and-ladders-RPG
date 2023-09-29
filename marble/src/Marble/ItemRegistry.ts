import * as csvParse from "csv-parse"
import fs from "fs"
import { ABILITY_NAME, ABILITY_REGISTRY } from "./Ability/AbilityRegistry"
import { AbilityAttributes } from "./Ability/AbilityValues"
const headers = ["code", "name", "name_kor", "ability", "chance", "value", "upgradevalue", "firstonly", "limit", "cost"]

const DEV = false
interface itemData {
	limit: string
	code: string
	name: string
	ability: string
	name_kor: string
	chance: string
	value: string
	upgradevalue: string
	firstonly: string
	cost: number
}

const myParser = csvParse.parse({ delimiter: ",", columns: headers, fromLine: 2, encoding: "utf-8" })
const ITEMS = new Map<number,itemData>()//: itemData[] = []
export function registerItems() {
	return new Promise<void>((res) =>
		fs
			.createReadStream(__dirname + (DEV ? "./../../res/items-dev.csv" : "./../../res/items.csv"), { encoding: "utf-8" })
			.pipe(myParser)
			.on("data", (data:itemData) => ITEMS.set(Number(data.code),data))
			.on("end", () => {
				console.log("marble items registered" )
				res()
			})
	)
}

export namespace ITEM_REGISTRY {
	export function has(code:number){
		return ITEMS.has(code)
	}

	export function get(code: number): [ABILITY_NAME, AbilityAttributes, number] | null {
		if (code >= ITEMS.size) code = 0

		const item = ITEMS.get(code)
		if(!item) return null

		if (!ABILITY_REGISTRY.has(item.ability as ABILITY_NAME)) return null
		let value = new AbilityAttributes().setItemName(item.name, item.name_kor)

		if (item.chance !== "") value.setChance(Number(item.chance))
		if (item.value !== "") {
			if (item.upgradevalue !== "") value.setValue(Number(item.value), Number(item.upgradevalue))
			else value.setValue(Number(item.value))
		}

		if (item.firstonly === "1") value.setFirstOnly()
		else if (item.limit !== "") value.setLimit(Number(item.limit))

		return [item.ability as ABILITY_NAME, value, Number(item.cost)]
	}
	export function getAllDescriptions(): { code: number; name: string; desc: string; cost: number }[] {
		let list: { code: number; name: string; desc: string; cost: number }[] = []
		for (const code of ITEMS.keys()) {
			let item = get(code)
			if (!item) continue
			let desc = ""
			let ability = ABILITY_REGISTRY.get(item[0])
			if (ability != null) desc = item[1].getDescription(ability.description)

			list.push({
				code: code,
				name: item[1].getItemKorName(),
				desc: desc,
				cost: item[2],
			})
		}
		return list
	}
	export function getDescription(code: number): { code: number; name: string; desc: string; cost: number } | null {
		let item = get(code)
		if (!item) return null
		let desc = ""
		let ability = ABILITY_REGISTRY.get(item[0])
		if (ability != null) desc = item[1].getDescription(ability.description)

		return {
			code: code,
			name: item[1].getItemKorName(),
			desc: desc,
			cost: item[2],
		}
	}
}
