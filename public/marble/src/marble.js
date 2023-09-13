import { MarbleScene, moneyToString, MONOPOLY, Player } from "./marble_board.js"
import { openConnection } from "./socket.js"
import { GameInterface } from "./interface.js"
import { GestureController } from "../../src/game/gesturecontroller.js"
import { initDebug } from "./debug/debug_interface.js"
const sleep = (m) => new Promise((r) => setTimeout(r, m))
export const SOLOPLAY = false

const DICE_GAGE_TOL = [9, 18, 27, 38, 48, 56, 66, 76, 84, 92, 100]
const DICE_GAGE_LENGTH_PX = 300

const MESSAGE = {
	no_money: "자금 부족",
	attack_no_tile: "공격할 땅이 없습니다",
	build_no_more: "더이상 건설할 수 없습니다",
	donate_no_tile: "기부할 땅이 없습니다",
	move_no_tile: "이동 가능한 지역이 없습니다",
	forcemove_no_tile: "이동할 지역이 없습니다",
	choose_to_tile: "선택 가능 지역이 없습니다",
}

const BGM = false
export var GAME
class Game {
	constructor() {
		this.scene = new MarbleScene(this)
		this.playerCount = 4
		this.players = []
		this.addPlayers()
		this.diceGageInterval = null
		this.diceGage = 2
		this.diceGageForwardDirection = true
		this.pressingDice = false
		this.connection
		this.begun = false
		this.myNum = 0
		this.myTurn = 0
		this.ui = new GameInterface(this)
		this.isTeam = false
		this.abilities = new Map()
		this.playerStats = new Map()
		this.sounds = new Map()
		this.gesturecontroller = new GestureController(this)
		if (Game._instance) {
			return Game._instance
		}
		Game._instance = this
	}
	turnToPlayerNum(turn) {
		for (let i = 0; i < this.playerCount; ++i) {
			if (this.players[i].turn === turn) return i
		}
		return 0
	}

