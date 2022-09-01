import GameInterface from "./gameinterface.js"
import { Scene, sleep } from "./canvas_control.js"
import { GameClient, openConnection } from "./gameclient.js"
import { StoreStatus, StoreInstance, StoreInterface } from "./store.js"

const VOLUME = 0.7
class StringResource {
	constructor() {
		this.EFFECTS
		this.STATS
		this.SCALE_NAMES
		this.ITEMS
		this.OBSTACLES
		this.ITEMS_SORTED //Map
		this.GLOBAL_SETTING
		this.VISUAL_EFFECTS
		this.SPECIAL_EFFECTS = new Map()
	}
}

// $(document).click(function(){
// 	$('#statinfopopup').hide()
// })

class Player {
	constructor(game, turn, champ, team, name) {
		this.game = game
		this.pos = 0
		this.champ = champ
		this.alive = true
		this.team = team
		this.turn = turn
		this.name = name
		this.isInSubway = false

		//fabric objects
		this.dmgindicator
		this.healindicator

		this.shieldindicator
		this.moneyindicator
		this.playerimg
		this.targetimg
		this.soul //부활대기중일 경우
		this.coffin //죽었을경우
		this.boom //터지는효과
		this.nametext
		this.hpIndicator
		this.hpIndicatorFrameTimeout = setTimeout(() => {}, 0)
		this.hpIndicatorLostTimeout = setTimeout(() => {}, 0)
		this.isHpIndicatorVisible = false
		this.effect_status = new Set()
		this.hpbar
	}
	clearhpIndicatorTimeout() {
		// console.log(this.hpIndicatorLostTimeout)
		clearTimeout(this.hpIndicatorFrameTimeout)
		clearTimeout(this.hpIndicatorLostTimeout)
	}
}

class Game {
	constructor() {
		//singleton
		if (Game._instance) {
			return Game._instance
		}
		Game._instance = this

		this.turnsInUI = [] //turn 으로  ui 위치 찾을때 사용
		this.thisui = 0 //현제 턴의 ui

		this.simulation = false
		this.skillstatus = null //쿨타임, 침묵 등 스킬관련 정보 저장

		this.thisturn = 0 //현재 턴
		this.gameSettings = {
			//	autoNextTurnOnStore: false,
			autoNextTurnOnSilent: true
		}
		this.isTeam = false
		this.ismyturn = false //자신의 턴인지
		this.playerCount = 0 //total number of player
		this.myturn = 0 //Number(sessionStorage.turn) //내 턴
		this.crypt_turn = "" //encrypted my turn

		this.rname = sessionStorage.roomName //방제
		this.dicecount = 0 //주사위 에니메이션 횟수
		this.godhandtarget = -1 //신의손 대상 저장용

		this.dice_clicked = false //주사위 클릭했지
		this.roullete_result = 4 //룰렛결과 저장

		this.effect_status = [] //이펙트 활성화여부
		this.myStat = {}
		this.onMainWay = true //메인 길에 있는지
		this.diceControl = false //주컨 사용가능여부
		this.diceHighlightInterval = null
		this.players = []
		this.strRes = new StringResource()
		this.scene
		this.LANG = sessionStorage.language
		this.pendingSelection = { type: "", name: "" }
		this.ui
		this.storeStatus

		this.subwayPrices = [0, 50, 100]
		this.subwayTicket = -1
		this.connection
		this.store
		this.store_ui
		this.shuffledObstacles
		this.sounds = new Map()
		this.begun = false
		this.skillScale={}
	}
	onCreate() {
		this.ui = new GameInterface(this)
		this.ui.onCreate()
		this.storeStatus = new StoreStatus()
		this.store = new StoreInstance(this.storeStatus)
		this.store_ui = new StoreInterface(this.storeStatus, this.store)
		this.ui.addKeyboardEvent()
		this.ui.addWheelEvent()
		this.ui.addTouchEvent()
		this.ui.addMouseEvent()
		this.ui.addChatDragEvent()
	}

	onDisconnect() {
		this.ui.showDialog(
			this.chooseLang("Unable to connect server, do you wish to reconnect?", "서버 연결 불가, 재접속 하시겠습니까?"),
			GAME.tryReconnect.bind(GAME),
			GAME.onQuit.bind(GAME)
		)
	}

	tryReconnect() {
		$.ajax({
			url: "http://" + sessionStorage.ip_address + "/connection_check",
			type: "GET",
			success: function () {
				//	openConnection(false)
			},
			error: function (e) {
				GAME.onDisconnect()
			}
		})
	}
	onQuit() {
		this.ui.showDialog(
			GAME.chooseLang(
				"Are you sure you want to quit?",
				"정말 게임을 떠나시겠습니까?"
			),
			() => {
				document.onbeforeunload = () => {}
				window.location.href = "index.html"
			}
		)
	}

	extendTimeout() {
		this.connection.extendTimeout()
	}

	turn2ui(turn) {
		return this.turnsInUI[turn]
	}
	updateTurn(t) {
		this.thisturn = t
		this.thisui = this.turn2ui(t)
		this.ismyturn = t === this.myturn
	}

	chooseLang(eng, kor) {
		if (this.LANG === "kor") return kor
		return eng
	}
	zeroArray(count) {
		let arr = []
		for (let i = 0; i < count; ++i) {
			arr.push(0)
		}
		return arr
	}
	arrayOf(n, count) {
		let arr = []
		for (let i = 0; i < count; ++i) {
			arr.push(n)
		}
		return arr
	}
	getChamps() {
		return this.players.map((p) => p.champ)
	}

