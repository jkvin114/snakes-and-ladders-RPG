import type { GameCycleState } from "../GameCycle/RPGGameCycleState"
import { GameLoop } from "../GameCycle/RPGGameLoop"
import { GAME_CYCLE } from "../GameCycle/StateEnum"
import { GameSetting } from "../GameSetting"
//import cliProgress = require("cli-progress")
import SETTINGS = require("../../res/globalsettings.json")
import { shuffle, pickRandom, PlayerType, ProtoPlayer, randomBoolean } from "../core/Util"
import { ClientInputEventFormat } from "../data/EventFormat"
import { TrainData } from "./TrainHelper"
import TRAIN_SETTINGS = require("../../res/train_setting.json")
import type { ReplayEventRecords } from "../ReplayEventRecord"
import sizeof from 'object-sizeof'
import process from 'process'
const v8 = require("v8");
const vm = require('vm');

v8.setFlagsFromString('--expose_gc');
const garbagecollect = vm.runInNewContext('gc');


const { workerData, parentPort, isMainThread } = require("worker_threads")

interface SimulationInit {
	setting: ClientInputEventFormat.SimulationSetting
	count: number
	isTeam: boolean
	runnerId: string
	roomName: string
	path: string
}
class SimulationSetting {
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
	getSummary() {
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

const MAX_COUNT=TRAIN_SETTINGS.train?1000000:999
const GARBAGE_COLLECT_INTERVAL=5000
class Simulation {
	private count: number
	private progressCount: number
	// private game: Game
	private gameCycle: GameCycleState|undefined
	private stats: Set<any>
	private summaryStats: Set<any>
	private roomName: string
	private setting: SimulationSetting
	private runnerId: string
	private trainData:TrainData
	replayRecords:ReplayEventRecords[]


	constructor(roomname: string, count: number, setting: SimulationSetting, runner: string) {
		this.setting = setting
		this.count = Math.min(count,MAX_COUNT)
		this.roomName = roomname
		this.runnerId = runner
		// this.game = null
		this.stats = new Set<any>()
		this.summaryStats = new Set<any>()
		this.progressCount = 0
		this.trainData=new TrainData()
		this.replayRecords=[]
	}

	getFinalStatistics() {
		if (!this.setting.saveStatistics) return null

		return {
			stat: Array.from(this.stats),
			count: this.count - 1,
			multiple: true,
			version: SETTINGS.version,
			setting: this.setting.getSummary()
		}
	}

	getSimpleResults() {
		if (!this.setting.saveStatistics) return null

		return {
			stat: Array.from(this.summaryStats),
			count: this.count - 1,
			serverVersion: SETTINGS.version,
			setting: this.setting.getSummary(),
			simulation: "",
			runner: this.runnerId
		}
	}

	run(callback: Function,onError:Function) {
		const PROGRESS_INTERVAL=Math.max(10,Math.floor(this.count/1000))
		let consolelog = console.log
		console.log = function () {}
		//const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		//bar1.start(this.count - 2, 0)
		let startTime: any = new Date()
		let i = 0
		try{
			for (i = 0; i < this.count - 1; ++i) {
				if (i % PROGRESS_INTERVAL === 0) parentPort.postMessage({ type: "progress", value: i / this.count })
				this.playOneGame(i)
		//		bar1.update(i)
				if(i%GARBAGE_COLLECT_INTERVAL===GARBAGE_COLLECT_INTERVAL/2) {
					for (const [key,value] of Object.entries(process.memoryUsage())){
					//	consolelog(`Memory usage by ${key}, ${value/1000000}MB `)
					}

					if (garbagecollect) {
					//	consolelog("garbage collected")
						garbagecollect();
					}
				}

			}
		}
		catch(e){
			onError(e)
		}
		
	//	bar1.stop()
		let endTime: any = new Date()
		let timeDiff: any = endTime - startTime
		console.log = consolelog
		console.log("total time:" + timeDiff + "ms, " + timeDiff / this.count + "ms per game")

		if(this.setting.isTrain){
			this.trainData.onFinish(this.setting.mapPool)
		}

		callback()
	}
	private playOneGame(i: number) {
		let gameloop=this.makeGame()
		let gc:GameCycleState=gameloop.startSimulation()
		.getTurnInitializer() //turninitializer
		// this.game.startTurn()
		this.progressCount = i
		let oneGame = true
		let error=false
		while (oneGame) {
			try {
				gc=this.nextturn(gc)
				if (!gc || this.isGameOver(gc)) break
				gc = gc.getNext()
				gc=this.skill(gc)
				gc = gc.getNext()
			} catch (e) {
				console.error("Unexpected error on " + this.progressCount + "th game ")
				console.error(e)
				error=true
				break
			}
		}
		if(!error){
			
			if (this.setting.saveStatistics && gc) {
				if (!this.setting.summaryOnly) {
					this.stats.add(gc.game.getFinalStatistics())
				}
				this.summaryStats.add(gc.game.getSummaryStatistics())
			}

			if(this.setting.isTrain && gc){
				this.trainData.addGame(gc.game.getTrainData())
			}
			if(gc && !this.setting.isTrain)
				this.replayRecords.push(gc.game.retrieveReplayRecord())
		}
		gameloop.onDestroy()
		// this.gameCycle.game.onDestroy()
		// this.gameCycle.onDestroy()
		// this.gameCycle.game=null
		// this.gameCycle=null
	}
	private skill(gameCycle:GameCycleState) {
		if (gameCycle && gameCycle.id === GAME_CYCLE.SKILL.AI_SKILL) {
			gameCycle.process()
			gameCycle = gameCycle.getNext()
		} else {
			throw new Error("invalid game cycle state for ai skill")
		}
		return gameCycle
	}
	/**
	 *
	 * @returns is game over
	 */
	private nextturn(gameCycle:GameCycleState): GameCycleState {
		
		if(gameCycle)
			gameCycle = gameCycle.getNext().getNext()
		
		return gameCycle

	}
	private isGameOver(gameCycle:GameCycleState){
		if (gameCycle && gameCycle.id === GAME_CYCLE.BEFORE_SKILL.ARRIVE_SQUARE) {
			return gameCycle.gameover
		} else {
			throw new Error("invalid game cycle state for nextturn")
		}
	}
	private makeGame():GameLoop {
		this.setting.updateGameSetting()
		if(this.progressCount>1) this.setting.gameSetting.replay=false

		let playernumber = this.setting.getPlayerCount()
		let charlist = this.setting.getCharacterList(playernumber)
		let teamlist = this.setting.getTeamList(this.setting.isTeam, charlist)
		let playerlist:ProtoPlayer[] = []
		for (let i = 0; i < playernumber; ++i) {
			playerlist.push({
				type: PlayerType.AI,
				name: this.setting.getPlayerName(charlist[i], i),
				team: teamlist[i],
				champ: charlist[i],
				ready: true,
				userClass:0
			})
		}
		let gameloop = GameLoop.createWithSetting(
			this.setting.getMap(),
			this.roomName,
			this.setting.gameSetting,
			playerlist
		
		)
			
		return gameloop
	}

	getCount() {
		return this.count
	}
	isSummaryOnly(): boolean {
		return this.setting.summaryOnly
	}
}

function runSimulation(data: SimulationInit): Promise<any> {
	//console.log("runnerid"+data.runnerId)
	let setting = new SimulationSetting(data.isTeam, data.setting)
	let simulation = new Simulation(data.roomName, data.count, setting, data.runnerId)

	return new Promise((resolve, reject) => {
		simulation.run(function () {
			resolve({
				replay:simulation.replayRecords,
				stat: simulation.isSummaryOnly() ? null : simulation.getFinalStatistics(),
				simple_stat: simulation.getSimpleResults()
			})
			reject(new Error("Request is failed"))
		},
		(e:unknown)=>reject(e))
	})
}
//console.log("start simulation" + isMainThread)
runSimulation(workerData)
.then((stat) => {
	parentPort.postMessage({ type: "end", value: stat })
	parentPort.close()
})
.catch((e)=>{
	parentPort.postMessage({ type: "error", value: e })
	parentPort.close()
})

export { Simulation, SimulationSetting, runSimulation }
