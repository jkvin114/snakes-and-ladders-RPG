import * as csvParse from "csv-parse"
import fs from "fs"
import { ABILITY_NAME, ABILITY_REGISTRY } from "./Ability/AbilityRegistry"
import { AbilityAttributes } from "./Ability/AbilityValues"
import { Logger } from "../logger"
const headers = ["code", "name", "name_kor", "ability", "chance", "value", "upgradevalue", "firstonly", "limit", "cost"]

const DEV = false
interface ProtoItemAbility {
	ability_name: string
	chance: number
	value: number
	upgrade_value: number
	first_only: boolean
	limit: number
}
interface ItemData {
	code: number
	item_name: string
	itemname_kor: string
	abilities: ProtoItemAbility[]
	tier: number
}
interface ItemDescription {
	code: number
	 name: string
	  desc: string
	   cost: number
}
interface ParsedItemAbility {
	name: ABILITY_NAME
	attribute: AbilityAttributes
}

const myParser = csvParse.parse({ delimiter: ",", columns: headers, fromLine: 2, encoding: "utf-8" })
const ITEMS = new Map<number, ItemData>() //: itemData[] = []
export function registerItems() {
	try {
		const ITEMLLST: ItemData[] = require("./../../res/items.json")
		for (const item of ITEMLLST) {
			ITEMS.set(Number(item.code), item)
		}
		Logger.log("marble items registered")
		// console.log(ITEMS)
	} catch (e) {
		Logger.err("failed to register marble itmes", e)
	}
}

export namespace ITEM_REGISTRY {
	export function has(code: number) {
		return ITEMS.has(code)
	}

	export function get(code: number): [ParsedItemAbility[], number] | null {
		if (code >= ITEMS.size) code = 0

		const item = ITEMS.get(code)
		if (!item) return null
		const ability:ParsedItemAbility[] = []
		for(const ab of item.abilities){
			if (!ABILITY_REGISTRY.has(ab.ability_name as ABILITY_NAME)) continue
			let value = new AbilityAttributes().setItemName(item.item_name, item.itemname_kor)

			if (ab.chance !== 0) value.setChance(ab.chance)
			if (ab.value !== 0) {
				if (ab.upgrade_value !== 0) value.setValue(ab.value, ab.upgrade_value)
				else value.setValue(Number(ab.value))
			}

			if (ab.first_only) value.setFirstOnly()
			else if (ab.limit!==0) value.setLimit(ab.limit)

			ability.push({name:ab.ability_name as ABILITY_NAME,attribute:value})
		}
		return [ability, item.tier]
	}

	export function getAllDescriptions(): ItemDescription[] {
		let list: ItemDescription[] = []
		for (const [code,itemdata] of ITEMS.entries()) {
			let item = get(code)
			if (!item) continue
			let desc:string[] = []
			for(const ab of item[0]){

				let ability = ABILITY_REGISTRY.get(ab.name)
				
				if (ability != null) desc.push(ab.attribute.getDescription(ability.description))
			}

			list.push({
				code: code,
				name: itemdata.itemname_kor,
				desc: desc.join(" | "),
				cost: item[1],
			})
		}
		return list
	}
}