	init(setting, num, turn) {
		initDebug()

		Howler.volume(0.3)
		this.myNum = num
		this.myTurn = turn
		this.isTeam = setting.isTeam
		this.playerCount = setting.players.length

		for (let i = 0; i < this.playerCount; ++i) {
			let p = setting.players[i]
			this.players.push(new Player(p.turn, p.turn, p.char, p.name, p.team))
			this.abilities.set(p.turn, p.abilities)
			this.playerStats.set(p.turn, p.stats)
		}
		this.scene.players = this.players

		this.ui.init(setting, turn)
		requestMap()
		const sounds = [
			"ability",
			"buildwindow",
			"card",
			"double",
			"finish",
			"landmark",
			"multiplier",
			"myturn",
			"pull",
			"step",
			"teleport",
			"toll",
			"dice",
			"monopolyalert",
			"background",
			"money",
			"defencecard",
			"buyout",
		]

		for (const sound of sounds) {
			this.sounds.set(
				sound,
				new Howl({
					src: ["res/sound/" + sound + ".mp3"],
				})
			)
		}
	}
	onReady() {
		console.log("game ready")
		this.gesturecontroller.init()
		this.connection.gameReady()
		this.scene.startRenderInterval()
		if (BGM) {
			let elem
			if (Math.random() > 0.5) {
				elem = document.getElementById("bgm2")
			} else {
				elem = document.getElementById("bgm")
			}
			elem.loop = true
			elem.load()
			elem.play()
		}
	}
	showMessage(msg) {
		toast(MESSAGE[msg])
	}
	playsound(sound) {
		let s = this.sounds.get(sound)
		// console.log(s)
		if (!s) return
		s.play()
	}
	turnStart(player) {
		if (SOLOPLAY || this.myTurn === player) this.playsound("myturn")
		this.ui.onTurnStart(player)
		this.scene.focusPlayer(this.turnToPlayerNum(player))
	}
	getAbilities(turn) {
		return this.abilities.get(turn)
	}
	getPlayerStats(turn) {
		return this.playerStats.get(turn)
	}
	showDiceBtn(player, data) {
		//  if(this.myTurn!==player) return
		this.scene.showArrow(this.turnToPlayerNum(player))
		this.ui.showDiceBtn(data.hasOddEven, data.origin)
		this.ui.setTurnIndicator(player)
	}
	diceRoll(turn, data) {
		this.ui.rollDice(data.dice[0], data.dice[1], turn, data.dc)

		// toast(data.dice + ((data.isDouble)?"(더블)":"")+ ((data.dc)?"(주사위 컨트롤!)":""))
	}
	playerWalkMove(player, from, distance, movetype) {
		let list = []
		if (distance > 0) {
			for (let i = 1; i <= distance; ++i) {
				list.push((from + i) % 32)
			}
		} else {
			for (let i = 1; i <= Math.abs(distance); ++i) {
				list.push((from + 320 - i) % 32)
			}
		}
		this.scene.focusPlayer(this.turnToPlayerNum(player))
		this.scene.movePlayerThrough(list, this.turnToPlayerNum(player), movetype, (turn) => this.moveComplete(turn))
	}
	playerTeleport(player, pos, movetype) {
		this.playsound("teleport")
		this.scene.focusPlayer(this.turnToPlayerNum(player))
		if (movetype === "blackhole") this.scene.playerBlackholeMove(this.turnToPlayerNum(player), pos)
		else this.scene.teleportPlayer(this.turnToPlayerNum(player), pos, "levitate")
	}
	playerEffect(turn, effect, pos, status) {
		this.scene.playerEffect(this.turnToPlayerNum(turn), effect, pos, status)
	}
	payMoney(payer, receiver, amount, type) {
		if (type === "toll" && amount > 200 * 10000) this.playsound("toll")
		let payerui = payer
		if (payer !== -1) payerui = this.ui.turnToUi.get(payer)

		if (receiver === -1) this.scene.payMoney(payerui, -1, amount)
		else this.scene.payMoney(payerui, this.ui.turnToUi.get(receiver), amount)

		// if(payer===-1) toast("receivemoney "+moneyToString(amount))
		// else toast("paymoney "+moneyToString(amount))
	}
	chooseBuild(pos, builds, buildsHave, discount, avaliableMoney) {
		let landname = this.scene.getNameAt(pos)

		if (builds.length === 0) this.buildChooseComplete([])
		else {
			this.playsound("buildwindow")
			this.ui.showBuildSelection(landname, builds, buildsHave, discount, avaliableMoney, () => {
				this.buildChooseComplete([])
			})
		}
	}
	askLoan(amount) {
		this.ui.showLoanSelection(amount)
	}
	buildChooseComplete(builds) {
		// console.log(builds)
		this.connection.chooseBuild(builds)
	}
	islandChooseComplete(isescape) {
		this.connection.islandChooseComplete(isescape)
	}
	async build(pos, builds, player) {
		for (const b of builds) {
			if ((b === 1 && builds.length === 1) || b === 6) {
				this.scene.addLandFlag(pos, player, "create")
			} else if (b === 5) {
				this.playsound("landmark")
				this.scene.addLandMark(pos, player, "create")
			} else {
				this.scene.addHouse(pos, player, b - 1, "create")
			}
			this.scene.render()
			await sleep(500)
		}
	}
	chooseBuyout(player, pos, price, originalPrice) {
		let landname = this.scene.getNameAt(pos)
		this.ui.showBuyoutSelection(landname, price, originalPrice, () => {
			this.buyoutComplete(false)
		})
	}
	buyoutComplete(result) {
		this.connection.chooseBuyout(result)
	}
	updateMultipliers(changes) {
		for (const c of changes) {
			this.updateToll(c.pos, c.toll, c.mul)
		}
	}
	updateToll(pos, toll, mul) {
		this.scene.setToll(pos, toll, mul)
	}
	setLandOwner(pos, player) {
		// this.playsound("buyout")
		this.scene.setLandOwner(pos, player)
	}
	setOlympic(pos) {
		this.scene.setOlympic(pos)
	}
	onDiceHoldStart() {
		if (this.pressingDice) return

		this.pressingDice = true
		$("#gage").css("width", "0")
		$("#gage").css("opacity", "1")
		this.diceGage = 1
		this.diceGageForwardDirection = true

		this.onDiceGageInterval()
		this.diceGageInterval = setInterval(() => {
			this.onDiceGageInterval()
		}, 60)

		$("#gage").animate(
			{
				width: "100%",
			},
			600,
			"linear"
		)
	}
	onDiceHoldEnd() {
		if (!this.pressingDice) return

		clearInterval(this.diceGageInterval)
		this.ui.resetTurnIndicator()

		$("#gage").stop()
		let widthcss = $("#gage").css("width")
		let width = 0
		if (widthcss.match(/%/) !== null) width = Number(widthcss.replace("%", ""))
		else if (widthcss.match(/px/) !== null) width = Number(widthcss.replace("px", ""))
		width /= DICE_GAGE_LENGTH_PX / 100

		// console.log(width)

		let gage = 2
		for (const [i, val] of DICE_GAGE_TOL.entries()) {
			if (val >= width) {
				gage = i + 2
				break
			}
		}
		// console.log(gage)
		this.connection.clickDice(gage, this.ui.oddeven)
		$("#gage").animate(
			{
				opacity: "0",
			},
			400
		)
		$("#dice_container").animate(
			{
				opacity: "0",
			},
			400
		)
		setTimeout(() => $("#dice_container").hide(), 400)
		this.pressingDice = false
	}
	onDiceGageInterval() {
		// console.log($("#gage").css("width"))
		if (!this.pressingDice) return
		if (this.diceGageForwardDirection) {
			this.diceGage += 1
			if (this.diceGage === 12) {
				this.diceGageForwardDirection = false
				$("#gage").animate(
					{
						width: "0%",
					},
					600,
					"linear"
				)
			}
		} else {
			this.diceGage -= 1
			if (this.diceGage === 2) {
				this.diceGageForwardDirection = true
				$("#gage").animate(
					{
						width: "100%",
					},
					600,
					"linear"
				)
			}
		}
		//  console.log(this.diceGage)
	}