	init(setting, turn, cturn) {
		this.begun = true
		this.myturn = turn
		this.crypt_turn = cturn

		console.log(this.myturn, this.crypt_turn)

		// this.skill_description = setting[this.myturn].description
		this.playerCount = setting.playerSettings.length //total number of player

		this.storeStatus.init(setting.gameSettings.itemLimit, setting.playerSettings[this.myturn].recommendedItem)

		for (let i = 0; i < this.playerCount; ++i) {
			this.ui.updatePlayerItems(i, this.arrayOf(-1, setting.gameSettings.itemLimit))
		}
		if (!setting.gameSettings.useAdditionalLife) {
			this.storeStatus.hideLife()
		}

		this.gameSettings.autoNextTurnOnSilent = setting.gameSettings.autoNextTurnOnSilent
		//	this.gameSettings.autoNextTurnOnStore = setting.gameSettings.autoNextTurnOnStore

		this.isTeam = setting.isTeam
		this.shuffledObstacles = setting.shuffledObstacles
		for (let i = 0; i < setting.playerSettings.length; ++i) {
			this.players.push(
				new Player(
					this,
					i,
					setting.playerSettings[i].champ,
					setting.playerSettings[i].team,
					setting.playerSettings[i].name
				)
			)
			if(i===this.myturn) this.skillScale=setting.playerSettings[i].skillScale

		}

		this.ui.init(setting.playerSettings)
		requestObstacles()
		registerSounds()
	}

	onMapRequestComplete() {
		this.scene = null
		this.scene = new Scene(this)
		this.scene.players = this.players
	}
	changeShield(val) {
		this.ui.changeShield(val.shield, val.turn)
		this.scene.changeShield(val.turn, val.shield, val.change, val.indicate)
	}
	sendMessage() {
		let msg = $("#text").val()
		$("#chat_enter").css("visibility", "hidden")
		if (msg === "") {
			return
		}
		console.log(msg)
		//sendMessageToServer(msg,this.thisturn)
		$("#text").val("")
		let data = {
			msg: msg,
			turn: this.myturn,
			rname: sessionStorage.roomName
		}
		let posting = $.post("http://" + sessionStorage.ip_address + "/chat", data)
		posting.done(function () {
			console.log(msg + "done")
		})
	}

	receiveMessage(source, msg) {
		$("#chat_text").append(`<p><b class='chat_source'>${source}</b>:${msg}</p>`)
		$("#chat_text").scrollTop(900000)
	}
	boardReady() {
		console.log("boardready")
		setTimeout(() => $(".progress").hide(), 500)
		$("#loadingtext").html("")
		$("#loadingoverlay").hide()
		this.connection.setupComplete()

			//	console.log("simu" + this.simulation)
		
		this.ui.onGameReady()
		$(".start").show()
		this.scene.startRenderInterval()
	}

	getInventoryTooltip() {
		let text = "<img src='res/img/store/life.png'><a> x" + (this.storeStatus.life + 1) + "</a> <br> "

		if (this.scene.mapname === "casino") {
			text += "<img src='res/img/store/token.png'> <a>x" + this.storeStatus.token + "</a>"
		}
		return text
	}

	targetSelected(target, type) {
		console.log("targetselected" + target)
		this.scene.resetTarget()
		if (type === "godhand") {
			this.showRangeTiles(this.players[target].pos, 10, 0, "godhand")
			this.godhandtarget = target
			$("#godhandcancel").hide()
		} else {
			this.connection.sendTarget(target)
		}
	}

	onNextTurn() {
		this.ui.hideSkillBtn()
		this.connection.goNextTurn()
		console.log("onnextturn")
	}

	onSkillBtnClick(val) {
		this.ui.hideSkillBtn()
		this.connection.getSkill(val)
	}
	onBasicAttackClick() {
		this.ui.hideSkillBtn()
		this.connection.basicAttack()
	}
	onDiceBtnClick(dice) {
		console.log("dice" + dice)
		if (!this.dice_clicked) {
			this.connection.pressDice(dice)
			// document.getElementById('sound_dice').play()
		}
		this.dice_clicked = true
	}

	//t:{turn:number,stun:boolean}
	startTurn(turnUpdateData) {
		if (!isMapLoaded) {
			this.android_toast("requestmap again")
			requestMap()
			isMapLoaded = true
		}

		// if (t === "gameover") {
		// 	return
		// }
		//console.log("room name:" + rname)
		this.updateTurn(turnUpdateData.turn)

		this.ui.hideSkillBtn()
		this.ui.highlightUI(turnUpdateData.turn)

		this.showDiceBtn(turnUpdateData)
	}

	//turn:number,stun:boolean
	showDiceBtn(t) {
		//	console.log("show dice btn of")
		//	console.log(t.turn)
		if (t.crypt_turn === this.crypt_turn) this.scene.moveBoardToPlayer(t.turn)

		this.scene.showArrow(t.turn)
		this.dice_clicked = false

		this.ui.showChangeDiceInfo(t)
		//주사위 변화 표시
		console.log(t.crypt_turn)
		if (t.stun) {
			this.manageStun()
		} else if (t.crypt_turn === this.crypt_turn) {
			console.log(t.avaliablepos)
			if (t.dc) {
				this.scene.possiblePosList = t.avaliablepos
			}

			// $("#largedicebtn").attr("src", "res/img/dice/roll6.png")
			$("#largedicebtn").show()
			//	console.log("dc" + t.dc)
			if (this.myStat.level < this.scene.Map.dc_limit_level) {
				this.diceControl = t.dc
				$(".dc").css("visibility", "visible")
				if (!t.dc) {
					$("#dicecontrolbtn").css({ filter: "grayscale(100%)" })
				} else {
					$("#dicecontrolbtn").css({ filter: "grayscale(0%)" })
				}
				//		console.log(t)
				if (t.dc_cool === 0) {
					$("#dicecontrolcool").html("")
				} else {
					$("#dicecontrolcool").html(String(t.dc_cool))
				}
			}
			// this.diceHighlightInterval = setInterval(function () {
			// 	$("#largedicebtn").css({ outline: "0px solid rgba(255,0,0,0.6)" }).animate({ outlineWidth: "9px" }, 900)
			// 	setTimeout(() => {
			// 		$("#largedicebtn").css({ outline: "none" })
			// 	}, 950)
			// }, 1000)
		} else {
			// $("#smalldicebtn").attr("src", "res/img/dice/roll6.png")
			// $("#smalldicebtn").show()
		}
	}

