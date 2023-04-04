import { GameSetting } from "../GameSetting"
import { pickRandom, shuffle, randomBoolean } from "../core/Util"
import type { ClientInputEventFormat } from "../data/EventFormat"
import TRAIN_SETTINGS = require("../../../res/train_setting.json")

export class SimulationSetting {
	mapPool: number[]
	allowMirrorMatch: boolean
	characterPool: number[]
	lockedCharacters: number[]
	teamLock: number[][]

	playerNumber: number
	randomizePlayerNumber: boolean
	randomizeGameSetting: boolean
	randomizePlayerNames: boolean
	divideTeamEqually: boolean
	summaryOnly: boolean
	isTeam: boolean
	saveStatistics: boolean
	simulationCount: number
	gameSetting: GameSetting
	saveLabelCSV:boolean
	saveEvaluation:boolean
	private static PLAYERCOUNT = [2, 3, 4]
	private static NAMES = [
		"Ramon",
		"Yaretzi",
		"Elliott",
		"Angelina",
		"Hudson",
		"Christian",
		"Alessandro",
		"Julia",
		"Joseph",
		"Hadley",
		"Myah",
		"Lilyana",
		"Kaydence",
		"Lorelei",
		"Milo",
		"Camila",
		"Wilson",
		"Frances",
		"Iris",
		"Leon",
		"Wesley",
		"Augustus",
		"Brock",
		"Kara",
		"Zander",
		"Alexandra",
		"Skyla",
		"Franco",
		"Ashlynn",
		"Ernesto"
	]

	isTrain:boolean
	constructor(isTeam: boolean, setting: ClientInputEventFormat.SimulationSetting) {
		this.gameSetting = new GameSetting(setting.gameSetting, true, isTeam)
		this.gameSetting.setSimulationSettings(setting)
		this.summaryOnly = setting.summaryOnly
		this.isTeam = isTeam
		this.mapPool = setting.mapPool
		this.allowMirrorMatch = setting.allowMirrorMatch

		this.characterPool = setting.characterPool //not locked
		this.lockedCharacters = setting.lockedCharacters //locked

		this.playerNumber = setting.playerNumber
		this.randomizePlayerNumber = setting.randomizePlayerNumber
		this.randomizeGameSetting = setting.randomizeGameSetting
		this.randomizePlayerNames = setting.randomizePlayerNames
		this.divideTeamEqually = setting.divideTeamEqually
		this.teamLock = setting.teamLock
		this.saveStatistics = !TRAIN_SETTINGS.train
		this.isTrain=TRAIN_SETTINGS.train
		this.saveEvaluation=setting.saveEvaluation
		this.saveLabelCSV=setting.saveLabelCSV
		
		//if(this.isTrain) this.lockedCharacters=[TRAIN_SETTINGS.focus_character]
	}

	getMap() {
		return pickRandom(this.mapPool)
	}
	updateGameSetting() {
		if (this.randomizeGameSetting) {
			this.gameSetting.randomize()
		}
	}
	getPlayerCount() {
		if (this.isTeam || this.playerNumber < 2 || this.playerNumber > 4) this.playerNumber = 4

		if (!this.randomizePlayerNumber) {
			return this.playerNumber
		} else if (this.allowMirrorMatch) {
			return pickRandom(SimulationSetting.PLAYERCOUNT)
		} else {
			// 미러전 불가면 캐릭터 풀 캐릭터수로 최대플레이어 제한
			return Math.min(pickRandom(SimulationSetting.PLAYERCOUNT), this.characterPool.length)
		}
	}
	getPlayerName(char: number, turn: number) {
		if (this.randomizePlayerNames) {
			return (
				pickRandom(SimulationSetting.NAMES) + " " + pickRandom(SimulationSetting.NAMES) + "(" + String(turn + 1) + "P) "
			)
		} else {
			return String(turn + 1) + "P"
		}
	}
	getCharacterList(count: number) {
		this.characterPool = shuffle(this.characterPool)
		this.lockedCharacters = shuffle(this.lockedCharacters)
		let list = []
		for (let i = 0; i < count && i < this.lockedCharacters.length; ++i) {
			list.push(this.lockedCharacters[i])
		}

		if (this.allowMirrorMatch) {
			for (let i = 0; i < count - this.lockedCharacters.length; ++i)
				list.push(pickRandom(this.characterPool.concat(this.lockedCharacters)))
		} else {
			for (let i = 0; i < count - this.lockedCharacters.length; ++i) {
				list.push(this.characterPool[i])
			}
		}
		return shuffle(list)
	}
	/**
	 *
	 * @param isTeam
	 * @param charlist
	 * @returns true:red/false:blue/all true:no team
	 */
	getTeamList(isTeam: boolean, charlist: number[]): boolean[] {
		if (!isTeam) {
			return [true, true, true, true]
		} else {
			let maxRed = this.divideTeamEqually ? 2 : pickRandom([1, 2, 3])
			let maxBlue = 4 - maxRed
			let red = 0
			let blue = 0
			let redlocked = new Set(this.teamLock[0])
			let bluelocked = new Set(this.teamLock[1])

			let teamlist:boolean[] = charlist.map((c) => {
				if (redlocked.has(c) && red < maxRed) {
					red++
					redlocked.delete(c)
					return true
				} else if (bluelocked.has(c) && blue < maxBlue) {
					blue++
					bluelocked.delete(c)
					return false
				}
				return null
			})

			let teamlist2:boolean[]=[]
			for (let i in teamlist) {
				if (teamlist[i] === null && red < maxRed) {
					teamlist2.push(true)
					red++
				} else if (teamlist[i] === null && blue < maxBlue) {
					teamlist2.push(false)
					blue++
				}
				else if(teamlist[i] === null){
					teamlist2.push(randomBoolean())
				}
			}
			console.log(teamlist2)
			return teamlist2
		}
	}
	serialize() {
		return [
			{ name: "allowMirrorMatch", value: this.allowMirrorMatch },
			{ name: "isTeam", value: this.isTeam },
			{ name: "divideTeamEqually", value: this.divideTeamEqually },
			{ name: "characterPool", value: this.characterPool },
			{ name: "lockedCharacters", value: this.lockedCharacters },
			{ name: "teamLock", value: this.teamLock },
			{ name: "mapPool", value: this.mapPool },
			{ name: "playerNumber", value: this.playerNumber },
			{ name: "randomizePlayerNumber", value: this.randomizePlayerNumber },
			{ name: "randomizeGameSetting", value: this.randomizeGameSetting }
		]
	}
}