	askTileSelection(tiles, source) {
		this.ui.showSelectionTitle(source)
		this.scene.showRangeTilesByList(tiles, source, 1)
	}

	onTileSelect(pos, type) {
		this.ui.hideSelectionTitle()
		this.connection.onTileSelect(pos, type, true)
	}
	onTileSelectCancel(type) {
		this.ui.hideSelectionTitle()
		this.connection.onTileSelect(-1, type, false)
		this.scene.tileReset()
	}
	obtainCard(player, name, level, type) {
		this.playsound("card")
		this.ui.obtainCard(name, level, type, this.myTurn === player)
	}
	finishObtainCard(result) {
		this.connection.finishObtainCard(result)
	}
	onConfirmFinish(result, cardname) {
		this.connection.finishConfirm(result, cardname)
	}
	indicateAbility(turn, name, itemName, desc, isblocked) {
		//    if(itemName==="") return

		this.ui.indicateAbility(turn, name, itemName, desc, isblocked)
	}
	addPlayers() {}
	moveComplete(turn) {}
	alertMonopoly(player, type, pos) {
		this.playsound("monopolyalert")
		this.ui.largeText(MONOPOLY[type] + " 경고!", false)
		this.scene.showTileHighlight(pos, "red")
		setTimeout(() => {
			this.scene.clearTileHighlight("red")
		}, 14000)
	}
	bankrupt(turn) {
		this.scene.removePlayer(this.turnToPlayerNum(turn))
		this.ui.onBankrupt(turn)
	}
	gameoverBankrupt(winner, scores, mul) {
		this.playsound("finish")
		this.ui.largeText(winner + 1 + "P 파산 승리", false)
		this.onGameOver(winner, scores, mul, winner + 1 + "P 파산 승리")
	}
	gameoverMonopoly(winner, monopoly, scores, mul) {
		this.playsound("finish")
		this.ui.largeText(winner + 1 + "P " + MONOPOLY[monopoly] + "으로 승리", false)
		this.onGameOver(winner, scores, mul, winner + 1 + "P " + MONOPOLY[monopoly] + " 승리")
	}
	async onGameOver(winner, scores, mul, wintext) {
		console.log(scores)
		await sleep(2000)
		this.ui.showResult(winner, scores, mul, wintext)
	}
	onQuit() {
		this.ui.showDialog("정말 게임을 떠나시겠습니까?", () => {
			document.onbeforeunload = () => {}
			window.location.href = "/index.html"
		})
	}