	manageStun() {
		if (this.ismyturn) {
			this.dice_clicked = false
			$("#largedicestun").show()
		}

		let time = 300

		setTimeout(
			function () {
				$("#largedicestun").hide()
			}.bind(this),
			time
		)
	}

	rollDice(dice) {
		// this.onIndicateItem(dice.turn,20)
		//	this.ui.showMultiKillImg(dice.turn,dice.dice,"펜타킬")
		console.log(dice)

		if (dice.turn === 0) {
			$("#killindicator_container").html("")
		}

		$(".dc").css("visibility", "hidden")
		$("#arrow").hide()

		//	console.log("roll dice")
		setTimeout(() => $("#adicewindow").css("visibility", "hidden"), 1500)

		if (this.crypt_turn === dice.crypt_turn && !dice.died) {
			this.store.disable()
			this.store_ui.updateStoreBtnState()

			// $(".storebtn").hide()
			this.scene.shadow.set({ visible: false })
			this.scene.shadow.sendToBack()

			// $("#largetext").html("")
			// $("#largekilltext").html("")
		}

		if (dice === "stun" || !dice || dice.dice < 0) {
			return
		}

		// if (this.players[dice.turn].isInSubway) {
		// 	this.manageSubwayDice(dice)
		// }

		this.dicecount = 0
		if (this.simulation) {
			//	this.scene.movePlayer(dice.actualdice, 1, dice.currpos, dice.turn)
		} else {
			// this.diceAnimation(dice)
			this.animateDice(dice)
			// this.playSound("dice")
		}
		if (dice.dcused) {
			this.android_toast(this.chooseLang("Dice Control!", "주사위 컨트롤!"))
		}
	}

	// manageSubwayDice(dice) {
	// 	if (dice.dice === 6) {
	// 		//express
	// 		setTimeout(() => {
	// 			this.playSound("subway-express")
	// 			this.scene.animateTrain(2, dice.turn)
	// 		}, 1000)
	// 	} else if (dice.dice === 3) {
	// 		//rapid

	// 		setTimeout(() => {
	// 			this.playSound("subway-rapid")
	// 			this.scene.animateTrain(1, dice.turn)
	// 		}, 1000)
	// 	} else {
	// 		//local
	// 		setTimeout(() => {
	// 			this.playSound("subway-rapid")
	// 			this.scene.animateTrain(0, dice.turn)
	// 		}, 1000)
	// 	}
	// }

	async animateDice(dice) {
		$("#dice-container").css({ opacity: 1 })
		// let ui = this.turn2ui[dice.turn]
		let pos = { top: 0, left: 0 }
		if (dice.turn===this.myturn) pos = { top: "100%", left: "100%" }
		$(".dice").addClass("no-animate")

		const elDiceOne = document.getElementById("dice1")
		const dices = [0, 1, 6, 4, 5, 2, 3]

		// let dice1 = dices[dice.dice]
		let other = (dices[dice.dice] + 3 + Math.floor(Math.random() * 2)) % 6

		for (let i = 1; i <= 6; i++) {
			elDiceOne.classList.remove("show-" + i)
			if (other === i) {
				elDiceOne.classList.add("show-" + i)
			}
		}
		$("#dice-wrapper1").css(pos)

		let mul1 = Math.floor(Math.random() * 6) - 2
		let mul2 = Math.floor(Math.random() * 6) - 2

		await sleep(100)

		this.playSound("dice")
		$(".dice").removeClass("no-animate")
		for (let i = 1; i <= 6; i++) {
			elDiceOne.classList.remove("show-" + i)
			if (dices[dice.dice] === i) {
				elDiceOne.classList.add("show-" + i)
			}
		}

		$("#dice-wrapper1").animate(
			{ top: window.innerHeight / 2 - 15 * mul1, left: window.innerWidth / 2 - 15 * mul2 },
			1000,
			"easeOutBounce"
		)
		await sleep(1000)
		$("#dice-container").animate({ opacity: 0 }, 500)
		await sleep(400)
		this.afterDice(dice)
	}
	/**
	 * dica animation and move player
	 * @param {} dice
	 * @returns
	 */
	diceAnimation(dice) {
		//animate dice 10 times
		if (this.dicecount > 10) {
			this.afterDice(dice)
			return
		}
		this.dicecount += 1
		let d = Math.floor(Math.random() * 10) + 1
		this.rollingDice(d)
		setTimeout((() => this.diceAnimation(dice)).bind(this), 60)
	}
	rollingDice(dice) {
		let rot = Math.floor(Math.random() * 36)
		if (this.ismyturn) {
			$("#largedicebtnimg").attr("src", "res/img/dice/roll" + String(dice) + ".png")
			$("#largedicebtnimg").css({
				transform: "rotation(" + rot * 10 + "deg)",
				transform: "translate(0px," + -15 * this.dicecount + "px)"
			})
		} else {
			$("#smalldicebtn").attr("src", "res/img/dice/roll" + String(dice) + ".png")
			$("#smalldicebtn").css({
				transform: "rotation(" + rot * 10 + "deg)",
				transform: "translate(0px," + -10 * this.dicecount + "px)"
			})
		}
	}

	setDice(dice) {
		let rot = Math.floor(Math.random() * 36)

		if (this.ismyturn) {
			$("#largedicebtnimg").attr("src", "res/img/dice/d" + String(dice) + ".png")
			$("#largedicebtnimg").css({
				transform: "rotation(" + rot * 10 + "deg)",
				transform: "translate(0px,-150px)"
			})
		} else {
			$("#smalldicebtn").attr("src", "res/img/dice/d" + String(dice) + ".png")
			$("#smalldicebtn").css({
				transform: "rotation(" + rot * 10 + "deg)",
				transform: "translate(0px,-100px)"
			})
		}
	}

