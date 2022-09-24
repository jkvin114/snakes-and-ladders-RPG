import { Game } from "./script.js"
import { REPLAY } from "./replays/replay_test.js"
const sleep = (m) => new Promise((r) => setTimeout(r, m))

const SPEEDS=[0.25,0.5,0.75,1,1.5,2,3,4]

export class ReplayGame extends Game {
	constructor(id) {
		super()
		this.replayId = id
		this.replayData
		this.format
		this.running = false
		this.currentIndex = 0
		this.pause=false
		this.speed=1
		this.myturn=undefined
		this.speedIndex=3
	}
	setSpeed(speed){
		this.speed=Math.min(4,speed)
		this.scene.gameSpeed=this.speed
	}
	onCreate() {
		console.log(this.replayId)
		this.requestReplay()
		$("#dialog").hide()
		$("#chat").hide()
		$("#skillbtncontainer").hide()
		$(".myui_new").hide()
		$("#otherui_container").hide()
		$("#replay-control").show()
		$("#replaystart").click(() => {
			this.start()
			this.running=true
			$("#replaypause").show()
			$("#replaystart").hide()
			$("#replayprogress").show()
		})
		$("#replaypause").click(() => {
			this.pause=true
			this.running=false
			$("#replaypause").hide()
			$("#replaystart").show()
		})
		$("#replayslow").click(() => {
			this.speedIndex=Math.max(0,this.speedIndex-1)
			this.updateSpeed()
		})
		$("#replayfast").click(() => {
			this.speedIndex=Math.min(SPEEDS.length-1,this.speedIndex+1)
			this.updateSpeed()
		})
		super.onCreate()
	}
	async requestReplay() {
		try{
			await this.requestReplayById()
			console.log(this.replayData.setting)
			let setting = this.replayData.setting
			this.init(setting, 0, "")
		}
		catch(e){
			alert("error while loading replay data")
			window.location.href="index.html"
		}
		//this.loadResource()
	}
	requestReplayById() {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: "/resource/replay/"+this.replayId,
				type: "GET",
				success: (data) => {
					this.replayData = JSON.parse(data)
					resolve()
				},
				error: (e) => {
					console.log(e)
					reject()
				},
			})
		})
	}
	requestFormat() {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: "/resource/replay_format",
				type: "GET",
				success: (data) => {
					this.format = JSON.parse(data)
					resolve()
				},
				error: (e) => {
					console.log(e)
					reject()
				},
			})
		})
	}
	async loadResource() {
		await this.requestFormat()
		super.loadResource()
	}
	updateSpeed(){
		this.setSpeed(SPEEDS[this.speedIndex])
		$("#replay-speed").html("&times;"+SPEEDS[this.speedIndex])
	}
	//start playing game
	mapLoadComplete() {
		super.mapLoadComplete()
		$("#replaystart").show()
		this.updateSpeed()
		
	}
	modifyDelay(val){
		return Math.floor(val/Math.min(4,this.speed))
	}
	async start() {
		

		if (this.running) return
		this.pause=false
		this.running = true
		for (let i = this.currentIndex; i < this.replayData.events.length; ++i) {
			const event = this.replayData.events[i]
			this.currentIndex += 1
			try {
				$(".replayprogress").html("Playing... "+i+"/"+(this.replayData.events.length-1))
				$(".replay-progress-value").css("width",(i/this.replayData.events.length)*100+"%")
				
				if(event.action==="moveByDice") await sleep(this.modifyDelay(500))
				let delay = this.playEvent(event)
				await sleep(this.modifyDelay(delay))
			} catch (e) {
				console.error(e)
				continue
			}
			if(this.pause) break
		}
	}

	playEvent(event) {
		let delay = 100
		switch (event.action) {
			case "rolldice":
				delay = 0
				break
				this.rollDice(
					{
						turn: this.getProp(event, "turn"),
						dice: this.getProp(event, "dice"),
						dcused: false,
					},
					false
				)
				delay = 1000
				break
			case "moveByDice":
				this.afterDice({
					turn: this.getProp(event, "turn"),
					actualdice: this.getProp(event, "distance"),
					currpos: this.getProp(event, "currpos"),
				})
				delay = this.getProp(event, "distance")*100
				break
			case "damage":
				this.animateDamage({
					turn: this.getProp(event, "turn"),
					change: this.getProp(event, "change"),
					currhp: this.getProp(event, "currhp"),
					currmaxhp: this.getProp(event, "currmaxhp"),
					currshield: this.getProp(event, "currshield"),
					source: this.getProp(event, "source"),
				})
				delay = 0
				break
			case "heal":
				this.animateHeal({
					turn: this.getProp(event, "turn"),
					change: this.getProp(event, "change"),
					currhp: this.getProp(event, "currhp"),
					currmaxhp: this.getProp(event, "currmaxhp"),
					currshield: this.getProp(event, "currshield"),
					type: this.getProp(event, "type"),
				})
				delay = 0
				break
			case "attack":
				this.scene.showAttackEffect({
					source: this.getProp(event, "source"),
					visualeffect: this.getProp(event, "visualeffect"),
					targets: [
						{
							pos: this.getProp(event, "targetPos"),
							damage: this.getProp(event, "damage"),
							flags: this.getProp(event, "flags", true),
						},
					],
					sourcePos: this.getProp(event, "sourcePos"),
				})
				delay = 200
				break
			case "skill_trajectory":
				this.scene.animateTrajectory(
					this.getProp(event, "to"),
					this.getProp(event, "from"),
					this.getProp(event, "type"),
					this.modifyDelay(event.delay)
				)
				delay = event.delay
				break
			case "money":
				this.updateMoney({ turn: this.getProp(event, "turn"), amt: this.getProp(event, "amount"), result: 0 })
				delay = 0
				break
			case "respawn":
				this.playerRespawn(
					this.getProp(event, "turn"),
					this.getProp(event, "pos"),
					Boolean(this.getProp(event, "isRevived"))
				)
				break
			case "shield":
				this.changeShield({
					turn:this.getProp(event, "turn"),
					change:this.getProp(event, "change"),
					shield:this.getProp(event, "shield"),
					indicate:Boolean(this.getProp(event, "indicate")),
				})
				delay = 0
				break
			case "status_effect":
				this.giveEffect(
					this.getProp(event,"effect"),
					this.getProp(event, "turn"),
					this.getProp(event, "num")
				)
				delay=0
				break
			case "teleport_pos":
				this.teleportPlayer({
					turn:this.getProp(event, "turn"),
					pos:this.getProp(event, "pos"),
					movetype:this.getProp(event, "movetype")
				})
				if(this.getProp(event, "movetype") ==="simple")
					delay = 500
				else
					delay=1000
				break
			case "smooth_teleport":
				this.smoothTeleport(
					this.getProp(event, "turn"),
					this.getProp(event,"pos"),
					this.getProp(event, "distance")
				)
				delay=500
				break
			case "delete_projectile":
				this.scene.destroyProj(this.getProp(event,"id"))
				delay=0
				break
			case "death":
				this.onPlayerDie(
					this.getProp(event, "turn"),
					this.getProp(event,"location"),
					this.getProp(event, "killer"),
					this.getProp(event, "isShutDown"),
					this.getProp(event, "killerMultiKillCount")
				)
				delay=0
				break
			case "create_projectile":
				this.scene.placeProj({
					name:this.getProp(event, "name"),
					owner:this.getProp(event, "owner"),
					UPID:this.getProp(event, "id"),
					trajectorySpeed:this.modifyDelay(this.getProp(event, "trajectorySpeed")),
					scope:this.getProp(event, "scope",true),
				})
				delay = this.getProp(event, "trajectorySpeed")
				break
			case "removeEffect":
				this.onReceiveChangeData(event.action,event.invoker,this.getProp(event,"id"))
				delay = 0
				break
			case "create_passprojectile":
				this.scene.placePassProj({
					name:this.getProp(event, "name"),
					owner:this.getProp(event, "owner"),
					UPID:this.getProp(event, "id"),
					trajectorySpeed:this.modifyDelay(this.getProp(event, "trajectorySpeed")),
					scope:this.getProp(event, "scope",true),
					stopPlayer:Boolean(this.getProp(event,"stopPlayer"))
				})
				delay = this.getProp(event, "trajectorySpeed")
				break
			case "create_entity":
				this.scene.summonEntity({
					UEID:this.getProp(event,"id"),
					sourceTurn:this.getProp(event,"sourceTurn"),
					name:this.getProp(event,"name"),
					pos:this.getProp(event,"pos")
				})
				delay=0
				break
			case "delete_entity":
				console.log("delete_entity")
				this.scene.removeEntity(this.getProp(event,"id"),Boolean(this.getProp(event,"iskilled")))
				delay=0
				break
			case "finish_pos":
				this.onReceiveChangeData(event.action,0,this.getProp(event,"pos"))
				delay=0
				break
			case "move_entity":
				this.scene.moveEntityTo(this.getProp(event,"id"), this.getProp(event,"pos"))
				delay=200
				break
			case "appearance":
				this.onReceiveChangeData(event.action,event.invoker,this.getProp(event,"name"))
				delay=0
				break
			case "waiting_revival":
				this.onReceiveChangeData(event.action,event.invoker)
				delay=0
				break
			default:
				delay=0
			break
		}
		return delay
	}

	getProp(event, name, isArray) {
		const format = this.format[event.action]
		if (!format) throw new Error("invalid event name")
		const pos = format[name]
		if (!pos) throw new Error("invalid property name")

		let val = undefined
		switch (pos) {
			case "invoker":
				val = event.invoker
				break
			case "numobj":
				val = event.numberObject
				break
			case "strobj":
				val = event.stringObject
				break
			default:
				let args = pos.split("-")
				if (args[0] === "numarg" && args[1].length > 0) {
					if (isArray) val = event.numberArgs.slice(Number(args[1]))
					else val = event.numberArgs[Number(args[1])]
				} else if (args[0] === "strarg" && args[1].length > 0) {
					if (isArray) val = event.stringArgs.slice(Number(args[1]))
					else val = event.stringArgs[Number(args[1])]
				} else throw new Error("property not exist")
				break
		}
		if (val === undefined) {
			throw new Error("property not exist")
		}
		return val
	}
}
/**
 *  setting {
    playerSettings: {
        turn: number
        team: boolean
        HP: number
        MaxHP: number
        name: string
        champ: number
        champ_name: string
    }[]
    isTeam: boolean
    map:number,
    shuffledObstacles: number[]
}

 */
/*
private invoker:number
    private action:string
    private stringObject:string
    private numberObject:Number
    private stringArgs:string[]|undefined
    private numberArgs:number[]|undefined
    private delay:number
*/
