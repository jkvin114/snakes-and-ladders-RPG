import { Game } from "./script.js"
import { StoreStatus, StoreInstance, StoreInterface } from "./store.js"
import GameInterface from "./gameinterface.js"
import { openConnection } from "./gameclient.js"

export class PlayableGame extends Game {
	constructor(is_spectator) {
		super()
		this.is_spectator = is_spectator
		this.thisui = 0 //현제 턴의 ui
		this.skillstatus = null //쿨타임, 침묵 등 스킬관련 정보 저장
		this.gameSettings = {
			//	autoNextTurnOnStore: false,
			autoNextTurnOnSilent: true,
		}
		this.ismyturn = false //자신의 턴인지
		this.myturn = 0 //내 턴 , -1 if spectator mode
		this.crypt_turn = "" //encrypted my turn, "" if spectator mode
		this.rname = sessionStorage.roomName //방제
		this.godhandtarget = -1 //신의손 대상 저장용

		this.dice_clicked = false //주사위 클릭했지
		this.myStat = {}
		this.onMainWay = true //메인 길에 있는지
		this.diceControl = false //주컨 사용가능여부

		this.pendingSelection = { type: "", name: "" }
		this.ui
		this.storeStatus

		this.subwayPrices = [0, 50, 100]
		this.subwayTicket = -1
		this.connection
		this.store
		this.store_ui
		this.speed = 1
		this.skillScale = {}
	}
	onCreate() {
		$("#loadingtext").html("CONNECTING WITH SERVER..")
		openConnection(true)

		this.ui = new GameInterface(this)
		this.ui.onCreate()
		this.storeStatus = new StoreStatus()
		this.store = new StoreInstance(this.storeStatus)
		this.store_ui = new StoreInterface(this.storeStatus, this.store)
		this.ui.addKeyboardEvent()
		this.ui.addChatDragEvent()
		super.onCreate()
	}

	onDisconnect() {
		this.showDialog(
			this.chooseLang("Unable to connect server, do you wish to reconnect?", "서버 연결 불가, 재접속 하시겠습니까?"),
			() => this.tryReconnect(),
			() => this.onQuit()
		)
	}

	tryReconnect() {
		$.ajax({
			url: "http://" + sessionStorage.ip_address + "/connection_check",
			type: "GET",
			success: function () {
				//	openConnection(false)
			},
			error: (e) => {
				this.onDisconnect()
			},
		})
	}
	extendTimeout() {
		this.connection.extendTimeout()
	}
	turn2ui(turn) {
		return this.turnsInUI[turn]
	}
	updateTurn(t) {
		super.updateTurn(t)
		this.thisui = this.turn2ui(t)
		this.ismyturn = t === this.myturn
	}
	isMyTeam(turn) {
		if (turn < 0) return false
		return this.isTeam && this.players[turn].team === this.players[this.myturn].team
	}
	init(setting, turn, cturn) {
		super.init(setting, turn, cturn)

		// this.begun = true
		this.myturn = turn

		this.crypt_turn = cturn

		// this.skill_description = setting[this.myturn].description
		//this.playerCount = setting.playerSettings.length //total number of player
		if (this.myturn >= 0)
			this.storeStatus.init(setting.gameSettings.itemLimit, setting.playerSettings[this.myturn].recommendedItem)

		for (let i = 0; i < this.playerCount; ++i) {
			this.ui.updatePlayerItems(i, this.arrayOf(-1, setting.gameSettings.itemLimit))
		}
		if (!setting.gameSettings.useAdditionalLife) {
			this.storeStatus.hideLife()
		}

		this.gameSettings.autoNextTurnOnSilent = setting.gameSettings.autoNextTurnOnSilent
		for (let i = 0; i < setting.playerSettings.length; ++i) {
			if (i === this.myturn) this.skillScale = setting.playerSettings[i].skillScale
		}

		this.ui.init(setting.playerSettings)
		//requestObstacles()
		//registerSounds()
	}
	setItemStatus(items) {
		for (let i = 0; i < items.length; ++i) {
			this.ui.updatePlayerItems(i, items[i])
		}
	}
	changeShield(val) {
		super.changeShield(val)
		this.ui.changeShield(val.shield, val.turn)
		//this.scene.changeShield(val.turn, val.shield, val.change, val.indicate)
	}