	afterDice(dice) {
		// this.setDice(dice.dice)
		this.players[dice.turn].pos = dice.currpos + dice.actualdice
		//	console.log("after dice thrown")
		this.scene.showPin(dice.currpos + dice.actualdice)
		this.scene.movePlayer(dice.actualdice, 1, dice.currpos, dice.turn)
	}
	smoothTeleport(turn, pos, distance) {
		this.players[turn].pos = pos
		this.scene.movePlayer(distance, 1, pos, turn)
	}
	moveComplete() {
		$(".dicebtn").css("transform", "translate(0px,0px)")
		//if(end){return}

		$(".dicebtn").hide()
		// $("#largetext").html("")
		// $("#largekilltext").html("")

		//	console.log("move complete")

		//move to server
		// if (this.myturn === 0) {
		// 	this.connection.checkObstacle()
		// 	//console.log("checkobstacle")
		// 	setTimeout(
		// 		function () {
		// 			this.connection.obsComplete()
		// 		}.bind(this),
		// 		500
		// 	)
		// }
	}

	onSkillAvaliable(status) {
		// if (status.crypt_turn !== this.crypt_turn) {
		// 	return
		// }
		// if((status.silent > 0 || status.dead) && this.gameSettings.autoNextTurnOnSilent){
		// 	setTimeout(function () {
		// 		GAME.onNextTurn()
		// 	}, 500)
		// 	return
		// }

		this.ui.showSkillBtn(status)
		this.scene.showArrow(status.turn)
		// this.scene.moveBoardToPlayer(status.turn)
	}

	onReceiveTarget(result) {
		$(".storebtn").hide()
		/**
		 * NOT_LEARNED= 0,
			NO_COOL= 1,
			NON_TARGET= 2,
			NO_TARGETS_IN_RANGE= 3,
			PROJECTILE= 4,
			TARGTING= 5,
			AREA_TARGET= 6,
			ACTIVATION=7
		*/

		console.log(result)
		if (result.type === 1) {
			this.android_toast(this.chooseLang("still in cooltime", "아직 재사용 대기시간입니다"))
			this.ui.showSkillBtn(this.skillstatus)
		} else if (result.type === 2 || result.type === 7) {
			this.android_toast(this.chooseLang("Skill activated", "스킬 발동!"))
		} else if (result.type === 3) {
			this.android_toast(this.chooseLang("no targets in range", "범위내에 적이 없음"))
			this.ui.showSkillBtn(this.skillstatus)
		} else if (result.type === 0) {
			this.android_toast(this.chooseLang("not learned skill", "아직 배우지 않았습니다"))
			this.ui.showSkillBtn(this.skillstatus)
		} else if (result.type === 5) {
			$("#selectionname").html(this.chooseLang("targeting skill", "타겟팅 스킬")).show()
			$("#selectiondesc").html(this.chooseLang("Choose a target", "대상 선택")).show()
			this.scene.showTarget(result.data.targets, false)
		} else if (result.type === 4) {
			this.showRangeTiles(result.data.pos, result.data.range, result.data.size, "skill")
		} else if (result.type === 6) {
			this.showRangeTiles(result.data.pos, result.data.range, result.data.size, "areaskill")
		}
	}

	onReceiveGodhandTarget(targets) {
		$("#selectionname").html(this.chooseLang("god`s hand", "신의 손")).show()
		$("#selectiondesc").html(this.chooseLang("Choose a player to move", "이동시킬 플레이어 선택")).show()

		this.scene.showTarget(targets, "godhand")
	}
	onReceiveChangeData(type, turn, data) {
		if (type === "kda") {
			this.changeKda(turn, data)
		}
		if (type === "removeEffect") {
			console.log("Removeeffect" + turn + " " + data)
			this.removeEffect(data, turn)
		}
		if (type === "appearance") {
			this.ui.updateCharacterApperance(data, turn)
			this.scene.updateCharacterApperance(data, turn)
		}
		if (type === "isInSubway") {
			console.log("isInSubway" + turn + " " + data)
			this.players[turn].isInSubway = data
		}
		if (type === "dc_item") {
			this.scene.indicateDcItem(turn, data)
		}
		if (type === "item") {
			this.ui.updatePlayerItems(turn, data)
		}
		if (type === "move_entity") {
			this.scene.moveEntityTo(data.UEID, data.pos)
		}
		if (type === "waiting_revival") {
			this.scene.showSoul(turn)
		}
		if (type === "finish_pos") {
			this.scene.setFinish(data)
		}
		if (type === "reconnect") {
			this.ui.playerReconnect(turn,this.players[turn].name)
		}
		if (type === "disconnect") {
			this.ui.playerDisconnect(turn,this.players[turn].name)
		}
		if (this.myturn !== turn) {
			return
		}

		switch (type) {
			case "stat":
				this.myStat = data
				this.ui.updateStatTooltip(data)
				break
			case "skillstatus":
				this.ui.updateSkillBtnStatus(data)
				break
			case "way":
				this.onMainWay = data
				break
			case "token":
				this.storeStatus.updateToken(data)
				break
			case "life":
				this.storeStatus.updateLife(data)
				break
			case "item":
				this.storeStatus.updateItemSlot(data)
				this.store_ui.updateAllCurrentItem(data)
				//	console.log(amt)
				// this.ui.changeItemToast()
				break
			case "subwayTicket":
				this.subwayTicket = data
				break
			case "removeSpecialEffect":
				this.removeSpecialEffect(data)
				break
			case "skillImg":
				this.ui.updateSkillImg(data)
				break
			case "activeItem":
				this.ui.updateActiveItem(data)
				break
		}
	}

	giveEffect(e, turn, num) {
		// console.log("giveeffect"+this.players[turn].effect_status.length)
		// console.log(this.players[turn].effect_status)

		// if (turn === this.myturn) {
		// //	android_toast("received "+e+" effect")
		// }
		// if(e >= this.effect_status.length) return
		//	if(e >= this.players[turn].effect_status.length) return

		if (!this.players[turn].effect_status.has(e)) {
			if (turn === this.myturn) {
				this.ui.addEffect(e)
			}
			this.scene.indicateEffect(turn, e, num)
			this.scene.toggleEffect(turn, e, true)
			this.players[turn].effect_status.add(e)
		}
	}

