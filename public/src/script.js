import { Scene, sleep,COLOR_LIST } from "./canvas_control.js"
import { COLOR_LIST_BG } from "./board.js"
import { Player } from "./player.js"
import { GAME,VOLUME,StringResource,registerSounds } from "./GameMain.js"

export class Game {
	constructor() {
		//singleton
		if (Game._instance) {
			return Game._instance
		}
		Game._instance = this

		this.turnsInUI = [] //turn 으로  ui 위치 찾을때 사용

		this.simulation = false

		this.thisturn = 0 //현재 턴
		this.isTeam = false
		this.playerCount = 0 //total number of player
		this.players = []
		this.strRes = new StringResource()
		this.scene
		this.LANG = sessionStorage.language
		this.shuffledObstacles
		this.sounds = new Map()
		this.begun = false
		this.map=0
		this.multikillimg=$(".multikillimg").toArray()

		this.multikillAlertTimeout=null
		this.killTextTimeout=null
		this.gestureController=new GestureController()
	}
	onCreate() {
		this.gestureController.addWheelEvent()
		this.gestureController.addTouchEvent()
		this.gestureController.addMouseEvent()
		$("#quit").click(()=>this.onQuit())

		$("#toggle_fullscreen").click(function(){
			if(!$(this).data("on")){
			  
			  document.documentElement.requestFullscreen()
			  $(this).data("on",true)
			}
			else {
			  document.exitFullscreen()
			  $(this).data("on",false)
			}
		  })
	}

	onDisconnect() {
	}

	tryReconnect() {
	}

