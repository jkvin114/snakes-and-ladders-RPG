import { GameSetting, Game,IGameSetting } from "./Game"
import cliProgress = require("cli-progress")
import { RoomClientInterface } from "./app"
import SETTINGS = require("../res/globalsettings.json")
import { shuffle,pickRandom } from "./Util"
import {ARRIVE_SQUARE_RESULT_TYPE} from "./enum"


interface ISimulationSetting{
    mapPool: number[]
	allowMirrorMatch: boolean
	characterPool: number[]
	lockedCharacters:number[]
	teamLock:number[][]

	playerNumber: number
	randomizePlayerNumber: boolean	
	randomizeGameSetting: boolean
	randomizePlayerNames: boolean
	divideTeamEqually: boolean
    gameSetting:IGameSetting
    
	killRecord: boolean
	itemRecord: boolean
	positionRecord: boolean
	moneyRecord: boolean
}


class SimulationSetting {
	mapPool: number[]
	allowMirrorMatch: boolean
	characterPool: number[]
	lockedCharacters:number[]
	teamLock:number[][]

	playerNumber: number
	randomizePlayerNumber: boolean	
	randomizeGameSetting: boolean
	randomizePlayerNames: boolean
	divideTeamEqually: boolean
    isTeam:boolean
    
    simulationCount: number
	gameSetting: GameSetting
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

	constructor(isTeam:boolean,setting:ISimulationSetting) {
        this.gameSetting=new GameSetting(setting.gameSetting,true,isTeam)
        this.gameSetting.setSimulationSettings(setting)
        this.isTeam=isTeam
        this.mapPool=setting.mapPool
        this.allowMirrorMatch=setting.allowMirrorMatch

        this.characterPool=setting.characterPool   //not locked
		this.lockedCharacters=setting.lockedCharacters   //locked

        this.playerNumber=setting.playerNumber
        this.randomizePlayerNumber=setting.randomizePlayerNumber
        this.randomizeGameSetting=setting.randomizeGameSetting
        this.randomizePlayerNames=setting.randomizePlayerNames
        this.divideTeamEqually=setting.divideTeamEqually
		this.teamLock=setting.teamLock
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
        if(this.isTeam || this.playerNumber<2 || this.playerNumber>4)
            this.playerNumber=4

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
			return pickRandom(SimulationSetting.NAMES)+" "+ pickRandom(SimulationSetting.NAMES) + "(" + String(turn + 1) + "P) "
		} else {
			return String(turn + 1) + "P"
		}
	}
	getCharacterList(count: number) {
		this.characterPool = shuffle(this.characterPool)
		this.lockedCharacters = shuffle(this.lockedCharacters)
		let list = []
		for(let i=0;i < count && i < this.lockedCharacters.length;++i){
			list.push(this.lockedCharacters[i])
		}

		if (this.allowMirrorMatch) {
			for (let i = 0; i < count-this.lockedCharacters.length; ++i) 
				list.push(pickRandom(this.characterPool.concat(this.lockedCharacters)))
		} else {
			for (let i = 0; i < count-this.lockedCharacters.length; ++i) {
				list.push(this.characterPool[i])
			}
		}
		return list
	}
	/**
	 * 
	 * @param isTeam 
	 * @param charlist 
	 * @returns true:red/false:blue/all true:no team
	 */
	getTeamList(isTeam: boolean,charlist:number[]): boolean[] {
		if (!isTeam) {
			return [true, true, true, true]
		} else{
			let maxRed=this.divideTeamEqually? 2: pickRandom([1,2,3])
			let maxBlue=4-maxRed
			let red=0
			let blue=0
			let redlocked=new Set(this.teamLock[0])
			let bluelocked=new Set(this.teamLock[1])

			let teamlist=charlist.map((c)=>{
				if(redlocked.has(c) && red < maxRed){
					red++
					redlocked.delete(c)
					return true
				}
				else if(bluelocked.has(c) && blue < maxBlue){
					blue++
					bluelocked.delete(c)
					return false
				}
				return null
			},this)


			for(let i in teamlist){
				if(teamlist[i]===null && red < maxRed){
					teamlist[i]=true
					red++
				}
				else if(teamlist[i]===null && blue < maxBlue){
					teamlist[i]=false
					blue++
				}
			}
			console.error(charlist)
			console.error(teamlist)
			return teamlist
		} 
	}
	getSummary(){
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
			{ name: "randomizeGameSetting", value: this.randomizeGameSetting },
		]
	}
}

class Simulation {
	private count: number
	private progressCount: number
	private game: Game
	private stats: any[]
	private roomName: string
	private setting: SimulationSetting

	constructor(roomname: string, count: number, setting: SimulationSetting) {
		this.setting = setting
		this.count = count
		this.roomName = roomname

		this.game = null
		this.stats = []
		this.progressCount = 0
	}

	getFinalStatistics() {
		return {
			stat: this.stats,
			count: this.count-1,
			multiple: true,
			version:SETTINGS.version,
			setting:this.setting.getSummary()
		}
	}

	run(callback:Function) {
		let consolelog = console.log
		console.log = function () {}
		const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		bar1.start(this.count - 2, 0)
		let startTime: any = new Date()
		let i = 0

		for (i = 0; i < this.count - 1; ++i) {
			this.playOneGame(i)
			bar1.update(i)
		}
		bar1.stop()
		let endTime: any = new Date()
		let timeDiff: any = endTime - startTime
		console.log = consolelog
		console.log("total time:" + timeDiff + "ms, " + timeDiff / this.count + "ms per game")
		// RoomClientInterface.simulationOver(this.roomName)

		callback()
	}
	playOneGame(i: number) {
		this.makeGame()
		this.game.startTurn()
		this.progressCount = i
		let oneGame = true
		while (oneGame) {
			try {
				let obs = this.nextturn()

				if (obs === ARRIVE_SQUARE_RESULT_TYPE.FINISH) {
					oneGame = false
				} else {
					this.game.aiSkill()
				}
			} catch (e) {
				console.error("Unexpected error on " + this.progressCount + "th game ")
				console.error("while processing " + this.game.thisturn + "th turn player")
				console.error(e)
			}
		}
		this.stats.push(this.game.getFinalStatistics())
	}
    nextturn() {
		this.game.goNextTurn()

		this.game.rollDice(-1)

		return this.game.checkObstacle()
	}
	makeGame() {
		this.setting.updateGameSetting()
		this.game = new Game(this.setting.getMap(), this.roomName, this.setting.gameSetting)

		let playernumber = this.setting.getPlayerCount()
		let charlist = this.setting.getCharacterList(playernumber)
		let teamlist = this.setting.getTeamList(this.setting.isTeam,charlist)
		for (let i = 0; i < playernumber; ++i) {
			this.game.addAI(teamlist[i], charlist[i], this.setting.getPlayerName(charlist[i], i))
		}
	}

    getCount(){
        return this.count
    }
	
}

export { Simulation,ISimulationSetting,SimulationSetting }