	/**
	 * 
	 * @param {*} name name of the effect
	 * @param {*} data description data, img src

	 */
	applySpecialEffect(turn, name, data, sourcePlayer) {
		if (turn !== this.myturn) {
			return
		}

		if (!this.players[this.myturn].effect_status.has(name)) {
			if (data.type === "item") {
				this.ui.addItemSpecialEffect(name, data.item_id, data.isgood)
				this.strRes.SPECIAL_EFFECTS.set(name, [this.chooseLang(data.desc, data.desc_kor), data.item_id])
			} else {
				this.ui.addSpecialEffect(name, data.src, data.isgood)
				this.strRes.SPECIAL_EFFECTS.set(name, [this.chooseLang(data.desc, data.desc_kor), sourcePlayer])
			}

			this.players[this.myturn].effect_status.add(name)
		}
	}

	removeEffect(e, turn) {
		if (this.players[turn].effect_status.has(e)) {
			if (turn === this.myturn) {
				$("#e" + String(e)).remove()
			}
			this.scene.toggleEffect(turn, e, false)
			this.players[turn].effect_status.delete(e)
		}
	}
	removeSpecialEffect(name) {
		if (this.players[this.myturn].effect_status.has(name)) {
			$("#se_" + String(name)).remove()

			this.players[this.myturn].effect_status.delete(name)
			this.strRes.SPECIAL_EFFECTS.delete(name)
		}
	}

	removeAllEffects(turn) {
		this.players[turn].effect_status = new Set()

		this.scene.removeAllEffects(turn)
		if (turn === this.myturn) {
			$(".effect").remove()
		}
	}

	onTileSelectionCancel(type) {
		if (type === "submarine") {
			// sendSubmarineDest(0, false)
			$(".mystatus").show()
			this.connection.sendSubmarineDest({
				type: "submarine",
				result: 0,
				complete: false
			})
		}
		if (type === "godhand") {
			this.connection.sendGodHandInfo({ complete: false, type: "godhand" })
		}
		if (type === "skill") {
			this.connection.sendTileLocation(-1)
			//this.ui.showSkillBtn(this.skillstatus)
		}
		if (type === "areaskill") {
			this.connection.sendAreaSkillLocation(-1)
			//this.ui.showSkillBtn(this.skillstatus)
		}
		$("#selectionname").html("").hide()
		$("#selectiondesc").html("").hide()
		// $("#largetext").html("")
		this.scene.tileReset()
		this.endSelection()
	}

	onTileSelectionComplete(index, type) {
		console.log("tileselected" + type + " " + index)

		if (type === "godhand") {
			let godhand_info = {
				complete: true,
				objectResult: {
					target: this.godhandtarget,
					location: index
				},
				type: "godhand"
			}
			//	console.log("godhand location selected" + godhand_info)
			this.godhandtarget = -1

			this.connection.sendGodHandInfo(godhand_info)
		} else if (type === "skill") {
			this.connection.sendTileLocation(index)
		} else if (type === "areaskill") {
			this.connection.sendAreaSkillLocation(index)
		} else if (type === "submarine") {
			// this.tooltip.set({ opacity: 0 })
			$(".mystatus").show()
			this.connection.sendSubmarineDest({
				type: "submarine",
				result: index,
				complete: true
			})
		}

		// $("#largetext").html("")
		$("#selectionname").html("").hide()
		$("#selectiondesc").html("").hide()
	}
	/**
	 * 타겟 혹은 타일 선택 준비시 호출
	 */
	prepareSelection() {
		moveBoardInstant(this.scene.getPlayerPos(this.myturn), 1)
		this.ui.hideChat()
		this.ui.disableAllSkillBtn()
		$(".mystatus").hide()
	}
	/**
	 * 타겟 또는 타일 선택 완료시ㅣ 호출
	 */
	endSelection() {
		$("#overlaySelector").html("")
		$(".mystatus").show()
		$("#selectionname").html("").hide()
		$("#selectiondesc").html("").hide()
	}

	showRangeTiles(pos, range, size, type) {
		$(".storebtn").hide()

		if (type === "godhand") {
			$("#cancel_tileselection").show()

			$("#selectionname").html(this.chooseLang("god`s hand", "신의 손")).show()
			$("#selectiondesc")
				.html(this.chooseLang("Choose a square you want to move the player to", "플레이어를 이동시킬 칸 선택"))
				.show()
		} else if (type === "skill") {
			this.prepareSelection()
			$("#cancel_tileselection").show()
			$("#selectionname").html(this.chooseLang("non-target skill", "논타겟 스킬")).show()
			$("#selectiondesc").html(this.chooseLang("Choose a square to place the projectile", "발사할 칸 선택")).show()
		} else if (type === "submarine") {
			this.prepareSelection()
			$("#cancel_tileselection").show()
			$("#selectionname").html(this.chooseLang("Submarine", "잠수함")).show()
			$("#selectiondesc").html(this.chooseLang("Choose a square you want to move to", "이동할 칸 선택")).show()
		} else if (type === "areaskill") {
			this.prepareSelection()
			$("#cancel_tileselection").show()
			$("#selectionname").html(this.chooseLang("area skill", "영역지정 스킬")).show()
			$("#selectiondesc").html(this.chooseLang("Choose an area to launch the skill", "발사할 영역 선택")).show()
		}
		$("#cancel_tileselection").click(() => this.onTileSelectionCancel(type))
		$("#confirm_tileselection").show()

		let start = Math.floor(pos - range / 2)
		let end = Math.floor(pos + (range / 2 + 1))
		if (!this.onMainWay) {
			start = Math.max(start, this.scene.Map.way2_range.way_start + 1)
			end = Math.min(end, this.scene.Map.way2_range.way_end)
		}
		this.scene.showRangeTiles(start, end, type, size)
	}
	onSkillCancel() {
		// $("#largetext").html("")
		$("#selectionname").html("").hide()
		$("#selectiondesc").html("").hide()
		this.scene.resetTarget()
		this.endSelection()
		//this.ui.showSkillBtn(GAME.skillstatus)
		this.connection.sendTarget(-1)
	}

