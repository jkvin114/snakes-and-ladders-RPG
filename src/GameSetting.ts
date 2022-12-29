import GAMESETTINGS = require("../res/gamesetting.json")

import { ClientInputEventFormat, ServerGameEventFormat } from "./data/EventFormat"
import * as Util from "./core/Util"

class GameSetting {
	instant: boolean
	isTeam: boolean
	GameSpeed: number

	itemLimit: number
	extraResistanceAmount: number
	additionalDiceAmount: number
	useAdditionalLife: boolean
	legacyAA:boolean
	AAOnForceMove: boolean
	AAcounterAttackStrength: number
	autoNextTurnOnStore: boolean
	autoNextTurnOnSilent: boolean
	diceControlItemFrequency: number
	shuffleObstacle: boolean
	winByDecision: boolean

	killRecord: boolean
	itemRecord: boolean
	positionRecord: boolean
	moneyRecord: boolean
	replay:boolean
	constructor(setting: ClientInputEventFormat.GameSetting, instant: boolean, isTeam: boolean) {
		this.instant = instant
		this.isTeam = isTeam
		if (setting === null) {
			this.randomize()
			this.autoNextTurnOnStore = true
			this.autoNextTurnOnSilent = true
			this.killRecord = true
			this.itemRecord = true
			this.positionRecord = true
			this.moneyRecord = true
			this.itemLimit = 6
			return
		}

		this.itemLimit = setting.itemLimit
		this.extraResistanceAmount = setting.extraResistanceAmount
		this.additionalDiceAmount = setting.additionalDiceAmount
		this.useAdditionalLife = setting.useAdditionalLife
		this.legacyAA=!setting.legacyAA
		// this.AAOnForceMove = setting.AAOnForceMove
		// this.AAcounterAttackStrength = setting.AAcounterAttackStrength
		// this.autoNextTurnOnSilent = setting.autoNextTurnOnSilent
		this.diceControlItemFrequency = setting.diceControlItemFrequency
		this.shuffleObstacle = setting.shuffleObstacle

		this.killRecord = setting.killRecord
		this.itemRecord = setting.itemRecord
		this.positionRecord = setting.positionRecord
		this.moneyRecord = setting.moneyRecord
		this.winByDecision=setting.winByDecision
		this.replay=setting.replay
	}

	randomize() {
		this.extraResistanceAmount = Util.randInt(GAMESETTINGS.gameplaySetting.extraResistanceAmount.options.length)
		this.additionalDiceAmount = Util.randInt(GAMESETTINGS.gameplaySetting.additionalDiceAmount.options.length)
		this.useAdditionalLife = Util.randomBoolean()
		this.AAOnForceMove = Util.randomBoolean()
	//	this.AAcounterAttackStrength = Util.randInt(GAMESETTINGS.gameplaySetting.AAcounterAttackStrength.options.length)
		this.diceControlItemFrequency = Util.randInt(GAMESETTINGS.gameplaySetting.diceControlItemFrequency.options.length)
		this.shuffleObstacle = Util.randomBoolean()
		this.winByDecision=Util.randomBoolean()
		// if(this.winByDecision)
		// 	this.additionalDiceAmount=1
		return this
	}

	setSimulationSettings(setting: ClientInputEventFormat.SimulationSetting) {
		this.killRecord = setting.killRecord
		this.itemRecord = setting.itemRecord
		this.positionRecord = setting.positionRecord
		this.moneyRecord = setting.moneyRecord
		this.replay=setting.replay

	}
	getInitialSetting() {
		return {
			itemLimit: this.itemLimit,
			useAdditionalLife: this.useAdditionalLife,
			autoNextTurnOnSilent: this.autoNextTurnOnSilent
		}
	}

	getSummary() {
		return [
			{ name: "itemLimit", value: this.itemLimit },
			{
				name: "extraResistanceAmount",
				value: GAMESETTINGS.gameplaySetting.extraResistanceAmount.options[this.extraResistanceAmount]
			},
			{
				name: "additionalDiceAmount",
				value: GAMESETTINGS.gameplaySetting.additionalDiceAmount.options[this.additionalDiceAmount]
			},
			{ name: "useAdditionalLife", value: this.useAdditionalLife },
			{ name: "legacyAA", value: this.legacyAA },
			{
				name: "diceControlItemFrequency",
				value: GAMESETTINGS.gameplaySetting.diceControlItemFrequency.options[this.diceControlItemFrequency]
			},
			{ name: "shuffleObstacle", value: this.shuffleObstacle }
			,
			{ name: "coldGame", value: this.winByDecision }
		]
	}
}
export {GameSetting}