	sendMessage() {
		window.scrollTo(0, 0)
		let msg = $("#text").val()
		$("#chat_enter").css("visibility", "hidden")
		if (msg === "") {
			return
		}
		$("#text").val("")
		this.connection.sendChat(this.myturn, msg)
	}
	mapLoadComplete() {
		super.mapLoadComplete()
		this.connection.setupComplete()

		this.ui.onGameReady()
	}
	getInventoryTooltip() {
		let text = "<img src='res/img/store/life.png'><a> x" + (this.storeStatus.life + 1) + "</a> <br> "

		if (this.scene.mapname === "casino") {
			text += "<img src='res/img/store/token.png'> <a>x" + this.storeStatus.token + "</a>"
		}
		return text
	}
	targetSelected(target, type) {
		////console.log("targetselected" + target)
		this.scene.resetTarget()
		this.ui.hideSkillCancel()
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
		if (!this.dice_clicked) {
			this.connection.pressDice(dice)
			// document.getElementById('sound_dice').play()
		}
		this.ui.hideDeathInfo()
		this.dice_clicked = true
	}

	startTurn(turnUpdateData) {
		// if (!isMapLoaded) {
		// 	this.android_toast("Error while loading the map, please reconnect.")
		// }
		this.updateTurn(turnUpdateData.turn)

		this.ui.hideSkillBtn()
		this.ui.highlightUI(turnUpdateData.turn)

		this.showDiceBtn(turnUpdateData)
	}
	//turn:number,stun:boolean
	showDiceBtn(t) {
		if (t.crypt_turn === this.crypt_turn) this.scene.moveBoardToPlayer(t.turn)

		this.scene.showArrow(t.turn)
		this.dice_clicked = false

		this.ui.showChangeDiceInfo(t)
		//주사위 변화 표시
		if (t.stun) {
			this.manageStun()
		} else if (t.crypt_turn === this.crypt_turn) {
			//console.log(t.avaliablepos)
			if (t.dc) {
				this.scene.possiblePosList = t.avaliablepos
			}

			$("#largedicebtn").show()
			$(".dcbtn .cooltime").html("x")
			if (this.myStat.level < this.scene.Map.dc_limit_level) {
				this.diceControl = t.dc
				// $(".dc").css("visibility", "visible")

				if (!t.dc) {
					$(".dcbtn").attr("disabled", true)
					$(".dcbtn").addClass("unavaliable")
					//  $("#dicecontrolbtn").css({ filter: "grayscale(100%)" })
				} else {
					$(".dcbtn").attr("disabled", false)
					$(".dcbtn").removeClass("unavaliable")
					//  $("#dicecontrolbtn").css({ filter: "grayscale(0%)" })
				}
				//		//console.log(t)
				if (t.dc_cool === 0) {
					$(".dcbtn .cooltime").html("x")
				} else {
					$(".dcbtn .cooltime").html(String(t.dc_cool))
				}
			} else {
				$(".dcbtn").attr("disabled", true)
				$(".dcbtn").addClass("unavaliable")
			}
		}
	}
	manageStun() {
		if (this.ismyturn) {
			this.dice_clicked = false
			$("#largedicestun").show()
		}

		const time = 300

		setTimeout(
			function () {
				$("#largedicestun").hide()
			}.bind(this),
			time
		)
	}
	rollDice(dice) {
		// $(".dc").css("visibility", "hidden")
		$(".dcbtn").attr("disabled", true)
		$(".dcbtn").addClass("unavaliable")
		if (this.crypt_turn === dice.crypt_turn && !dice.died) {
			this.store.disable()
			this.store_ui.updateStoreBtnState()

			// $(".storebtn").hide()
			this.scene.shadow.set({ visible: false })
			this.scene.shadow.sendToBack()

			// $("#largetext").html("")
			// $("#largekilltext").html("")
		}

		super.rollDice(dice, dice.turn === this.myturn)
	}
	onSkillAvaliable(status) {
		this.ui.showSkillBtn(status)
		this.scene.showArrow(status.turn)
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

		//console.log(result)
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
		super.onReceiveChangeData(type, turn, data)

		if (type === "isInSubway") {
			this.players[turn].isInSubway = data
		}
		if (type === "dc_item") {
			this.scene.indicateDcItem(turn, data)
		}
		if (type === "appearance") {
			this.ui.updateCharacterApperance(data, turn)
		}
		if (type === "item") {
			this.ui.updatePlayerItems(turn, data)
		}
		if (type === "reconnect") {
			this.ui.playerReconnect(turn, this.players[turn].name)
		}
		if (type === "disconnect") {
			this.ui.playerDisconnect(turn, this.players[turn].name)
		}
		if (type === "itemData") {
			this.updateItemData(turn, data)
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
				//	//console.log(amt)
				// this.ui.changeItemToast()
				break
			case "subwayTicket":
				this.subwayTicket = data
				break
			case "removeSpecialEffect":
				console.log("removeSpecialEffect")
				console.log(data)
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
	updateItemData(turn, itemData) {
		for (const data of itemData) {
			let it = this.strRes.ITEMS.items[data.item]
			let str = `<p class='item-tooltip-data'>${this.chooseLang(data.eng, data.kor)}<b>${data.val}</b></p>`
			this.strRes.ITEM_DATA[turn].set(it, str)
		}
	}
	animateDamage(data) {
		super.animateDamage(data)
		this.ui.changeHP(data.turn, data.currhp, data.currmaxhp)
		if (data.turn === this.myturn) {
			this.ui.lostHP(Math.max(0, data.currhp), data.change)
		}
	}
	animateHeal(data) {
		super.animateHeal(data)

		this.ui.changeHP(data.turn, data.currhp, data.currmaxhp)
		if (data.turn === this.myturn) {
			this.ui.lostHP(Math.max(0, data.currhp), data.change)
		}
	}
	giveEffect(e, turn, num) {
		if (!this.players[turn].effect_status.has(e)) {
			super.giveEffect(e, turn, num)
			if (turn === this.myturn) {
				this.ui.addEffect(e)
			}
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
		name = name.replaceAll(" ", "_")
		let desc = this.chooseLang(data.desc, data.desc_kor)
		//if the effect is currently not applied or has different description, update the effect icon
		if (
			(this.myturn >= 0 && !this.players[this.myturn].effect_status.has(name)) ||
			this.strRes.SPECIAL_EFFECTS.get(name)[0] !== desc
		) {
			$(".se_" + String(name)).remove()
			//console.log("apply"+name)
			if (data.type === "item") {
				this.ui.addItemSpecialEffect(name, data.item_id, data.isgood)
				this.strRes.SPECIAL_EFFECTS.set(name, [desc, data.item_id])
			} else {
				this.ui.addSpecialEffect(name, data.src, data.isgood)
				this.strRes.SPECIAL_EFFECTS.set(name, [desc, sourcePlayer])
			}

			this.players[this.myturn].effect_status.add(name)
		}
	}
	removeEffect(e, turn) {
		if (this.players[turn].effect_status.has(e)) {
			super.removeEffect(e, turn)
			if (turn === this.myturn) {
				$("#e" + String(e)).remove()
			}
		}
	}
	removeSpecialEffect(name) {
		name = name.replaceAll(" ", "_")
		if (this.myturn >= 0 && this.players[this.myturn].effect_status.has(name)) {
			$(".se_" + String(name)).remove()
			//console.log("remove "+name)
			this.players[this.myturn].effect_status.delete(name)
			this.strRes.SPECIAL_EFFECTS.delete(name)
		}
	}
	removeAllEffects(turn) {
		super.removeAllEffects(turn)
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
				complete: false,
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
		this.ui.onTileReset()
		this.endSelection()
	}
	onTileSelectionComplete(index, type) {
		//console.log("tileselected" + type + " " + index)

		if (type === "godhand") {
			let godhand_info = {
				complete: true,
				objectResult: {
					target: this.godhandtarget,
					location: index,
				},
				type: "godhand",
			}
			//	//console.log("godhand location selected" + godhand_info)
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
				complete: true,
			})
		}

		// $("#largetext").html("")
		$("#selectionname").html("").hide()
		$("#selectiondesc").html("").hide()

		this.ui.onTileReset()
		// this.endSelection()
	}
	/**
	 * 타겟 혹은 타일 선택 준비시 호출
	 */
	prepareSelection() {
		//	moveBoardInstant(this.scene.getPlayerPos(this.myturn), 1)
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
		this.ui.hideSkillCancel()
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
	onPlayerDie(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount, damages) {
		if (!this.players[turn].alive) return
		super.onPlayerDie(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount, damages)

		if (turn === this.myturn) {
			this.scene.canvas.bringToFront(this.scene.shadow)
			this.scene.canvas.discardActiveObject()
			this.scene.shadow.set({ visible: true })
			this.ui.showDeathInfo(skillfrom, damages)
		}
		//this.ui.indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount)
	}
	openNewStore(data) {
		this.storeStatus.set(data)
		this.store = new StoreInstance(this.storeStatus)
		this.store_ui.storeInstance = this.store
		this.store_ui.openNewStore(data)
	}
	playerRespawn(turn, respawnPos, isRevived) {
		super.playerRespawn(turn, respawnPos, isRevived)
		$(this.ui.elements.kdasections[turn]).css("background", "none")
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
		}
		super.updateMoney(val)
	}
	/**
	 * data: {turn,obs,globalEventName}
	 */
	onIndicateObstacle(data) {
		if (this.myturn === data.turn || data.turn === -1) {
			if (!data.globalEventName) this.ui.showObsNotification(data.obs)
			else {
				this.ui.showObsNotification(data.obs, this.strRes.GLOBAL_OBSTACLE_EVENT[data.globalEventName])
			}
		}
		this.playObstacleSound(data.obs)
	}
	onIndicateItem(turn, item) {
		//console.log("onIndicateItem")
		if (this.is_spectator) return

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
		super.hideEveryWindow()
		this.ui.hideAll()
		//this.scene.resetTarget()
		this.ui.hideSkillCancel()
		//this.scene.tileReset()
		this.ui.onTileReset()
		//$("#randomobs").hide()
	}
	roulleteEnd() {
		super.roulleteEnd()
		if (this.ismyturn) {
			this.connection.roulleteComplete()
		}
	}
	onGameOver(winner) {
		super.onGameOver(winner)

		if (this.myturn < 0) {
			this.android_toast("Game over")
			return
		}
		if (this.myturn === winner) {
			$(".victory").show()
		} else if (this.isTeam && this.players[this.myturn].team === this.players[winner].team) {
			$(".victory").show()
		} else {
			$(".defeat").show()
		}
	}
	subwayComplete(type) {
		$("#subwaywindow").css("visibility", "hidden")
		this.playSound("store")
		//console.log("subway" + type)
		this.subwayTicket = type
		this.connection.sendSubwayType({
			type: "subway",
			complete: true,
			objectResult: {
				type: type,
				price: this.subwayPrices[type],
			},
		})
	}
	indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount) {
		this.ui.indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount)
		super.indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount)
	}

	onItemResponse(items) {
		this.strRes.ITEMS = items
		this.sortItems()
		this.store_ui.initStoreHome()
	}

	getItemByCatAndLevel(cat, level) {
		return this.strRes.ITEMS.items
			.filter((item) => {
				return item.category.includes(cat) && item.itemlevel === level
			})
			.map((item) => item.id)
	}

	sortItems() {
		let sorted = new Map() //<string,int[]>
		for (let i = 0; i < 3; ++i) {
			let lvl = String(i + 1)
			sorted.set("attack_lv" + lvl, this.getItemByCatAndLevel("attack", i + 1))
			sorted.set("magic_lv" + lvl, this.getItemByCatAndLevel("magic", i + 1))
			sorted.set("defence_lv" + lvl, this.getItemByCatAndLevel("defence", i + 1))
			sorted.set("health_lv" + lvl, this.getItemByCatAndLevel("health", i + 1))
			sorted.set("utility_lv" + lvl, this.getItemByCatAndLevel("utility", i + 1))
		}
		this.strRes.ITEMS_SORTED = sorted
		this.storeStatus.setItemList(this.strRes.ITEMS.items, sorted)
	}
}