	syncPlayerVisibility(data) {
		for (let d of data) {
			if (d.alive) {
				this.scene.showPlayer(d.turn, d.pos)
				this.players[d.turn].alive = true
			}
			this.players[d.turn].pos = d.pos
		}
	}
	isEnemy(turn) {
		if (turn < 0 || turn > 3) return true
		if (this.myturn === turn || (this.isTeam && this.players[this.myturn].team === this.players[turn].team)) {
			return false
		}
		return true
	}

	onPlayerDie(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount) {
		if (!this.players[turn].alive) return

		this.players[turn].alive = false
		this.scene.showCoffin(turn)
		this.scene.playerDeath(turn, spawnPos)
		// this.scene.hideEffectIndicators(turn)

		if (turn === this.myturn) {
			this.scene.canvas.bringToFront(this.scene.shadow)
			this.scene.canvas.discardActiveObject()
			this.scene.shadow.set({ visible: true })
		}
		this.removeAllEffects(turn)
		this.ui.indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount)

		// $(ui[this.turn2ui(turn)]).css({"background-color":"gray"})
	}

	openNewStore(data) {
		this.storeStatus.set(data)
		this.store = new StoreInstance(this.storeStatus)
		this.store_ui.storeInstance = this.store
		this.store_ui.openNewStore(data)

		// tokenprice = -1 //이번턴에 상점갈때 최초 1회만 토큰가격 설정되도록

		// this.priceMultiplier = priceMultiplier
	}

	playerRespawn(turn, respawnPos, isRevived) {
		if (isRevived) {
			this.scene.showEffect(respawnPos, "revive")
		}
		this.removeAllEffects(turn)
		this.scene.hideCoffinAndSoul(turn)
		this.players[turn].pos = respawnPos
		this.scene.respawnPlayer(turn, respawnPos)
		this.players[turn].alive = true
		$(this.ui.elements.kdasections[turn]).css("background", "none")

		// $("#largetext").html("")

		// $(ui[this.turn2ui(turn)]).css({"background-color":"white"})
	}
	changeKda(turn, str) {
		$(this.ui.elements.kdainfos[turn]).html(str)
	}

	//주사위를 굴려 상점에 간 경우
	arriveStore(turn, storeData) {
		if (turn === this.myturn) {
			this.openNewStore(storeData)
		}
	}
	updateMoney(val) {
		if (val.turn === this.myturn) {
			$("#money").html(val.result + "$")
			// $("#storemoney").html(val.result + "$")
		}

		if (val.amt !== 0) {
			this.scene.indicateMoney(val.turn, val.amt)
			if (val.amt > 10) {
				GAME.playSound("gold")
			} else if (val.amt < 0) {
				GAME.playSound("takemoney")
				GAME.playSound("basicattack")
			}
		}
	}

	updatePosition(turn, pos) {
		this.players[turn].pos = pos
	}

	onIndicateObstacle(obs, turn) {
		if (this.myturn === turn) {
			this.ui.showObsNotification(obs)
		}
		this.playObstacleSound(obs)
	}
	onIndicateItem(turn, item) {
		console.log("onIndicateItem")
		if (!this.strRes.ITEMS.items[item].active_summary) return
		let it = this.strRes.ITEMS.items[item]

		if (turn === this.myturn) {
			this.ui.indicateMyActiveItem(
				item,
				this.chooseLang(it.name, it.kor_name),
				this.chooseLang(it.active_summary.eng, it.active_summary.kor)
			)
		} else {
			this.ui.indicateActiveItem(
				this.turn2ui(turn),
				item,
				this.chooseLang(it.active_summary.eng, it.active_summary.kor)
			)
		}

		// this.android_toast(
		// 	GAME.chooseLang(
		// 		this.strRes.ITEMS.items[item].name + ":<br>" + this.strRes.ITEMS.items[item].unique_effect,
		// 		this.strRes.ITEMS.items[item].kor_name + " 발동<br>" + this.strRes.ITEMS.items[item].unique_effect_kor
		// 	)
		// )
	}
	playObstacleSound(obs) {
		if (obs === 41 || obs === 28 || obs === 13) {
			this.playSound("web")
		}
		if (obs === 36 || obs === 55 || obs === 56) {
			this.playSound("wind")
		}
	}

	hideEveryWindow() {
		this.ui.hideAll()
		this.scene.resetTarget()
		this.scene.tileReset()
		$("#randomobs").hide()
	}
	spinRoullete(type, result) {
		// type='court'
		$(".overlay").show()
		const easings = ["easeOutBounce", "easeOutBack", "easeOutQuad"]
		const entry_height = 70
		let labels = type === "casino" ? this.strRes.CASINO_LABELS : this.strRes.TRIAL_LABELS
		if (type === "casino") {
			$("#randomobs_casino").show()
		} else if (type === "court") {
			$("#randomobs_court").show()
		}
		$("#randomobs_result").css({ opacity: 0 }).html(labels[result].desc)

		const entryCount = 10 + Math.floor(Math.random() * 4)
		const easing = Math.floor(Math.random() * 3)
		const duration = Math.floor(Math.random() * 800) + 2400
		let str = ""
		let prevlabel = 0
		for (let i = 0; i < entryCount + 3; ++i) {
			let classes = type + " " + (i % 2 === 0 ? "even" : "odd")
			// if(type==='casino'){
			// 	classes='casino '
			// }
			// if(type==='court'){
			// 	classes='court '+(i%2===0?'even':'odd')
			// }
			let label = Math.floor(Math.random() * 6)
			if (i === entryCount) {
				str += `<p class="randomobs_entry ${classes}">${labels[result].name}</p>`
				// str+=`<p class="randomobs_entry">result</p>`
				prevlabel = result
			} else {
				if (label === prevlabel) label = (label + 1) % 6
				str += `<p class="randomobs_entry ${classes}">${labels[label].name}</p>`
				prevlabel = label
			}
		}
		$("#randomobs_entries").html(str)

		$("#randomobs").show()
		this.playSound("roullete")

		//easeOutBounce  easeOutBack easeOutQuad
		$("#randomobs_entries").animate({ scrollTop: entryCount * entry_height }, duration, easings[easing], () => {
			$("#randomobs_result").animate({ opacity: 1 }, 500)
			if (type === "court") {
				GAME.playSound("judgement")
			}
			// GAME.playSound("judgement")
			setTimeout(() => GAME.roulleteEnd(), 1500)
		})
	}
	roulleteEnd() {
		$("#randomobs_entries").html("")
		$("#randomobs_entries").scrollTop(0)
		$("#randomobs").hide()
		$("#randomobs_court").hide()
		$("#randomobs_casino").hide()

		$(".overlay").hide()
		if (this.ismyturn) {
			this.connection.roulleteComplete()
		}
	}

	onGameOver(winner) {
		document.onbeforeunload = () => {}
		this.hideEveryWindow()
		this.scene.clearRenderInterval()

		$("#overlay").show()

		if (this.myturn === winner) {
			$(".victory").show()
		} else if (this.isTeam && this.players[this.myturn].team === this.players[winner].team) {
			$(".victory").show()
		} else {
			$(".defeat").show()
		}

		// setTimeout(function () {
		// 	window.onbeforeunload = () => {}
		// 	window.location.href = "statpage.html"
		// }, 5000)
	}

	subwayComplete(type) {
		$("#subwaywindow").css("visibility", "hidden")
		this.playSound("store")
		console.log("subway" + type)
		this.subwayTicket = type
		this.connection.sendSubwayType({
			type: "subway",
			complete: true,
			objectResult: {
				type: type,
				price: this.subwayPrices[type]
			}
		})
	}

	android_toast(msg) {
		$("#toastmessage").html(msg)
		$("#toastmessage").fadeIn(500)
		setTimeout(() => $("#toastmessage").fadeOut(500), 2000)
		// try {
		// 	android.toast(msg)
		// } catch (e) {

		// 	// alert(msg)
		// }
		return
	}
	playSound(sound) {
		let toPlay
		//rate([rate], [id]) ,0.5 ~ 4
		let rate = 1
		if (sound === "roullete") {
			rate = 2
		}

		if (sound === "gold") {
			toPlay = GAME.sounds.get(Math.random() > 0.5 ? "gold" : "gold2")
		}
		else if (sound === "hit") {
			toPlay = GAME.sounds.get(Math.random() > 0.5 ? "hit" : "hit2")
		}  else if (sound === "store") {
			toPlay = GAME.sounds.get(Math.random() > 0.5 ? "store" : "store2")
		} else if (GAME.sounds.has(sound)) {
			toPlay = GAME.sounds.get(sound)
		} else {
			return
		}
		let id = toPlay.play()
		toPlay.rate(rate, id)
	}
}