	selectGodHandSpecial(result) {
		$("#select").hide()
		this.connection.selectGodHandSpecial(result)
	}
}
function toast(msg) {
	$("#toastmessage").html(msg)
	$("#toastmessage").fadeIn(500)
	setTimeout(() => $("#toastmessage").fadeOut(500), 2000)
}
function toast2(msg) {
	$("#toastmessage2").html(msg)
	$("#toastmessage2").fadeIn(500)
	setTimeout(() => $("#toastmessage2").fadeOut(500), 2000)
}

function auth() {
	$.ajax({
		method: "POST",
		url: "/room/game",
		data: {},
	})
		.done(function (data, statusText, xhr) {
			let status = xhr.status
			console.log(status)
		})
		.fail(function (data, statusText, xhr) {
			if (data.status === 401) {
				console.error("unauthorized")
				alert("unauthorized access")
				window.location.href = "index.html"
			}
		})
}

function extendJqueryEasing() {
	var baseEasings = {}

	$.each(["Quad", "Cubic", "Quart", "Quint", "Expo"], function (i, name) {
		baseEasings[name] = function (p) {
			return Math.pow(p, i + 2)
		}
	})

	$.extend(baseEasings, {
		Sine: function (p) {
			return 1 - Math.cos((p * Math.PI) / 2)
		},
		Circ: function (p) {
			return 1 - Math.sqrt(1 - p * p)
		},
		Elastic: function (p) {
			return p === 0 || p === 1 ? p : -Math.pow(2, 8 * (p - 1)) * Math.sin((((p - 1) * 80 - 7.5) * Math.PI) / 15)
		},
		Back: function (p) {
			return p * p * (3 * p - 2)
		},
		Bounce: function (p) {
			var pow2,
				bounce = 4
			pow2 = 2
			while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
			return 1 / Math.pow(4, 3 - bounce) - 5.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2)
		},
	})

	$.each(baseEasings, function (name, easeIn) {
		$.easing["easeIn" + name] = easeIn
		$.easing["easeOut" + name] = function (p) {
			return 1 - easeIn(1 - p)
		}
		$.easing["easeInOut" + name] = function (p) {
			return p < 0.5 ? easeIn(p * 2) / 2 : 1 - easeIn(p * -2 + 2) / 2
		}
	})
}

$(document).ready(function () {
	//auth()
	window.onbeforeunload = function (e) {
		// sessionStorage.roomName = null
		// // GAME.connection.resetGame()
		// $.ajax({
		// 	method: "POST",
		// 	url: "/reset_game"
		// })
		return true
	}
	extendJqueryEasing()
})
$(window).on("load", function (e) {
	console.log("window onload")
	$("#loadingtext").html("CONNECTING WITH SERVER..")
	GAME = new Game()
	openConnection(true)

	$("#testbtn").click(() => {
		GAME.scene.test()
	})

	$("#dicebtn").on("mousedown touchstart", function (e) {
		GAME.onDiceHoldStart()
		return false
	})
	$("#dicebtn").on("mouseup touchend", function (e) {
		GAME.onDiceHoldEnd()
		GAME.scene.clearTileHighlight("yellow")
		return false
	})
})

function requestMap() {
	console.log("requestMap")
	var list = []
	var urls = ["/resource/marble_map", "/resource/marble_map_coordinates"]

	urls.forEach(function (url, i) {
		// (1)
		list.push(
			// (2)
			fetch(url).then(async function (res) {
				//map
				console.log(res)
				let data = await res.json()
				if (!data.length) {
					GAME.scene.setMap(data)
				} //coordinates
				else {
					GAME.scene.setMapCoordinates(data)
				}
			})
		)
	})

	Promise.all(list) // (4)
		.then(function () {
			GAME.scene.setToMarble()
			GAME.scene.drawBoard()
			GAME.onReady()
			GAME.scene.onReady()
			//  alert('all requests finished!'); // (5)
		})
}

function registerSounds() {
	// Howler.volume(VOLUME)
}