	onQuit() {
		this.showDialog(
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
	
	showDialog(content,onconfirm,oncancel){
		$("#dialog p").html(content)
		$("#dialog .dialog_cancel").off()
		$("#dialog .dialog_confirm").off()
		$("#dialog .dialog_cancel").click(()=>{
			if(oncancel!=null) oncancel()
			$("#dialog").hide()
		})
		$("#dialog .dialog_confirm").click(()=>{
			if(onconfirm!=null) onconfirm()
			$("#dialog").hide()
		})
		$("#dialog").show()
	}

	extendTimeout() {
		//this.connection.extendTimeout()
	}

	turn2ui(turn) {
		return 0
		//return this.turnsInUI[turn]
	}
	updateTurn(t) {
		this.thisturn = t
		// this.thisui = this.turn2ui(t)
		// this.ismyturn = t === this.myturn
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
	isMyTeam(turn){
		return false
	}

	getPlayerColor(turn){
		if(!this.isTeam) return COLOR_LIST[turn]
		if(this.isMyTeam(turn)) return "blue"
		else return "red"
	}
	getPlayerLighterColor(turn){
		if(!this.isTeam) return COLOR_LIST_BG[turn]
		if(this.isMyTeam(turn)) return COLOR_LIST_BG[0]
		else return COLOR_LIST_BG[1]
	}
	async loadResource(){
		await this.requestObstacles()
		await this.requestItemList()
		await this.requestGlobalSetting()
		await this.requestVisualEffect()
		await this.requestStringRes()

		this.requestMap()
	}

	init(setting, turn, cturn) {
		this.begun = true
		this.map=setting.map
		// this.myturn = turn
		// this.crypt_turn = cturn


		// this.skill_description = setting[this.myturn].description
		this.playerCount = setting.playerSettings.length //total number of player

		//this.storeStatus.init(setting.gameSettings.itemLimit, setting.playerSettings[this.myturn].recommendedItem)

		// for (let i = 0; i < this.playerCount; ++i) {
		// 	this.ui.updatePlayerItems(i, this.arrayOf(-1, setting.gameSettings.itemLimit))
		// }
		// if (!setting.gameSettings.useAdditionalLife) {
		// 	this.storeStatus.hideLife()
		// }

		//this.gameSettings.autoNextTurnOnSilent = setting.gameSettings.autoNextTurnOnSilent
		//	this.gameSettings.autoNextTurnOnStore = setting.gameSettings.autoNextTurnOnStore

		this.isTeam = setting.isTeam
		this.shuffledObstacles = setting.shuffledObstacles
		for (let i = 0; i < setting.playerSettings.length; ++i) {
			let player=new Player(
				this,
				i,
				setting.playerSettings[i].champ,
				setting.playerSettings[i].team,
				setting.playerSettings[i].name
			)
			player.hp=setting.playerSettings[i].HP
			player.maxhp=setting.playerSettings[i].MaxHP

			this.players.push(player)

		//	if(i===this.myturn) this.skillScale=setting.playerSettings[i].skillScale

		}

		//this.ui.init(setting.playerSettings)
		//requestObstacles()
		registerSounds()
		
        this.loadResource()
	}
	onMapRequestComplete() {
		this.scene = null
		this.scene = new Scene(this)
		this.scene.players = this.players
	}
	changeShield(val) {
		//this.ui.changeShield(val.shield, val.turn)
		this.scene.changeShield(val.turn, val.shield, val.change, val.indicate)
	}
	sendMessage() {
	}

	receiveMessage(source, msg) {
		$("#chat_text").append(`<p><b class='chat_source'>${source}</b>:${msg}</p>`)
		$("#chat_text").scrollTop(900000)
	}
	mapLoadComplete() {
		setTimeout(() => $(".progress").hide(), 500)
		$("#loadingtext").html("")
		$("#loadingoverlay").hide()
		//this.connection.setupComplete()

		
		//this.ui.onGameReady()
		$(".start").show()
		this.scene.startRenderInterval()
	}

	getInventoryTooltip() {
		return ""
	}

	targetSelected(target, type) {
	}

	onNextTurn() {
	}

	onSkillBtnClick(val) {
	}
	onBasicAttackClick() {
	}
	onDiceBtnClick(dice) {
	}

	//t:{turn:number,stun:boolean}
	startTurn(turnUpdateData) {
	}

	//turn:number,stun:boolean
	showDiceBtn(t) {
	}

	manageStun() {
	}

	rollDice(dice,ismyturn) {
	//	console.log(dice)

		if (dice.turn === 0) {
			$("#killindicator_container").html("")
		}

		//$(".dc").css("visibility", "hidden")
		$("#arrow").hide()

		setTimeout(() => $("#adicewindow").css("visibility", "hidden"), 1500)

		// if (this.crypt_turn === dice.crypt_turn && !dice.died) {
		// 	this.store.disable()
		// 	this.store_ui.updateStoreBtnState()

		// 	// $(".storebtn").hide()
		// 	this.scene.shadow.set({ visible: false })
		// 	this.scene.shadow.sendToBack()

		// 	// $("#largetext").html("")
		// 	// $("#largekilltext").html("")
		// }

		if (dice === "stun" || !dice || dice.dice < 0) {
			return
		}
		if (dice.dcused) {
			this.android_toast(this.chooseLang("Dice Control!", "주사위 컨트롤!"))
		}
		
		this.animateDice(dice,ismyturn)
		
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

	async animateDice(dice,ismyturn) {
		$("#dice-container").css({ opacity: 1 })
		$("#dice-container").show()
		// let ui = this.turn2ui[dice.turn]
		let pos = { top: 0, left: 0 }
		if (ismyturn) pos = { top: "100%", left: "100%" }
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
	//depricated
	diceAnimation(dice) {
		return
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
	//depricated
	rollingDice(dice) {
		return
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
	//depricated
	setDice(dice) {
		return
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
		$("#dice-container").hide()
		if(dice.currpos===undefined) return
		// this.setDice(dice.dice)
		this.players[dice.turn].pos = dice.currpos + dice.actualdice
		this.scene.showPin(dice.currpos + dice.actualdice)
		this.scene.movePlayer(dice.actualdice, 1, dice.currpos, dice.turn)
	}
	smoothTeleport(turn, pos, distance) {
		console.log("smoothTeleport"+distance)
		console.log("pos"+pos)
		this.players[turn].pos = pos+distance
		this.scene.movePlayer(distance, 1, pos, turn)
	}
	moveComplete() {
		// $(".dicebtn").css("transform", "translate(0px,0px)")
		//if(end){return}

		// $(".dicebtn").hide()
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
	}

	onReceiveTarget(result) {
	}

	onReceiveGodhandTarget(targets) {
	}
	onReceiveChangeData(type, turn, data) {
		if (type === "kda") {
			this.changeKda(turn, data)
		}
		if (type === "removeEffect") {
			this.removeEffect(data, turn)
		}
		if (type === "appearance") {
			this.scene.updateCharacterApperance(data, turn)
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

	}
	animateDamage(data){
		this.scene.animateDamage(data) 
	}
	animateHeal(data){
		this.scene.animateHeal(data)
	}
	giveEffect(e, turn, num) {
		if (!this.players[turn].effect_status.has(e)) {
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
	}
		

	removeEffect(e, turn) {
		if (this.players[turn].effect_status.has(e)) {
			this.scene.toggleEffect(turn, e, false)
			this.players[turn].effect_status.delete(e)
		}
	}
	removeSpecialEffect(name) {
	}

	removeAllEffects(turn) {
		this.players[turn].effect_status.clear()

		this.scene.removeAllEffects(turn)
	}

	onTileSelectionCancel(type) {
	}

	onTileSelectionComplete(index, type) {
	}
	/**
	 * 타겟 혹은 타일 선택 준비시 호출
	 */
	prepareSelection() {
	}
	/**
	 * 타겟 또는 타일 선택 완료시ㅣ 호출
	 */
	endSelection() {
	}

	showRangeTiles(pos, range, size, type) {
	}
	onSkillCancel() {
	}

	syncPlayerVisibility(data) {
	}

	isEnemy(turn) {
		return true
	}

	onPlayerDie(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount,damages) {
		if (!this.players[turn].alive) return

		this.players[turn].alive = false
		this.scene.showCoffin(turn)
		this.scene.playerDeath(turn, spawnPos)
		// this.scene.hideEffectIndicators(turn)

		// if (turn === this.myturn) {
		// 	this.scene.canvas.bringToFront(this.scene.shadow)
		// 	this.scene.canvas.discardActiveObject()
		// 	this.scene.shadow.set({ visible: true })
		// }
		this.removeAllEffects(turn)
		this.indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount)

		// $(ui[this.turn2ui(turn)]).css({"background-color":"gray"})
	}

	openNewStore(data) {
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
	//	$(this.ui.elements.kdasections[turn]).css("background", "none")

	}
	changeKda(turn, str) {
		//$(this.ui.elements.kdainfos[turn]).html(str)
	}

	//주사위를 굴려 상점에 간 경우
	arriveStore(turn, storeData) {
		// if (turn === this.myturn) {
		// 	this.openNewStore(storeData)
		// }
	}
	updateMoney(val) {

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
	teleportPlayer(val){
		this.scene.teleportPlayer(val.turn, val.pos, val.movetype)
		this.updatePosition(val.turn,val.pos)
	}
	updatePosition(turn, pos) {
		this.players[turn].pos = pos
	}
	/**
	 * data: {turn,obs,globalEventName}
	 */
	onIndicateObstacle(data) {
	}
	onIndicateItem(turn, item) {
	}
	playObstacleSound(obs) {
	}

	hideEveryWindow() {
		//this.ui.hideAll()
		this.scene.resetTarget()
	//	this.ui.hideSkillCancel()
		this.scene.tileReset()
	//	this.ui.onTileReset()
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
	}
	getCharImgUrl(champ_id) {
		return "res/img/character/illust/" + this.strRes.GLOBAL_SETTING.characters[champ_id].illustdir
	}

	getChampImgofTurn(turn) {
		if (turn === -1) return "res/img/ui/obstacle.png"

		let player=this.players[turn]
		if(!player) return ""
		return this.getCharImgUrl(player.champ)
	}

	indicatePlayerDeath(turn, spawnPos,  skillfrom, isShutDown, killerMultiKillCount) {
		console.log("indicatePlayerDeath" + turn)
		if($(".killframe").length>3) $("#killindicator_container").html("")

		// $(this.elements.kdasections[turn]).css("background", "rgba(146, 0, 0, 0.5)")
		let good=true
		let str = "<div class='killframe "

		if (skillfrom === this.myturn) {
			str += "bluekill"
		} else if (skillfrom >= 0) {
			str += "redkill"
		} else if (skillfrom === -1) {
			str += "whitekill"
		}

		str += "'><div class='charframe' style='background:"
		if (skillfrom === -1) {
			str += "white"
		} else {
			str += this.getPlayerLighterColor(skillfrom)
		}

		str += ";'><img src='" + this.getChampImgofTurn(skillfrom) + "'>"

		str += "</div><img src='res/img/ui/kill.png'><div class='charframe2' style='background:"
		str += this.getPlayerLighterColor(turn)
		str += ";'><img src='" + this.getChampImgofTurn(turn) + "'></div></div><br>"

		$("#killindicator_container").append(str)

		let text = ""
		let largetext = false
		if (turn === this.myturn) {
			good=false
			text = this.chooseLang("You Died!", "적에게 당했습니다")

			if (skillfrom == -1) {
				text = this.chooseLang("Executed!", "처형되었습니다")
			}
			if (isShutDown) {
				text = this.chooseLang("Shut Down!", "제압되었습니다")

				largetext = false
			}
			switch (killerMultiKillCount) {
				case 1:
					break
				case 2:
					text = this.chooseLang("ENEMY DOUBLE KILL!", "적 더블킬")

					largetext = false
					break
				case 3:
					text = this.chooseLang("ENEMY TRIPLE KILL!", "적 트리플킬")
					largetext = true
					break
				case 4:
					text = this.chooseLang("ENEMY QUADRA KILL!", "적 쿼드라킬")
					largetext = true
					break
				case 5:
					text = this.chooseLang("ENEMY PENTA KILL!", "적 펜타킬")
					largetext = true
					break
				default:
					text = this.chooseLang("ENEMY IS LEGENDARY!", "적은 전설적입니다")

					largetext = true
					break
			}
			// if (largetext) {
			// 	$("#largekilltext").html(text)
			// } else {
			// 	$("#largetext").html(text)
			// }
		} else if (skillfrom === this.myturn) {
			
			text = this.chooseLang("You Slayed an Enemy", "적을 처치했습니다")

			this.android_toast(this.chooseLang("You Slayed an Enemy!<br>One more dice!", "적을 처치했습니다<br>주사위 한번더!"))
			if (isShutDown) {
				text = this.chooseLang("Shut Down!", "제압되었습니다")
				largetext = false
			}
			switch (killerMultiKillCount) {
				case 1:
					break
				case 2:
					text = this.chooseLang("DOUBLE KILL!", "더블킬")
					largetext = false
					break
				case 3:
					text = this.chooseLang("TRIPLE KILL!", "트리플킬")
					largetext = true
					break
				case 4:
					text = this.chooseLang("QUADRA KILL!", "쿼드라킬")
					largetext = true
					break
				case 5:
					text = this.chooseLang("PENTA KILL!", "펜타킬")

					largetext = true
					break
				default:
					text = this.chooseLang("LEGENDARY!", "전설의 출현!")

					largetext = true
					break
			}
			// if (largetext) {
			// 	$("#largekilltext").html(text)
			// } else {
			// 	$("#largetext").html(text)
			// }
		} else {
			//팀전이 아님
			text = this.chooseLang("Enemy", "적")

			//turn:dead player
			//skillfrom:killer
			//GAME.myturn: me
			if(this.isTeam){
				//아군이 죽음
				if (this.isMyTeam(turn)) {
					good=false
					text = this.chooseLang("Ally", "아군")

					if (killerMultiKillCount >= 2) {
						text = this.chooseLang("Enemy", "적")
					}
				}

				//아군이 죽임
				if (this.isMyTeam(skillfrom)) {
					text = this.chooseLang("Enemy", "적")

					if (killerMultiKillCount >= 2) {
						text = this.chooseLang("Ally", "아군")
					}
				}
			}

			//for replay
			if(this.myturn===undefined){
				text=String(turn+1)+"P"
				if (killerMultiKillCount >= 2)
					text=String(skillfrom+1)+"P"
			}
				

			if (skillfrom == -1) {
				text += this.chooseLang(" Executed!", "이(가) 처형되었습니다")
				killerMultiKillCount = 0
			}

			switch (killerMultiKillCount) {
				case 0:
					break
				case 1:
					if (isShutDown) {
						text += this.chooseLang(" Shut Down!", "이(가) 제압되었습니다")
						largetext = false
					} else {
						text += this.chooseLang(" died!", "이(가) 사망했습니다")
					}
					break
				case 2:
					text += this.chooseLang(" DOUBLE KILL!", " 더블킬")
					largetext = false
					break
				case 3:
					text += this.chooseLang(" TRIPLE KILL!", " 트리플킬")
					largetext = true
					break
				case 4:
					text += this.chooseLang(" QUADRA KILL!", " 쿼드라킬")
					largetext = true
					break
				case 5:
					text += this.chooseLang(" PENTA KILL!", " 펜타킬")

					largetext = true
					break
				default:
					text += this.chooseLang(" IS LEGENDARY!", "은(는) 전설적입니다!")

					largetext = true
					break
			}
			
		}
		if (largetext) {
			this.showMultiKillImg(skillfrom,killerMultiKillCount,text)
		} else {
			this.showKillText(skillfrom,turn,text,good)
		}



		// setTimeout(() => {
		// 	$("#largekilltext").html("")
		// 	$("#largetext").html("")
		// }, 2000)
	}
	showMultiKillImg(killer,count,text){
		$(".multikillimg").hide()
		$("#kill_text").hide()
		
		if(count>=5){
			$(this.multikillimg[0]).show()
		}
		if(count>=4){
			$(this.multikillimg[1]).show()
		}
		$(this.multikillimg[2]).show()
		// let charnames = ["reaper", "elephant", "ghost", "dinosaur", "sniper", "magician", "kraken", "bird", "tree"]
		$(".multikillchar").attr("src", this.getChampImgofTurn(killer))
		$("#largekilltext").removeClass('long')
		if(this.chooseLang(true,false)){
			$("#largekilltext").addClass('long')
		}
		$("#largekilltext").html(text)
		$("#multikill_indicator").show()
		clearTimeout(this.multikillAlertTimeout)
		this.multikillAlertTimeout=setTimeout(()=>$("#multikill_indicator").hide(),2500/this.speed)
	}
	showKillText(killer,dead,text,good){
		$("#largetext").html(text)
		$("#kill_text").removeClass('good')
		$("#kill_text").removeClass('bad')
		if(good){
			$("#kill_text").addClass('good')
		}
		else{
			$("#kill_text").addClass('bad')
		}
		$(".killtext_killerimg img").attr("src", this.getChampImgofTurn(killer))
		$(".killtext_deadimg img").attr("src", this.getChampImgofTurn(dead))
		$("#kill_text").show()
		clearTimeout(this.killTextTimeout)
		this.killTextTimeout=setTimeout(()=>$("#kill_text").hide(),2500/this.speed)
	}



	onGameOver(winner) {
		document.onbeforeunload = () => {}
		this.hideEveryWindow()
		this.scene.clearRenderInterval()

		$("#overlay").show()

	}

	subwayComplete(type) {
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
	
	requestMap() {

		console.log("requestMap")
		$.ajax({
			url: "/resource/map/"+this.map,
			type: "GET",
			success:  (data) =>{
				this.onMapRequestComplete()
				this.scene.setMap(JSON.parse(data))

				new Promise((resolve) => this.scene.drawboard(resolve))
					.then(() => {
						console.log("mapLoadComplete")
						this.mapLoadComplete()
					})
					.catch((e) => {
						console.log(e)
					})
			},
			error:  (e)=> {
				console.log(e)
			}
		})
	}
	onItemResponse(items){

	}
	
	requestItemList() {
		return new Promise((resolve,reject)=>{
			
			let itemrequest = new XMLHttpRequest()
			itemrequest.open("GET", `/resource/item`, true)
			itemrequest.onload = () =>{
				try {
					this.onItemResponse(JSON.parse(itemrequest.responseText))
					//	ItemList = JSON.parse(itemrequest.responseText)
					
					//	this.storeStatus.item = zeroArray(ItemList.items.length)
					//requestMap()
					resolve()
				} catch (e) {
					console.error(e)
					reject()
				}
			}
			itemrequest.send()
		})
	}

	requestGlobalSetting() {
		return new Promise((resolve,reject)=>{

			let request = new XMLHttpRequest()
			request.open("GET", `/resource/globalsetting`, true)
			request.onload = ()=> {
				try {
					//	ItemList = JSON.parse(itemrequest.responseText)
					this.strRes.GLOBAL_SETTING = JSON.parse(request.responseText)
					resolve()
				} catch (e) {
					console.error(e)
					reject()
				}
			}
			request.send()
		})
	}


	requestObstacles() {
		return new Promise((resolve,reject)=>{
			let request = new XMLHttpRequest()

			request.open("GET", this.chooseLang("/resource/obstacle?lang=eng", "/resource/obstacle?lang=kor"), true)
			request.onload =  ()=> {
				try {
					//obstacleList = JSON.parse(request.responseText)
					this.strRes.OBSTACLES = JSON.parse(request.responseText)
		
					//requestStringRes()
					resolve()
				} catch (e) {
					console.error("Invaild obstacle json format!")
					reject()
				}
				return
			}
			request.send()
		})
		

		
	}

	requestVisualEffect() {
		return new Promise((resolve,reject)=>{
			let request2 = new XMLHttpRequest()
			request2.open("GET", `/resource/visualeffects`, true)
			request2.onload =  () =>{
				try {
					this.strRes.VISUAL_EFFECTS = JSON.parse(request2.responseText)
					resolve()
				} catch (e) {
					console.error(e)
					reject()
				}
			}
			request2.send()
		})
	}

	requestStringRes() {
		return new Promise((resolve,reject)=>{


			let request = new XMLHttpRequest()

			request.open("GET", "/resource/string_resource?lang="+this.chooseLang("eng","kor"), true)
			request.onload =  ()=> {
				try {
					//	obstacleList = JSON.parse(request.responseText)
					let res = JSON.parse(request.responseText)
					this.strRes.STATS = res.stat
					this.strRes.SCALE_NAMES = res.scale_stat
					this.strRes.EFFECTS = res.statuseffect
					this.strRes.TRIAL_LABELS = res.triallabel
					this.strRes.CASINO_LABELS = res.casinolabel
					this.strRes.STAT_DETAIL = res.stat_detail
					this.strRes.GLOBAL_OBSTACLE_EVENT=res.globalObstacleEvent
		
					// requestItemList()
					// requestGlobalSetting()
					resolve()
				} catch (e) {
					console.error("Invaild string resource json format!")
					reject()
				}
				return
			}
			request.send()
		})
	}

}
class GestureController{

	constructor(){
		
		this.lastZoomScale = null
		this.waitingDoudleClick = false
		this.mousePosX = 0
		this.mousePosY = 0
		this.clicked = false //for drag check
		
		this.board_container= document.getElementById("canvas-container")
		this._boardside= document.getElementById("boardside")
	}

	addWheelEvent() {
		// wheelzoom(document.getElementById("board"), {zoom:0.05});
		// return
		document.getElementById("boardwrapper").addEventListener(
			"wheel",
			function (event) {
				event.preventDefault()

				let rect = document.getElementById("boardwrapper").getBoundingClientRect()
				let originX = Math.max((this.mousePosX - rect.left) / rect.width, 0)
				let originY = Math.max((this.mousePosY - rect.top) / rect.height, 0)
				if (event.deltaY < 0) {
					GAME.scene.zoomOut(0.05, originX, originY)
				} else if (event.deltaY > 0) {
					GAME.scene.zoomIn(0.05, originX, originY)
				}
			}.bind(this)
		)
		document.getElementById("board").addEventListener("wheel", function (event) {
			event.preventDefault()
		})
		this._boardside.addEventListener(
			"mousemove",
			function (coord) {
				this.mousePosX = coord.pageX
				this.mousePosY = coord.pageY
			}.bind(this)
		)
	}

	addTouchEvent() {
		let board_container = this.board_container
		this._boardside.addEventListener(
			"touchstart",
			function (click_pos) {
				this.clicked = true

				let origX = click_pos.changedTouches[0].pageX + board_container.scrollLeft
				let origY = click_pos.changedTouches[0].pageY + board_container.scrollTop

				if (this.waitingDoudleClick && click_pos.targetTouches.length === 1) {
					//double touch
					this.waitingDoudleClick = false
					if(GAME.myturn!==undefined)
						GAME.scene.moveBoardToPlayer(GAME.myturn)
					this.clicked = false
				} else if (click_pos.targetTouches.length === 1) {
					this.waitingDoudleClick = true
					setTimeout((() => (this.waitingDoudleClick = false)).bind(this), 150)
				}

				this.lastZoomScale = 0

				this._boardside.addEventListener(
					"touchmove",
					function (e) {
						if (e.targetTouches.length === 2) {
							let l = this.lastZoomScale
							let gesturedata = this.gesturePinchZoom(e)
							if (!gesturedata) return

							let rect = document.getElementById("boardwrapper").getBoundingClientRect()
							let originX = Math.max((gesturedata.originX - rect.left) / rect.width, 0)
							let originY = Math.max((gesturedata.originY - rect.top) / rect.height, 0)

							if (gesturedata.zoom > 0.4) {
								GAME.scene.zoomIn(0.07, originX, originY)
							} else if (gesturedata.zoom < -0.4) {
								GAME.scene.zoomOut(0.07, originX, originY)
							}
						} else {
							if (!this.clicked) return
							let curX = e.changedTouches[0].pageX + board_container.scrollLeft
							let diffX = origX - curX

							let curY = e.changedTouches[0].pageY + board_container.scrollTop
							let diffY = origY - curY

							board_container.scrollBy(diffX, diffY)
						}
					}.bind(this),
					false
				)
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"touchend",
			function () {
				this.lastZoomScale = null
				this.clicked = false
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"touchcancel",
			function () {
				this.lastZoomScale = null
				this.clicked = false
			}.bind(this),
			false
		)
	}
	gesturePinchZoom(event) {
		let zoom = false

		if (event.targetTouches.length === 2) {
			let p1 = event.targetTouches[0]
			let p2 = event.targetTouches[1]
			let zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)) //euclidian distance
			let centerX = (p2.pageX + p1.pageX) / 2
			let centerY = (p2.pageY + p1.pageY) / 2
		//	let origin = GAME.scene.pagePosToTransformOrigin(centerX, centerY)

			if (this.lastZoomScale !== null) {
				zoom = zoomScale - this.lastZoomScale
			}

			this.lastZoomScale = zoomScale
			return {
				zoom: zoom,
				originX: centerX,
				originY: centerY
			}
		}
		return null
	}

	addMouseEvent() {
		let board_container = this.board_container
		this._boardside.addEventListener(
			"mousedown",
			function (click_pos) {
				let origX = click_pos.pageX + board_container.scrollLeft
				let origY = click_pos.pageY + board_container.scrollTop
				this.clicked = true
				if (this.waitingDoudleClick) {
					this.waitingDoudleClick = false
					if(GAME.myturn!==undefined)
						GAME.scene.moveBoardToPlayer(GAME.myturn)
					this.clicked = false
				} else {
					this.waitingDoudleClick = true
					setTimeout(() => this.waitingDoudleClick = false, 150)
				}
				this._boardside.addEventListener(
					"mousemove",
					function (coord) {
						if (!this.clicked) return
						let curX = coord.pageX + board_container.scrollLeft
						let diffX = origX - curX

						let curY = coord.pageY + board_container.scrollTop
						let diffY = origY - curY

						board_container.scrollBy(diffX, diffY)
						//console.log("x" + Math.floor(board_container.scrollLeft) + "  y" + Math.floor(board_container.scrollTop))

					}.bind(this),
					false
				)
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"mouseup",
			function (e) {
				this.clicked = false
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"mouseleave",
			function (e) {
				this.clicked = false
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"mouseout",
			function (e) {
				this.clicked = false
			}.bind(this),
			false
		)
	}

	
}