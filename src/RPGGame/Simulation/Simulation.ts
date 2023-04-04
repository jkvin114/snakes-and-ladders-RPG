import type { GameCycleState } from "../GameCycle/RPGGameCycleState"
import { GameLoop } from "../GameCycle/RPGGameLoop"
import { GAME_CYCLE } from "../GameCycle/StateEnum"
//import cliProgress = require("cli-progress")
import SETTINGS = require("../../../res/globalsettings.json")
import { shuffle, pickRandom, PlayerType, ProtoPlayer, randomBoolean, getCurrentTime } from "../core/Util"
import { ClientInputEventFormat } from "../data/EventFormat"
import { TrainData } from "./TrainHelper"
import TRAIN_SETTINGS = require("../../../res/train_setting.json")
import type { ReplayEventRecords } from "../ReplayEventRecord"
import sizeof from 'object-sizeof'
import process from 'process'
import type { SimulationSetting } from "./Setting"
import type { GameRecord } from "./data/GameRecord"
const { parentPort } = require("worker_threads")
const v8 = require("v8");
const vm = require('vm');

v8.setFlagsFromString('--expose_gc');
const garbagecollect = vm.runInNewContext('gc');


export interface SimulationInit {
	setting: ClientInputEventFormat.SimulationSetting
	count: number
	isTeam: boolean
	runnerId: string
	roomName: string
	path: string
}


const MAX_COUNT=TRAIN_SETTINGS.train?100000:300
const GARBAGE_COLLECT_INTERVAL=5000
const LABEL_CSV_SAVE_INTERVAL=500
export class Simulation {
	private count: number
	private progressCount: number
	// private game: Game
	private gameCycle: GameCycleState|undefined
	private stats: Set<any>
	private summaryStats: Set<any>
	private roomName: string
	private setting: SimulationSetting
	private runnerId: string
	trainData:TrainData
	gameRecords:GameRecord[]
	replayRecords:ReplayEventRecords[]
	private startDateStr:string


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
		this.trainData.createFileStream()
		this.replayRecords=[]
		this.startDateStr=getCurrentTime()
	}

	getFinalStatistics() {
		if (!this.setting.saveStatistics) return null

		return {
			stat: Array.from(this.stats),
			count: this.count - 1,
			multiple: true,
			version: SETTINGS.version,
			patchVersion:SETTINGS.patch_version,
			setting: this.setting.serialize()
		}
	}

	getSimpleResults() {
		if (!this.setting.saveStatistics) return null

		return {
			stat: Array.from(this.summaryStats),
			count: this.count - 1,
			serverVersion: SETTINGS.version,
			patchVersion:SETTINGS.patch_version,
			setting: this.setting.serialize(),
			simulation: "",
			runner: this.runnerId
		}
	}

	run(callback: Function,onError:Function) {
		
		console.log("run"+this.count)
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
					if (garbagecollect) {
						garbagecollect();
					}
				}
				if(i%LABEL_CSV_SAVE_INTERVAL===LABEL_CSV_SAVE_INTERVAL-1) {
					this.trainData.saveTrainLabel()
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
			this.gameRecords=this.trainData.onFinish(this.setting.mapPool,this.setting)
		}
		callback()
	}
	private playOneGame(i: number) {
		const gameloop=this.makeGame()
		let gameState:GameCycleState=gameloop.startSimulation()
		.getTurnInitializer() //turninitializer
		// this.game.startTurn()
		this.progressCount = i
		let oneGame = true
		let error=false
		while (oneGame) {
			try {
				gameState=this.nextturn(gameState)
				if (!gameState || this.isGameOver(gameState)) break
				gameState = gameState.getNext()
				gameState=this.skill(gameState)
				gameState = gameState.getNext()
			} catch (e) {
				console.error("Unexpected error on " + this.progressCount + "th game ")
				console.error(e)
				error=true
				break
			}
		}
		if(!error){
			
			if (this.setting.saveStatistics && gameState) {
				if (!this.setting.summaryOnly) {
					this.stats.add(gameState.game.getFinalStatistics())
				}
				this.summaryStats.add(gameState.game.getSummaryStatistics())
			}
			if(this.setting.isTrain && gameState){
				this.trainData.addGame(gameState.game.getTrainData())
				this.trainData.addTrainLabel(...gameState.game.getLabelData())
			}
			if(gameState && !this.setting.isTrain)
				this.replayRecords.push(gameState.game.retrieveReplayRecord())
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