function requestItemList() {
	let itemrequest = new XMLHttpRequest()
	itemrequest.open("GET", `/resource/item`, true)
	itemrequest.onload = function () {
		try {
			//	ItemList = JSON.parse(itemrequest.responseText)
			GAME.strRes.ITEMS = JSON.parse(itemrequest.responseText)
			sortItems()
			GAME.store_ui.initStoreHome()
			//	this.storeStatus.item = zeroArray(ItemList.items.length)
			requestMap()
		} catch (e) {
			console.error(e)
		}
	}
	itemrequest.send()
}
function requestGlobalSetting() {
	let request = new XMLHttpRequest()
	request.open("GET", `/resource/globalsetting`, true)
	request.onload = function () {
		try {
			//	ItemList = JSON.parse(itemrequest.responseText)
			GAME.strRes.GLOBAL_SETTING = JSON.parse(request.responseText)
		} catch (e) {
			console.error(e)
		}
	}
	request.send()
}

function getItemByCatAndLevel(cat, level) {
	return GAME.strRes.ITEMS.items
		.filter((item) => {
			return item.category.includes(cat) && item.itemlevel === level
		})
		.map((item) => item.id)
}

function sortItems() {
	let sorted = new Map() //<string,int[]>
	for (let i = 0; i < 3; ++i) {
		let lvl = String(i + 1)
		sorted.set("attack_lv" + lvl, getItemByCatAndLevel("attack", i + 1))
		sorted.set("magic_lv" + lvl, getItemByCatAndLevel("magic", i + 1))
		sorted.set("defence_lv" + lvl, getItemByCatAndLevel("defence", i + 1))
		sorted.set("health_lv" + lvl, getItemByCatAndLevel("health", i + 1))
		sorted.set("utility_lv" + lvl, getItemByCatAndLevel("utility", i + 1))
	}
	console.log(sorted)
	GAME.strRes.ITEMS_SORTED = sorted
	GAME.storeStatus.setItemList(GAME.strRes.ITEMS.items, sorted)
}

function requestObstacles() {
	let request = new XMLHttpRequest()

	request.open("GET", GAME.chooseLang("/resource/obstacle?lang=eng", "/resource/obstacle?lang=kor"), true)
	request.onload = function () {
		try {
			//obstacleList = JSON.parse(request.responseText)
			GAME.strRes.OBSTACLES = JSON.parse(request.responseText)

			requestStringRes()
		} catch (e) {
			console.error("Invaild obstacle json format!")
		}
		return
	}
	request.send()

	let request2 = new XMLHttpRequest()
	request2.open("GET", `/resource/visualeffects`, true)
	request2.onload = function () {
		try {
			GAME.strRes.VISUAL_EFFECTS = JSON.parse(request2.responseText)
			console.log(GAME.strRes.VISUAL_EFFECTS)
		} catch (e) {
			console.error(e)
		}
	}
	request2.send()
}

function requestStringRes() {
	let request = new XMLHttpRequest()

	request.open("GET", "/resource/string_resource", true)
	request.onload = function () {
		try {
			//	obstacleList = JSON.parse(request.responseText)
			let res = JSON.parse(request.responseText)
			GAME.strRes.STATS = GAME.chooseLang(res.stat, res.stat_kor)
			GAME.strRes.SCALE_NAMES = GAME.chooseLang(res.scale_stat, res.scale_stat_kor)
			GAME.strRes.EFFECTS = GAME.chooseLang(res.statuseffect, res.statuseffect_kor)
			GAME.strRes.TRIAL_LABELS = GAME.chooseLang(res.triallabel, res.triallabel_kor)
			GAME.strRes.CASINO_LABELS = GAME.chooseLang(res.casinolabel, res.casinolabel_kor)
			GAME.strRes.STAT_DETAIL = GAME.chooseLang(res.stat_detail, res.stat_detail_kor)
			//initiallize effect affay
			for (let e of res.statuseffect) {
				GAME.effect_status.push(false)
			}

			requestItemList()
			requestGlobalSetting()
		} catch (e) {
			console.error("Invaild string resource json format!")
		}
		return
	}
	request.send()
}

//WEBAPP INTERFACE
function backBtnPressed() {
	if (GAME.store_ui.isStoreOpen) {
		GAME.store_ui.closeStore()
	}
}

function registerSounds() {
	Howler.volume(VOLUME)
	const sounds = [
		"hit",
		"hit2",
		"basicattack",
		"curse",
		"dice",
		"subway-express",
		"subway-rapid",
		"ghost",
		"glassbreak",
		"gun",
		"heal",
		"knifeslash",
		"largeexplode",
		"lightning",
		"magic",
		"place",
		"revive",
		"roullete",
		"stab",
		"water",
		"trap",
		"wave",
		"web",
		"gold",
		"gold2",
		"store",
		"store2",
		"1r",
		"2r",
		"3r",
		"4r",
		"5r",
		"6r",
		"7r",
		"8r",
		"9r",
		"8r_hit",
		"judgement",
		"wind",
		"bird",
		"ignite",
		"tree_plant",
		"tree_plant_hit",
		"fruit_crush",
		"takemoney",
		"metal",
		"horse"
	]

	for (const sound of sounds) {
		GAME.sounds.set(
			sound,
			new Howl({
				src: ["res/sound/" + sound + ".mp3"]
			})
		)
	}
}

function auth() {
	$.ajax({
		method: "POST",
		url: "/room/game",
		data: {}
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

//when html document is loaded
$(document).ready(function () {
	auth()
	extendJqueryEasing()
	includeHTML()
	// GAME = new Game()

	window.onbeforeunload = function (e) {
		return ""
		sessionStorage.roomName = null
		// GAME.connection.resetGame()
		$.ajax({
			method: "POST",
			url: "/reset_game"
		})
		return true
	}
})
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

			while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
			return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2)
		}
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
//when all files including images are loaded
/**
 * window.onload -> socket.connect -> requestsetting -> initialsetting
 * -> initui -> requestobs -> requestitem -> requestmap -> drawboard
 * -> boardready -> setupcomplete -> startgame
 */
$(window).on("load", function (e) {
	GAME.onCreate()
	console.log("window onload")
	$("#loadingtext").html("CONNECTING WITH SERVER..")
	openConnection(true)
})

var isMapLoaded = false

function requestMap() {
	console.log("requestMap")
	$.ajax({
		url: "/resource/map",
		type: "GET",
		data: {
			rname: GAME.rname
		},
		success: function (data) {
			console.log("onMapRequestComplete")
			GAME.onMapRequestComplete()
			GAME.scene.setMap(JSON.parse(data))

			new Promise((resolve) => GAME.scene.drawboard(resolve))
				.then(() => {
					GAME.boardReady()
					isMapLoaded = true
				})
				.catch((e) => {
					console.log(e)
					isMapLoaded = false
				})
		},
		error: function (e) {
			console.log(e)
			isMapLoaded = true
		}
	})
}

export const GAME = new Game()

/**
 *  pos 가 가운데로 오게 보드 스크롤 이동
 * @param {} pos
 */
function moveBoard(pos, scale) {
	return

	scaleBoard(scale + 1)
	let x = pos.x - BOARD_MARGIN - (boardwidth - BOARD_MARGIN) / 2 / SIZE_RATIO[scale] + BOARD_MARGIN
	let y = pos.y - BOARD_MARGIN - (boardheight - BOARD_MARGIN) / 2 / SIZE_RATIO[scale] + BOARD_MARGIN

	$("#canvas-container").stop()

	setTimeout(() => $("#canvas-container").animate({ scrollTop: y, scrollLeft: x }, 400), 100)
}

/**
 *  pos 가 가운데로 오게 즉시 보드 스크롤 이동
 * @param {} pos
 */
function moveBoardInstant(pos, scale) {
	return

	$("#canvas-container").stop()

	let x = pos.x - BOARD_MARGIN - (boardwidth - BOARD_MARGIN) / 2 / SIZE_RATIO[scale] + BOARD_MARGIN
	let y = pos.y - BOARD_MARGIN - (boardheight - BOARD_MARGIN) / 2 / SIZE_RATIO[scale] + BOARD_MARGIN

	//	console.log("x" + Math.floor(x) + "  y" + Math.floor(y))
	GAME.ui.elements.board_container.scrollTo(x, y)
	setTimeout(() => scaleBoard(scale + 1), 100)
}

function includeHTML() {
	var z, i, elmnt, file, xhttp
	/* Loop through a collection of all HTML elements: */
	z = document.getElementsByTagName("*")
	for (i = 0; i < z.length; i++) {
		elmnt = z[i]
		/*search for elements with a certain atrribute:*/
		file = elmnt.getAttribute("w3-include-html")
		if (file) {
			/* Make an HTTP request using the attribute value as the file name: */
			xhttp = new XMLHttpRequest()
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						elmnt.innerHTML = this.responseText
					}
					if (this.status == 404) {
						elmnt.innerHTML = "Page not found."
					}
					/* Remove the attribute, and call this function once more: */
					elmnt.removeAttribute("w3-include-html")
					includeHTML()
				}
			}
			xhttp.open("GET", file, true)
			xhttp.send()
			/* Exit the function: */
			return
		}
	}
}
