import { GAME } from "./GameMain.js"
import { COLOR_LIST_BG } from "./canvas_control.js"

export default class GameInterface {
	constructor(game) {
		if (GameInterface._instance) {
			return GameInterface._instance
		}
		GameInterface._instance = this
		this.obsNoti1 = new ObsNotification(".obs_notification1")
		this.obsNoti2 = new ObsNotification(".obs_notification2")
		this.winwidth = window.innerWidth
		this.winheight = window.innerHeight
		this.isSpectator = game.is_spectator
		this.game = game
		this.nextTurnBtnShown = false
		this.skillBtnShown = false
		this.messageBtnShown = false

		this.lastZoomScale = null
		this.waitingDoudleClick = false
		this.mousePosX = 0
		this.mousePosY = 0
		this.clicked = false //for drag check
		this.chat_hidden = false

		//important,repetedly used DOM elements
		this.elements = {
			hpframe: $(".hpframe").toArray(),
			hpspan: $(".hp").toArray(),
			shieldframe: $(".shieldframe").toArray(),
			otherui: $(".otherui_new").toArray(),
			otherchar: $(".otherchar").toArray(),
			charimgs: $(".char").toArray(),
			hpis: $(".hpi").toArray(),
			nameis: $(".namei").toArray(),
			skillbtns: $(".skillbtn").toArray(),
			effects: $(".effect").toArray(),
			skillinfoimgs: $(".skillinfoimg").toArray(),
			skillinfos: $(".skillinfo").toArray(),
			kdasections: $(".kdasection").toArray(),
			kdaimgs: $(".kdaimg").toArray(),
			kdainfos: $(".kdainfo").toArray(),
			kdanames: $(".kdaname").toArray(),
			iteminfosections: $(".itemsection").toArray(),
			timeoutBar: $("#timeoutbar"),
			board_container: document.getElementById("canvas-container"),
			_boardside: document.getElementById("boardside"),
			multikillimg: $(".multikillimg").toArray(),
		}
		Object.freeze(this.elements)
	}

	onCreate() {
		$("#prediction-close").click(function () {
			if ($(this).hasClass("opened")) {
				$(this).removeClass("opened")
				$(this).addClass("closed")
				$("#prediction-container").css({ right: "-200px" }, 1)
			} else {
				$(this).addClass("opened")
				$(this).removeClass("closed")
				$("#prediction-container").css({ right: "0" }, 1)
			}
		})

		$("#hide").click(function () {
			if (GAME.ui.chat_hidden) {
				$("#chat").css({ height: "150px", width: "200px", border: "none" })
				GAME.ui.chat_hidden = false
			} else {
				$("#chat").css({
					height: "50px",
					width: "100px",
					border: "2px solid black",
				})

				GAME.ui.chat_hidden = true
			}
			$("#writemessage").toggle()
		})

		$("#skillinfobtn").click(function () {
			$("#infowindow").css("visibility", "visible")
		})
		$("#closeskillinfobtn").click(function () {
			$("#infowindow").css("visibility", "hidden")
		})

		$("#dialog").hide()

		if (this.isSpectator) {
			$(".myui_new").hide()
			$("#otherui_container").hide()
			$("#skillbtncontainer").hide()
			return
		}

		$("#deathinfo-btn").html(GAME.PAGELOCALE.deathinfo.name)
		let subwaynames = $(".subway_name").toArray()
		$(subwaynames[0]).html(GAME.chooseLang("Local Train", "완행"))
		$(subwaynames[1]).html(GAME.chooseLang("Rapid Train", "급행"))
		$(subwaynames[2]).html(GAME.chooseLang("Express Train", "특급 급행"))
		let subwaydescs = $(".subway_desc").toArray()
		$(subwaydescs[0]).html(GAME.chooseLang("4 stops until next store", "다음 상점까지 4정거장(턴)"))
		$(subwaydescs[1]).html(GAME.chooseLang("2 stops until next store", "다음 상점까지 2정거장(턴)"))
		$(subwaydescs[2]).html(GAME.chooseLang("0 stops until next store", "다음 상점까지 0정거장(턴)"))
		$("#subway_footer").html(
			GAME.chooseLang(
				"Can buy tickets on credit, Basic attack damage decreases by 40% in subway",
				"티켓 값 외상 가능, 지하철에서는 기본공격 피해 40% 감소"
			)
		)

		$(".nextturnbtn").click(function () {
			if ($(this).hasClass("unavaliable")) return
			//if(GAME.ui.nextTurnBtnShown)
			GAME.onNextTurn()
		})

		$("#skillcancel").click(function () {
			GAME.onSkillCancel()
		})

		$(".skillbtn").click(function () {
			if (!GAME.ui.skillBtnShown || $(this).hasClass("unavaliable")) return

			let val = Number($(this).attr("value"))
			GAME.onSkillBtnClick(val)
			//console.log("skill")
		})
		$(".basicattackbtn").click(function () {
			if ($(this).hasClass("unavaliable")) return

			GAME.onBasicAttackClick()
			//console.log("ba")
		})

		$("#reload").click(function () {
			if (GAME.ui.nextTurnBtnShown || GAME.ui.skillBtnShown) {
				return
			}
			//	GAME.connection.reloadGame(Number(sessionStorage.turn))
			//	//console.log("reload")
		})

		$("#writemessage").click(function () {
			$("#chat_enter").css("visibility", "visible")
			$("#text").focus()
			GAME.ui.messageBtnShown = true
		})

		$(".roullete_end").click(function () {
			setTimeout(roulleteEnd, 6000)
		})

		// $(".start").click(function () {
		// 	$(this).hide()
		// 	GAME.connection.startSimulation()
		// })
		$("#toggle_otherui").click(function () {
			$("#otheruis").toggle()
			if ($(this).hasClass("otherui_hidden")) {
				$(this).removeClass("otherui_hidden")
			} else {
				$(this).addClass("otherui_hidden")
			}
		})
		$("#sendmessage").click(function () {
			GAME.sendMessage()
		})

		$("#select h3").html(GAME.PAGELOCALE.select)
		if (GAME.LANG === "kor") {
			// $(".skillinfo").css("font-size", "1.6rem")
		}

		$("#skillinfobtn").click(function () {
			$("#infowindow").css("visibility", "visible")
		})
		$("#closeskillinfobtn").click(function () {
			$("#infowindow").css("visibility", "hidden")
		})

		// $('[data-toggle="tooltip"]').tooltip()

		$("#largedicebtn").bind("click", function () {
			//clearInterval(GAME.diceHighlightInterval)
			$("#largedicebtn").hide()
			// $("#largedicebtnimg").show()
			//$("#largedicebtn_pressed").show()
			//setTimeout(()=>$("#largedicebtn_pressed").hide(),500)
			GAME.onDiceBtnClick(-1)
		})

		$(".dcbtn").click(function () {
			if (!GAME.diceControl || $(this).hasClass("unavaliable")) {
				return
			}
			GAME.dice_clicked = true
			// $(".dc").css("visibility", "hidden")
			$(".dcbtn .cooltime").html("x")
			$(".dcbtn").attr("disabled", true)
			$(".dcbtn").addClass("unavaliable")
			$("#diceselection").show()
			$("#largedicebtn").hide()
			$("#diceselection").animate({ right: "30px" }, 300)
			GAME.scene.showPossiblePos()
		})
		$(".diceselection").click(function () {
			$("#diceselection").animate({ right: "-300px" }, 300)
			setTimeout(() => $("#diceselection").hide(), 400)
			//		//console.log("dc" + Number($(this).val()))

			//	clearInterval(GAME.diceHighlightInterval)
			// $("#largedicebtn").stop().css({ outline: "none" })
			$("#largedicebtn").hide()
			// $("#largedicebtnimg").show()
			GAME.dice_clicked = false
			GAME.onDiceBtnClick(Number($(this).val()))
			GAME.scene.hidePossiblePos()
		})

		$(".overlaySelectorimg").click(function () {
			GAME.targetSelected(Number($(this).val()), false)
			$("#overlaySelector").html("")
		})

		$(".subway_select").click(function () {
			GAME.subwayComplete(Number($(this).val()))
		})

		$(".effect_tooltip").click(function () {
			$(".effect_tooltip").css("visibility", "hidden")
		})

		$(".specialeffect_tooltip").click(function () {
			$(".specialeffect_tooltip").css("visibility", "hidden")
		})

		$("#close_stat_tooltip,.stat_tooltip").click(function () {
			$(".stat_tooltip").css("visibility", "hidden")
		})
		$("#close_inventory_tooltip,.inventory_tooltip").click(function () {
			$(".inventory_tooltip").css("visibility", "hidden")
		})

		$("#show_stat").click(function () {
			$(".stat_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())
			//$("#stat_content").html(GAME.getStatToast())
		})

		$("#show_items").click(function () {
			$(".inventory_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())

			$("#inventory_content").html(GAME.getInventoryTooltip())
		})

		$("#selecttruebutton").click(() => this.selected(true))
		$("#selectfalsebutton").click(() => this.selected(false))

		$("#deathinfo-btn").click(() => {
			$("#deathinfo").toggle()
		})
	}

	/**
	 * show obstacle notification
	 * @param {*} obs id of obstacle
	 * @param {*} text alternate text
	 */
	showObsNotification(obs, text) {
		let opentime = 400
		let duration = 4000
		let gouptime = 200

		//단순 돈은 알림표시 안함
		if (obs <= 3) return
		let yOffset = window.matchMedia("(orientation: portrait)").matches ? 0 : 0
		if (this.obsNoti1.position === 0 && this.obsNoti2.position === 0) {
			this.obsNoti1.write(obs, 1, text)
			//write noti1
			$(this.obsNoti1.name).css({ bottom: 4 + yOffset + "px", left: "-400px" })
			clearTimeout(this.obsNoti1.timeout)
			$(this.obsNoti1.name).animate({ left: "5px" }, opentime)
			this.obsNoti1.position = 1
			this.obsNoti1.timeout = setTimeout(
				(() => {
					$(this.obsNoti1.name).css({ left: "-400px" })
					this.obsNoti1.position = 0
				}).bind(this),
				duration
			)
		} else if (this.obsNoti2.position === 0 || this.obsNoti2.position === 2) {
			//write noti2
			this.obsNoti2.write(obs, 2, text)

			$(this.obsNoti2.name).css({ bottom: 4 + yOffset + "px", left: "-400px" })

			$(this.obsNoti1.name).animate({ bottom: 95 + yOffset + "px" }, gouptime)
			this.obsNoti1.position = 2
			clearTimeout(this.obsNoti2.timeout)
			$(this.obsNoti2.name).animate({ left: "5px" }, opentime)
			this.obsNoti2.position = 1
			this.obsNoti2.timeout = setTimeout(
				(() => {
					$(this.obsNoti2.name).css({ left: "-400px" })
					this.obsNoti2.position = 0
				}).bind(this),
				duration
			)
		} else if (this.obsNoti1.position === 2 || this.obsNoti2.position === 1) {
			//write noti1 again
			this.obsNoti1.write(obs, 1, text)

			$(this.obsNoti1.name).css({ bottom: 4 + yOffset + "px", left: "-400px" })

			$(this.obsNoti2.name).animate({ bottom: 95 + yOffset + "px" }, gouptime)
			this.obsNoti2.position = 2
			clearTimeout(this.obsNoti1.timeout)
			$(this.obsNoti1.name).animate({ left: "5px" }, opentime)
			this.obsNoti1.position = 1
			this.obsNoti1.timeout = setTimeout(
				(() => {
					$(this.obsNoti1.name).css({ left: "-400px" })
					this.obsNoti1.position = 0
				}).bind(this),
				duration
			)
		}
	}

	addKeyboardEvent() {
		document.addEventListener(
			"keydown",
			((event) => {
				const keyName = event.key
				if (keyName === "Enter") {
					if (this.messageBtnShown) {
						GAME.sendMessage()
						this.messageBtnShown = false
					} else if (this.nextTurnBtnShown) {
						GAME.onNextTurn()
					}
				}
				if (keyName === "a" && this.skillBtnShown) {
					GAME.onBasicAttackClick()
				}
				if (keyName === "q" && this.skillBtnShown) {
					GAME.onSkillBtnClick(1)
				}
				if (keyName === "w" && this.skillBtnShown) {
					GAME.onSkillBtnClick(2)
				}
				if (keyName === "e" && this.skillBtnShown) {
					GAME.onSkillBtnClick(3)
				}
				if (keyName === "Tab") {
					$("#infowindow").css("visibility", "visible")
					event.preventDefault()
				}
			}).bind(this)
		)
		document.addEventListener("keyup", (event) => {
			const keyName = event.key
			if (keyName === "Tab") {
				$("#infowindow").css("visibility", "hidden")
				event.preventDefault()
			}
		})
	}
	hideChat() {
		$("#chat").css({ height: "50px", width: "100px", border: "2px solid black" })

		this.chat_hidden = true

		$("#writemessage").hide()
	}
	//add drag event for chat window move
	addChatDragEvent() {
		let element = $("#movechat")
		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0
		let chat = document.getElementById("chat")
		element.on(
			"touchstart",
			function (coord) {
				coord = coord || window.event

				coord.preventDefault()
				// get the mouse cursor position at startup:
				pos3 = coord.changedTouches[0].pageX
				pos4 = coord.changedTouches[0].pageY

				element.on("touchend", function () {
					// stop moving when mouse button is released:
					element.off("touchend")
					element.off("touchmove")
					element.off("cancel")
				})
				element.on("touchcancel", function () {
					// stop moving when mouse button is released:
					element.off("touchend")
					element.off("touchmove")
					element.off("cancel")
				})
				// call a function whenever the cursor moves:
				element.on(
					"touchmove",
					function (coord) {
						coord = coord || window.event
						coord.preventDefault()

						// calculate the new cursor position:
						pos1 = pos3 - coord.changedTouches[0].pageX
						pos2 = pos4 - coord.changedTouches[0].pageY
						pos3 = coord.changedTouches[0].pageX
						pos4 = coord.changedTouches[0].pageY

						let marginY = this.chat_hidden ? 60 : 150
						let marginX = this.chat_hidden ? 100 : 230

						// set the element's new position:
						chat.style.top = Math.max(10, Math.min(chat.offsetTop - pos2, this.winheight - marginY + 100)) + "px"
						chat.style.left = Math.max(0, Math.min(chat.offsetLeft - pos1, this.winwidth - 170 + 100)) + "px"
					}.bind(this)
				)
			}.bind(this)
		)

		$(element).on(
			"mousedown",
			function (coord) {
				coord = coord || window.event

				coord.preventDefault()
				// get the mouse cursor position at startup:
				pos3 = coord.pageX
				pos4 = coord.pageY

				$(element).on("mouseup", function () {
					// stop moving when mouse button is released:
					element.off("mouseup")
					element.off("mouseleave")
					element.off("mousemove")
					element.off("mouseout")
				})
				$(element).on("mouseleave", function () {
					// stop moving when mouse button is released:
					element.off("mouseup")
					element.off("mouseleave")
					element.off("mousemove")
					element.off("mouseout")
				})
				$(element).on("mouseout", function () {
					// stop moving when mouse button is released:
					element.off("mouseup")
					element.off("mouseleave")
					element.off("mousemove")
					element.off("mouseout")
				})
				// call a function whenever the cursor moves:
				$(element).on(
					"mousemove",
					function (coord) {
						coord = coord || window.event
						coord.preventDefault()

						// calculate the new cursor position:
						pos1 = pos3 - coord.pageX
						pos2 = pos4 - coord.pageY
						pos3 = coord.pageX
						pos4 = coord.pageY

						let marginY = this.chat_hidden ? 60 : 150
						let marginX = this.chat_hidden ? 100 : 230

						// set the element's new position:
						chat.style.top = Math.max(10, Math.min(chat.offsetTop - pos2, this.winheight - marginY + 200)) + "px"
						chat.style.left = Math.max(0, Math.min(chat.offsetLeft - pos1, this.winwidth - 170 + 200)) + "px"
					}.bind(this)
				)
			}.bind(this)
		)
	}

	timeoutStart(time) {
		if (this.is_spectator) return
		//	//console.log("timeoutstart")
		this.elements.timeoutBar.css("width", "0")
		this.elements.timeoutBar.animate(
			{
				width: "100%",
			},
			time,
			"linear"
		)
	}
	timeoutStop() {
		//	//console.log("timeoutstop")
		this.elements.timeoutBar.css("width", "0")
		this.elements.timeoutBar.stop()
	}

	init(setting, simulation = false) {
		//console.log("initui")
		$("#loadingtext").html("LOADING THE MAP..")

		for (let i = 0; i < GAME.playerCount; ++i) {
			$(this.elements.kdainfos[i]).html("0/0/0")
			$(this.elements.kdanames[i]).html(setting[i].name)
			$(this.elements.kdanames[i]).css("color", this.game.getPlayerLighterColor(i))
		}

		$("#skillinfobtn").show()
		if (GAME.playerCount < 4) {
			$(this.elements.kdasections[3]).hide()
		}
		if (GAME.playerCount < 3) {
			$(this.elements.kdasections[2]).hide()
		}

		if (this.isSpectator) return
		//==============================================================================
		if (GAME.playerCount > 2) {
			$(this.elements.otherui[1]).show()
		}
		if (GAME.playerCount > 3) {
			$(this.elements.otherui[2]).show()
		}

		if (GAME.myturn >= 0) $(this.elements.kdasections[GAME.myturn]).addClass("myturn")

		let othercount = 1

		for (let i = 0; i < GAME.playerCount; ++i) {
			if (setting[i].turn === GAME.myturn) {
				$(this.elements.nameis[0]).html(setting[i].name)
				$(this.elements.hpis[0]).html(setting[i].HP + "/" + setting[i].MaxHP)

				GAME.turnsInUI.push(0)
			} else {
				$(this.elements.nameis[othercount]).html(setting[i].name)
				$(this.elements.hpis[othercount]).html(setting[i].HP + "/" + setting[i].MaxHP)

				GAME.turnsInUI.push(othercount)
				othercount += 1
			}
			$(this.elements.hpspan[this.game.turn2ui(i)]).addClass(this.game.getPlayerColor(setting[i].turn))

			this.changeHP(i, setting[i].HP, setting[i].MaxHP)
		}
		GAME.thisui = GAME.turnsInUI[0]
		//console.log("initui")
		if (GAME.myturn >= 0) this.setDefaultSkillImgs(GAME.myturn, setting[GAME.myturn].champ)
	}
	onGameReady() {
		for (let i = 0; i < GAME.playerCount; ++i) {
			this.setCharacterDefaultApperance(i, GAME.players[i].champ)
		}
	}

	/**
	 * set skill images to default
	 */
	setDefaultSkillImgs(turn, champ) {
		//skill btn and skill description
		for (let j = 0; j < 3; ++j) {
			$(this.elements.skillbtns[j])
				.children("img")
				.attr("src", "res/img/skill/" + (champ + 1) + "-" + (j + 1) + ".jpg")

			$(this.elements.skillinfoimgs[j]).attr("src", "res/img/skill/" + (champ + 1) + "-" + (j + 1) + ".jpg")
		}
	}
	showPrediction(probs, diffs) {
		$("#prediction-container").show()
		let str = ""

		for (let i = 0; i < this.game.playerCount; i++) {
			console.log(probs)
			str += `
			<div class="prediction ${diffs[i] == 0 ? "nochange" : ""} ${i == this.game.myturn ? "me" : ""}">
				<img src="${this.game.getChampImgofTurn(i)}" style="border: 2px solid ${this.game.getPlayerLighterColor(i)};">
				<b class="prediction-prob">${probs[i]}%</b>
				<img class='change-img' src="res/img/svg/skillinfo/${diffs[i] > 0 ? "up" : "down"}.png">
				<b class="prediction-diff ${diffs[i] > 0 ? "good" : "bad"}">${
				diffs[i] == 0 ? "-" : "" + (diffs[i] > 0 ? "+" : "") + diffs[i] + "%"
			}</b>
			</div>`
		}
		$("#prediction").html(str)
	}
	updateSkillImg(data) {
		let champ = data.champ
		let skill_id = data.skill
		let skill_name = data.skill_name

		let src = ""
		//default skill img
		if (skill_name === "") {
			src = champ + 1 + "-" + (skill_id + 1) + ".jpg"
		} else if (skill_name === "bird_r_q") {
			src = "8-1-1.jpg"
		} else if (skill_name === "tree_wither_r") {
			src = "9-3-1.jpg"
		} else {
			return
		}
		// $(this.elements.skillbtns[skill_id]).css({
		// 	background: "url(res/img/skill/" + src + ")",
		// 	"background-size": "100%",
		// 	border: "3px solid rgb(122, 235, 255);"
		// })
		$(this.elements.skillbtns[skill_id])
			.children("img")
			.attr("src", "res/img/skill/" + src)

		$(this.elements.skillinfoimgs[skill_id]).attr("src", "res/img/skill/" + src)
	}
	/**
	 * set character image to default
	 * @param {} i
	 * @param {*} champ
	 */
	setCharacterDefaultApperance(i) {
		// let charnames = ["reaper", "elephant", "ghost", "dinosaur", "sniper", "magician", "kraken", "bird", "tree"]
		// if (champ < 0 || champ > charnames.length - 1) return
		$(this.elements.charimgs[this.game.turn2ui(i)]).attr("src", this.game.getChampImgofTurn(i))
		$(this.elements.kdaimgs[i]).attr("src", this.game.getChampImgofTurn(i))
	}

	updateCharacterApperance(data, turn) {
		if (data === "") {
			this.setCharacterDefaultApperance(turn)
		}
		if (data === "bird_r") {
			$(this.elements.charimgs[GAME.turn2ui(turn)]).attr("src", "res/img/character/bird_r.png")
			$(this.elements.kdaimgs[turn]).attr("src", "res/img/character/bird_r.png")
		}
		if (data === "elephant_r") {
			$(this.elements.charimgs[GAME.turn2ui(turn)]).attr("src", "res/img/character/knight_r.png")
			$(this.elements.kdaimgs[turn]).attr("src", "res/img/character/knight_r.png")
		}
		if (data === "tree_low_hp") {
			$(this.elements.charimgs[GAME.turn2ui(turn)]).attr("src", "res/img/character/tree_low_hp.png")
			$(this.elements.kdaimgs[turn]).attr("src", "res/img/character/tree_low_hp.png")
		}
	}

	updateSkillInfo(info_kor, info_eng) {
		for (let i = 0; i < info_kor.length; ++i) {
			$(this.elements.skillinfos[i]).html(
				(i === 0 ? "" : "<hr>") + SkillInfoParser.parse(GAME.chooseLang(info_eng[i], info_kor[i]))
			)
		}
		this.addEffectTooltipEvent()
		this.addSkillScaleTooltipEvent()
	}
	addSkillScaleTooltipEvent() {
		$(".scaled_value").off()
		$(".scaled_value").mouseenter(function (e) {
			if ($(this).offset().left > window.innerWidth / 2) {
				$(".skill_scale_tooltip").addClass("rightside")
			} else $(".skill_scale_tooltip").removeClass("rightside")

			$(".skill_scale_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())

			GAME.ui.setSkillScaleTooltip($(this).attr("value"))
		})
		$(".scaled_value").mouseleave(function (e) {
			$(".skill_scale_tooltip").css("visibility", "hidden")
		})
		$(".scaled_value").on("touchstart", function (e) {
			$(".skill_scale_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())
			GAME.ui.setSkillScaleTooltip($(this).attr("value"))
		})
	}
	setSkillScaleTooltip(name) {
		let scale = GAME.skillScale[name]

		if (!scale) {
			$(".skill_scale_tooltip p").html("??")
			return
		}
		let str = `${scale.base}`
		for (const s of scale.scales) {
			let name = this.game.LOCALE.scale_stat[s.ability]
			//console.log(name)
			if (name === undefined) name = s.ability

			str += `<a class=${s.ability}>(+${s.val}${name})</a>`
		}
		$(".skill_scale_tooltip p").html(str)
	}
	showBasicAttackBtn(count, isAvailable) {
		$(".basicattackbtn").show()
		$(".basicattackbtn").addClass("unavaliable")
		if (isAvailable && count > 0) {
			$(".basicattackbtn").removeClass("unavaliable")
		}
		$(".basicattack_count a").html(count)
	}

	showSkillBtn(status) {
		//console.log("show skill btn turn:" + status.turn)
		// $(".storebtn").show()

		// $(".nextturnbtn").show()
		this.nextTurnBtnShown = true
		$(".nextturnbtn").attr("disabled", false)
		$(".nextturnbtn").removeClass("unavaliable")
		// if (status.dead) {
		// 	return
		// }

		GAME.skillstatus = status

		//$(".skillbtn button").attr("disabled", false)

		//  if(skillcount===4 || players[thisturn].effects[3]>0)
		// if (status.silent > 0 || status.dead) {
		// 	//silent or dead
		// 	return
		// }
		if (status.basicAttackType === "ranged") {
			$(".basicattackbtn").children("img").attr("src", "res/img/ui/basicattack-ranged.png")
		}
		// $(".storebtn").hide()
		// $(".skillbtn").show()
		this.showBasicAttackBtn(status.basicAttackCount, status.canBasicAttack)
		if (status.canUseSkill) {
			this.skillBtnShown = true
			$(".skillbtn").removeClass("unavaliable")
		}

		this.updateSkillBtnStatus(status)
	}

	updateSkillBtnStatus(status) {
		for (let i = 0; i < 3; ++i) {
			$(this.elements.skillbtns[i]).children(".duration_mask").remove()
			$(this.elements.skillbtns[i]).children(".cooltime_mask").remove()

			if (status.cooltime[i] === 0) {
				$(this.elements.skillbtns[i]).children(".cooltime").html("")
				//	$(this.elements.skillbtns[i]).html("&nbsp;")
				if (status.duration[i] > 0) {
					$(this.elements.skillbtns[i]).addClass("activated")
				} else {
					$(this.elements.skillbtns[i]).removeClass("activated")
				}
			} else {
				if (status.duration[i] === 0) {
					//console.log(status.cooltimeratio[i])
					$(this.elements.skillbtns[i]).append(`<div class="cooltime_mask" style=" background:
					 conic-gradient(rgba(0,0,0,0.0) 0% ,rgba(0,0,0,0.0) ${100 - status.cooltimeratio[i] * 100}%,rgba(255, 255, 255, 0.6) 
					 ${100 - status.cooltimeratio[i] * 100}%,rgba(255, 255, 255, 0.6) 100%); "></div>  `)

					$(this.elements.skillbtns[i]).children(".cooltime").html(status.cooltime[i])
				}
				if (status.duration[i] > 0) {
					$(this.elements.skillbtns[i]).addClass("activated")
				} else {
					$(this.elements.skillbtns[i]).removeClass("activated")
					$(this.elements.skillbtns[i]).addClass("unavaliable")
				}
			}
			if (status.duration[i] > 0) {
				//console.log(status.duration[i])//${status.duration[i]*100}
				$(this.elements.skillbtns[i]).append(`<div class="duration_mask" style="background: 
				conic-gradient(rgba(0,0,0,0.6) 0% ,rgba(0,0,0,0.6) ${100 - status.duration[i] * 100}%,rgba(0, 0, 0, 0) ${
					100 - status.duration[i] * 100
				}%,rgba(0, 0, 0, 0) 100%);"></div>  `)
			}
		}
		if (status.level < 3) {
			$(this.elements.skillbtns[2]).addClass("unavaliable")
			if (status.level < 2) {
				$(this.elements.skillbtns[1]).addClass("unavaliable")
			}
		}
	}

	hideSkillBtn() {
		$(".status").html("")
		$(".basicattackbtn").hide()
		// $(".skillbtn").hide()
		$(".skillbtn button").attr("disabled", true)
		$(".nextturnbtn").attr("disabled", true)
		$(".nextturnbtn").addClass("unavaliable")
		$(".skillbtn").addClass("unavaliable")
		this.nextTurnBtnShown = false
		this.skillBtnShown = false
	}
	hideAll() {
		this.timeoutStop()
		$(".mystatus").show()
		$("#selectionname").hide()
		$("#selectiondesc").hide()
		$("#cancel_tileselection").hide()
		$("#skillcancel").hide()
		$("#confirm_tileselection").hide()
		$("#largedicebtn").hide()
		$(".dcbtn").attr("disabled", true)
		$(".dcbtn").addClass("unavaliable")
		$("#diceselection").hide()
		$("#sell_token").hide()
		$("#casino").hide()
		$("#select").hide()
		$(".overlay").hide()
		$("#overlaySelector").html("")
		this.hideSkillBtn()
		//	clearInterval(GAME.diceHighlightInterval)
	}

	highlightUI(t) {
		for (let i = 0; i < GAME.playerCount; ++i) {
			if (i === GAME.thisui) {
				if (i === 0) $(".mydisplay").addClass("highlight")
				else $(this.elements.otherchar[i - 1]).addClass("highlight")
				// $(this.elements.otherchar[i - 1]).css("outline", "2px solid white")
			} else {
				if (i === 0) $(".mydisplay").removeClass("highlight")
				else $(this.elements.otherchar[i - 1]).removeClass("highlight")
				// $(this.elements.otherchar[i - 1]).css("outline", "1px solid black")
			}
		}
	}

	changeShield(shield, target) {
		let ui = GAME.turn2ui(target)
		shield = Math.max(shield, 0)

		if (ui === 0) {
			let hp = $(".myhp-val").data("hp")
			let maxhp = $(".myhp-val").data("maxhp")

			$(".myshield").css({
				width: String(shield) + "px",
				left: String(hp) + "px",
			})
			// $("#effects").css("left", String(0.8 * shield + 30) + "px")
			if (shield <= 0) {
				// $(".myshieldframe-container").hide()
				$(".myhp-val").html(hp + "/" + maxhp)
				$(".myhp-val").data("shield", 0)
				$(".myhp").removeClass("withshield")
			} else {
				this.setMyMaxhpSpace(maxhp + shield)
				// $(".myshieldframe-container").css("display", "inline-block")
				$(".myhp-val").html(
					$(".myhp-val").data("hp") +
						"/" +
						$(".myhp-val").data("maxhp") +
						`
					(+${shield})`
				)
				$(".myhp-val").data("shield", shield)
				$(".myhp").addClass("withshield")
			}
		} else {
			$(this.elements.shieldframe[ui]).css({
				width: String(0.2 * shield) + "px",
			})
			if (shield <= 0) {
				$(this.elements.shieldframe[ui]).hide()
				$(this.elements.hpis[ui]).html(
					$(this.elements.hpis[ui]).data("hp") + "/" + $(this.elements.hpis[ui]).data("maxhp")
				)
				$(this.elements.hpis[ui]).data("shield", 0)
			} else {
				$(this.elements.shieldframe[ui]).css("display", "inline-block")
				$(this.elements.hpis[ui]).html(
					$(this.elements.hpis[ui]).data("hp") +
						"/" +
						$(this.elements.hpis[ui]).data("maxhp") +
						`
				(+${shield})`
				)
				$(this.elements.hpis[ui]).data("shield", shield)
			}

			// let name = $(this.elements.hpis[ui]).html()
			// let s = name.match(/\([+0-9]+\)/)
			// //console.log(s)
			// if (!s) {
			// 	$(this.elements.hpis[ui]).html(name + ` (+${Math.floor(shield)})`)
			// } else if (shield === 0) {
			// 	$(this.elements.hpis[ui]).html(name.replace(/\([+0-9]+\)/, ""))
			// } else {
			// 	$(this.elements.hpis[ui]).html(name.replace(/(?<=\(\+)[0-9]+/, shield))
			// }
		}
	}
	setMyMaxhpSpace(maxhp) {
		$(this.elements.hpframe[0]).css({
			width: String(maxhp) + "px",
		})
		let space = window.innerWidth - 80

		if (maxhp > space) {
			$(".myhpframe-container").css({
				transform: "scale(" + space / maxhp + ",1)",
			})
		}
	}
	lostHP(hp, change) {
		if (change < 0) {
			setTimeout(function () {
				$(".myhp_lost").animate(
					{
						width: String(hp) + "px",
					},
					500
				)
			}, 500)
		} else {
			$(".myhp_lost").css({
				width: String(hp) + "px",
			})
		}
	}
	changeHP(target, hp, maxhp) {
		hp = Math.max(hp, 0)

		let ui = GAME.turn2ui(target)
		if (ui === 0) {
			$(this.elements.hpspan[ui]).css({
				width: String(hp) + "px",
			})

			$(".myhp-val").data("hp", hp)
			$(".myhp-val").data("maxhp", maxhp)
			let shield = $(".myhp-val").data("shield")
			let str = hp + "/" + maxhp
			if (!shield) shield = 0
			else {
				str += "(+" + shield + ")"
				$(".myshield").css({
					left: String(hp) + "px",
				})
			}

			this.setMyMaxhpSpace(maxhp + shield)

			$(this.elements.hpis[ui]).html(str)

			$(".myhp-val").html(str)
		} else {
			$(this.elements.hpframe[ui]).css({
				width: String(0.2 * maxhp) + "px",
			})

			$(this.elements.hpspan[ui]).css({
				width: String(0.2 * hp) + "px",
			})
			let space = 170
			if (window.matchMedia("(orientation: portrait)").matches) {
				space = 100
			}
			if (maxhp < 250) space /= 2
			// if(maxhp >= 800){
			$(this.elements.hpspan[ui]).css({
				transform: "scale(" + (5 * space) / maxhp + ",1)",
			})
			$(this.elements.hpframe[ui]).css({
				width: String(space) + "px",
			})
			// }

			$(this.elements.hpis[ui]).data("hp", hp)
			$(this.elements.hpis[ui]).data("maxhp", maxhp)
			// let shield = $(this.elements.hpis[ui])
			// .html()
			// .match(/\([+0-9]+\)/)
			let shield = $(this.elements.hpis[ui]).data("shield")
			// let str = $(this.elements.hpis[ui])
			// 	.html()
			// 	.replace(/\s\([+0-9]+\)/, shield ? shield[0] : "")
			// 	.replace(/[0-9]+(?=\/)/, String(Math.floor(hp)))
			// 	.replace(/(?<=\/)[0-9]+/, String(Math.floor(maxhp)))
			let str = hp + "/" + maxhp
			if (!!shield) str += "(+" + shield + ")"
			$(this.elements.hpis[ui]).html(str)
		}
	}
	updatePlayerItems(turn, items) {
		let text = ""
		for (let i = 0; i < items.length; ++i) {
			let it = items[i]
			// if(i>0 && i%6==0)
			// 	text+='<br>'
			if (it >= 0) {
				text += `<div class='otherplayeritemimg player_item' value='${String(it)}' data-owner=${turn}>
					<img src='res/img/store/items.png' style='margin-left:${-1 * it * 100}px'; > </div>`
			} else {
				text += "<div class=otherplayeritemimg><img src='res/img/store/emptyslot.png'> </div>"
			}
		}
		$(this.elements.iteminfosections[turn]).html(text)
		this.addItemTooltipEvent()
	}
	/**
	 * register item tooltip event
	 */
	addItemTooltipEvent() {
		$(".player_item").off()
		$(".player_item").mouseenter(function (e) {
			let left = $(this).offset().left
			let top = $(this).offset().top
			let offsetX = 40
			let offsetY = 40
			if ($(this).offset().left > window.innerWidth / 2) {
				offsetX = -200
			}
			if ($(this).offset().top > window.innerHeight / 2) {
				// offsetY=-150
			}

			// .css($(this).offset())
			const id = Number($(this).attr("value"))
			const itemlocale = GAME.LOCALE.item[id]
			const item = GAME.strRes.ITEMS.items[id]
			let owner = $(this).data("owner")
			$(".item_tooltip h4").html(itemlocale.name)
			$(".item_tooltip p").html(GAME.ui.getItemDescription(item) + GAME.ui.getItemData(owner, item))
			left += offsetX
			top += offsetY
			let maxtop = window.innerHeight - $(".item_tooltip").height() - 10
			let maxleft = window.innerWidth - $(".item_tooltip").width() - 10
			$(".item_tooltip").css({
				visibility: "visible",
				left: Math.min(maxleft, Math.max(0, left)),
				top: Math.min(maxtop, Math.max(0, top)),
			})
		})
		$(".player_item").mouseleave(function (e) {
			$(".item_tooltip").css("visibility", "hidden")
		})
	}
	/**
	 * get item description for tooltip
	 * @param {*} item
	 * @returns
	 */
	getItemDescription(item) {
		let ability = ""
		for (let a of item.ability) {
			let ab = "<a class=ability_name>" + this.game.LOCALE.stat[a.type] + "</a> +" + a.value

			if (a.type === "addMdmg" || a.type === "skillDmgReduction" || a.type === "absorb" || a.type === "obsR") {
				ab += "%"
			}
			ability += ab
			ability += "<br>"
		}

		const id = item.id

		if (item.hasPassive) {
			ability += `<b class=unique_effect_name>[${GAME.PAGELOCALE.item.passive}]</b>:
				${this.game.LOCALE.item[id].unique_effect}`
			if (item.active_cooltime != null) {
				ability += `(${GAME.PAGELOCALE.item.cool} ${item.active_cooltime} ${GAME.PAGELOCALE.item.turn})`
			}
		}
		ability += `<br><br>${GAME.PAGELOCALE.item.price}: <b class=price>` + String(item.price) + "</b>"
		return ability
	}
	/**
	 * get otem data for tooltip
	 * @param {*} owner
	 * @param {*} item
	 */
	getItemData(owner, item) {
		if (!this.game.strRes.ITEM_DATA[owner].has(item)) {
			return ""
		}
		return "<hr>" + this.game.strRes.ITEM_DATA[owner].get(item)
	}
	showSelection(type, name) {
		GAME.pendingSelection.type = type
		GAME.pendingSelection.name = name
		if (name === "kidnap") {
			$("#selectfalsebutton").html(GAME.PAGELOCALE.selection.kidnap1)
			$("#selecttruebutton").html("HP -300")
		} else if (name === "threaten") {
			$("#selectfalsebutton").html("-50$")
			$("#selecttruebutton").html("Coin -3")
		} else if (name === "ask_way2") {
			$("#selecttruebutton").html(GAME.PAGELOCALE.selection.way2_up)
			$("#selectfalsebutton").html(GAME.PAGELOCALE.selection.way2_down)
		}
		$("#select").show()
	}

	showChangeDiceInfo(t) {
		if (!t.stun) {
			let info = ""
			$("#adiceinfo").css("color", "#C1FFD7")

			if (t.adice !== 0) {
				info = (t.adice < 0 ? " " : " +") + t.adice
			}
			if (t.effects.some((e) => e === "doubledice")) {
				info += " (x2)"
			}
			if (t.effects.some((e) => e === "backdice")) {
				info += " (back)"
				$("#adiceinfo").css("color", "red")
			}
			if (t.effects.some((e) => e === "badluck")) {
				info = "cursed!"
				$("#adiceinfo").css("color", "red")
			}
			if (t.effects.some((e) => e === "subway")) {
				info = "Subway"
			}
			if (info !== "") {
				$("#adiceinfo").html(info)
				$("#adicewindow").css("visibility", "visible")
			}
		}
	}

	hideSkillCancel() {
		$("#skillcancel").hide()
		$("#godhandcancel").hide()
		$("#cancel_tileselection").hide()
		//$(".storebtn").show()
	}
	disableAllSkillBtn() {
		$(".skillbtns button").attr("disabled", true)
		$(".nextturnbtn").attr("disabled", true)
		$(".nextturnbtn").addClass("unavaliable")
	}

	onTileReset() {
		//$(".storebtn").show()
		$("#cancel_tileselection").hide()
		$("#confirm_tileselection").hide()
		$("#cancel_tileselection").off()
		$("#confirm_tileselection").off()
	}
	addEffect(e) {
		$("#effects").append(
			`<a style="background:url('res/img/status_effect/effects.png') -${String(25 * e)}px 0"
			 class=effect value='${String(e)}' id='e${String(e)}'></a>`
		)

		this.addEffectTooltipEvent()
	}

	addItemSpecialEffect(name, item_id, isgood) {
		$("#effects").append(
			`<div class='specialeffect ${isgood ? "good" : ""} se_${String(name)}'  value='${String(name)}' >
			<img src='res/img/store/items_small.png' style='margin-left: ${-1 * item_id * 25}px'; >
		</div>`
		)

		this.addSpecialEffectTooltipEvent()
	}

	addSpecialEffect(name, src, isgood) {
		$("#effects").append(
			`<img src="./res/img/${src}" class="specialeffect ${isgood ? "good" : ""} se_${String(name)}" value='${String(
				name
			)}'>`
		)
		this.addSpecialEffectTooltipEvent()
	}
	/**
	 * register item tooltip event
	 */
	addSpecialEffectTooltipEvent() {
		$(".specialeffect").off()
		$(".specialeffect").mouseenter(function (e) {
			$(".effect_tooltip").css("visibility", "hidden")
			if ($(this).offset().left > window.innerWidth / 2) {
				$(".specialeffect_tooltip").addClass("rightside")
			} else $(".specialeffect_tooltip").removeClass("rightside")
			$(".specialeffect_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())

			GAME.ui.setSpecialEffectTooltip($(this).attr("value"))
		})
		$(".specialeffect").mouseleave(function (e) {
			$(".specialeffect_tooltip").css("visibility", "hidden")
		})
		$(".specialeffect").on("touchstart", function (e) {
			$(".effect_tooltip").css("visibility", "hidden")
			$(".specialeffect_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())
			GAME.ui.setSpecialEffectTooltip($(this).attr("value"))
		})
	}

	setSpecialEffectTooltip(name) {
		let data = GAME.strRes.SPECIAL_EFFECTS.get(name)
		if (!data) return
		//item
		if (typeof data[1] === "number") {
			$(".specialeffect_tooltip h4").html(GAME.LOCALE.item[data[1]].name)
		} //effect with source player
		else if (data[1] !== "") {
			$(".specialeffect_tooltip h4").html(GAME.PAGELOCALE.effectsource + ": " + data[1])
		} else {
			$(".specialeffect_tooltip h4").html("")
		}
		$(".specialeffect_tooltip p").html(data[0])
	}

	setEffectTooltip(e) {
		//console.log(e)
		e = Number(e)
		let desc = GAME.LOCALE.statuseffect[e]
		if (!desc.match(/\[.+\]/)) {
			$(".effect_tooltip h4").addClass("bad")
			$(".effect_tooltip h4").html(desc.match(/\{.+\}/)[0])
		} else {
			$(".effect_tooltip h4").removeClass("bad")
			$(".effect_tooltip h4").html(desc.match(/\[.+\]/)[0])
		}

		$(".effect_tooltip p").html(desc.match(/(?<=[\]\}]).+/)[0])
	}
	/**
	 * register item tooltip event
	 */
	addEffectTooltipEvent() {
		$(".effect, .info_effect").off()
		$(".effect, .info_effect").mouseenter(function (e) {
			if ($(this).offset().left > window.innerWidth / 2) {
				$(".effect_tooltip").addClass("rightside")
			} else $(".effect_tooltip").removeClass("rightside")

			$(".specialeffect_tooltip").css("visibility", "hidden")
			$(".effect_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())

			GAME.ui.setEffectTooltip(Number($(this).attr("value")))
		})
		$(".effect, .info_effect").mouseleave(function (e) {
			$(".effect_tooltip").css("visibility", "hidden")
		})
		$(".effect, .info_effect").on("touchstart", function (e) {
			$(".specialeffect_tooltip").css("visibility", "hidden")
			$(".effect_tooltip")
				.css({
					visibility: "visible",
				})
				.css($(this).offset())
			GAME.ui.setEffectTooltip(Number($(this).attr("value")))
		})
	}
	indicateActiveItem(ui, item, desc) {
		let id = String("item_" + Math.floor(Math.random() * 10000))
		let rect = document.getElementsByClassName("otherchar")[ui - 1].getBoundingClientRect()
		let str = `
		<div class="item_notification small" id='${id}'>
			<div class=item_noti_text>
				<p>${desc}</p>
			</div>
			<div class=item_noti_img>
				<img src='res/img/store/items.png' style='margin-left: ${-1 * item * 100}px'; >
			</div>
		</div>`
		$("#item_notification_container").append(str)

		$("#" + id).css({ top: rect.top - 3 + "px", left: "-300px" })
		$("#" + id).animate({ left: rect.right }, 400)

		setTimeout(() => $("#" + id).remove(), 2000)
	}
	indicateMyActiveItem(item, name, desc) {
		let id = String("item_" + Math.floor(Math.random() * 10000))
		let str = `
		<div class="item_notification" id='${id}'>
			<div class=item_noti_text>
				<b>${name}</b>
				<hr>
				<p>${desc}</p>
			</div>
			<div class=item_noti_img>
				<img src='res/img/store/items.png' style='margin-left: ${-1 * item * 100}px'; >
			</div>
		</div>`

		$("#item_notification_container").append(str)

		if (window.matchMedia("(orientation: landscape)").matches) {
			let rect = document.getElementById("skillbtncontainer").getBoundingClientRect()
			////console.log(rect.top, rect.right, rect.bottom, rect.left);

			////console.log("#"+id)
			$("#" + id).css({ bottom: "-100px", left: rect.left + "px" })
			$("#" + id).animate({ bottom: window.innerHeight - rect.top }, 400)
		} else {
			let rect = document.getElementsByClassName("mydisplay")[0].getBoundingClientRect()
			$("#" + id).css({ bottom: window.innerHeight - rect.bottom + "px", left: "-300px" })
			$("#" + id).animate({ left: rect.right }, 400)
		}
		$("#" + id + " item_noti_img img")

		setTimeout(() => $("#" + id).remove(), 2000)
	}
	/**
	 *
	 * @param {*} items {id:number,coolRatio:number in [0,1],cool:number}[]
	 */
	updateActiveItem(items) {
		let str = ""
		for (let i of items) {
			let coolratio = i.coolRatio

			str += ` <div class="active_item ${coolratio === 1 ? "active" : "inactive"}">
            <img class='active_item_img' src="res/img/store/items.png"  style='margin-left: ${-1 * i.id * 100}px';>
          `

			if (coolratio < 1) {
				str += `<div class="cooltime_mask" style="  background: conic-gradient(rgba(0,0,0,0) 0% 
            ,rgba(0,0,0,0) ${coolratio * 100}%,rgba(255, 255, 255, 0.6) ${
					coolratio * 100
				}%,rgba(255, 255, 255, 0.6) 100%);">
            ${i.cool}</div>`
			}

			str += "</div>"
		}

		$("#inventory_active_items").html(str)
	}
	updateStatTooltip(mystat) {
		const statkeys = [
			"moveSpeed",
			"AD",
			"AP",
			"AR",
			"MR",
			"regen",
			"basicAttackSpeed",
			"attackRange",
			"arP",
			"MP",
			"absorb",
			"obsR",
			"ultHaste",
		]
		let str = ""
		for (let s of statkeys) {
			//set tooltip wider if english
			str += ` <div class="stat_row">
			<a class="name ${GAME.chooseLang("wide", "")}">${GAME.LOCALE.stat[s]}</a><a class="value">${mystat[s]}</a>
			</div>`
		}
		$("#stat_content").html(str)
	}
	showSubwaySelection(prices) {
		GAME.subwayPrices = prices
		$("#subwaywindow").css("visibility", "visible")
		let subwaybtns = $(".subway_select").toArray()
		$(subwaybtns[0]).html(GAME.PAGELOCALE.subway.free)
		if (prices[1] > 0) {
			$(subwaybtns[1]).html(prices[1] + "$")
		} else {
			$(subwaybtns[1]).html(GAME.PAGELOCALE.subway.free)
		}
		$(subwaybtns[2]).html(prices[2] + "$")
	}
	selected(result) {
		$("#select").hide()

		GAME.connection.selectionComplete(GAME.pendingSelection.type, {
			type: GAME.pendingSelection.name,
			result: !result,
			complete: true,
		})
	}

	// getCharImgUrl(champ_id) {
	// 	return "res/img/character/" + GAME.strRes.GLOBAL_SETTING.characters[champ_id].imgdir
	// }

	// getChampImgofTurn(turn) {
	// 	if (turn === -1) return "res/img/ui/obstacle.png"

	// 	let player=GAME.players[turn]
	// 	if(!player) return ""
	// 	return this.getCharImgUrl(player.champ)
	// }
	indicatePlayerDeath(turn, spawnPos, skillfrom, isShutDown, killerMultiKillCount) {
		$(this.elements.kdasections[turn]).css("background", "rgba(146, 0, 0, 0.5)")
	}
	playerReconnect(turn, name) {
		this.game.showKillText(turn, 10, name + GAME.PAGELOCALE.reconnect)
	}
	playerDisconnect(turn, name) {
		this.game.showKillText(turn, 10, name + GAME.PAGELOCALE.disconnect)
	}

	showDeathInfo(skillfrom, damages) {
		//console.log(damages)
		let totalp = 0
		let totalm = 0
		let totalf = 0
		let sources = new Map()
		for (const d of damages) {
			if (!sources.has(d.sourceTurn)) {
				sources.set(d.sourceTurn, [0, 0, 0])
			}
			sources.get(d.sourceTurn)[d.damageType] += d.amt
			if (d.damageType === 0) totalp += d.amt
			if (d.damageType === 1) totalm += d.amt
			if (d.damageType === 2) totalf += d.amt
		}
		$(".deathinfo-header-pdmg").html(this.game.PAGELOCALE.deathinfo.pdmg + ": " + totalp)
		$(".deathinfo-header-mdmg").html(this.game.PAGELOCALE.deathinfo.mdmg + ": " + totalm)
		$(".deathinfo-header-fdmg").html(this.game.PAGELOCALE.deathinfo.fdmg + ": " + totalf)

		let str = ""
		let list = []
		for (const [source, dmg] of sources.entries()) {
			list.push([source, ...dmg])
		}
		list.sort((a, b) => {
			return -(a[1] + a[2] + a[3]) + (b[1] + b[2] + b[3])
		})
		let maxdmg = list[0][1] + list[0][2] + list[0][3]
		if (maxdmg === 0) return
		for (const d of list) {
			let graphstr = ""
			let classes = ["p", "m", "f"]
			for (let i = 1; i <= 3; i++) {
				if (d[i] > 0)
					graphstr += `<div class="deathinfo-source-bar deathinfo-source-bar-${classes[i - 1]}damage" style="width:
					${(d[i] / maxdmg) * 100}%;"></div>`
			}
			str += `
			<div class="deathinfo-source">
				<div>
				<img src="${this.game.getChampImgofTurn(d[0])}" ${d[0] === skillfrom ? ' class="killer"' : ""}>
				</div>
				<div>
				${d[0] === -1 ? this.game.PAGELOCALE.obstacle : this.game.players[d[0]].name}
				</div>
				<div>

					<div class="deathinfo-source-graph">
						${graphstr}
						<div class="deathinfo-source-damage">${d[1] + d[2] + d[3]}</div>
					</div>
				
				</div>
			</div>`
		}
		$(".deathinfo-content").html(str)
		$("#deathinfo-container").show()
		$("#deathinfo").hide()
	}
	hideDeathInfo() {
		$("#deathinfo-container").hide()
	}
}

class ObsNotification {
	constructor(name) {
		this.name = name
		this.timeout = null
		this.position = 0 //0 hidden, 1 lower 2 upper
	}

	write(obs, num, text) {
		let obstacle = GAME.strRes.OBSTACLES.obstacles[obs]

		let desc = GAME.LOCALE.obstacle[obs].desc
		//룰렛전용
		if (text != null) {
			desc = text
		}
		$(".obs_notification" + num + " p").html(desc)
		$(".obs_notification" + num + " b").html(GAME.LOCALE.obstacle[obs].name)
		$(".obs_notification" + num).removeClass("good")
		$(".obs_notification" + num).removeClass("bad")
		if (obstacle.val > 0) {
			$(".obs_notification" + num).addClass("good")
		} else if (obstacle.val < 0) {
			$(".obs_notification" + num).addClass("bad")
		}

		$(".obs_notification" + num + " .obs_img").html(
			"<div class=toast_obsimg><img src='res/img/board/obstacles.png' style='margin-left: " +
				-1 * obs * 50 +
				"px'; > </div>"
		)

		// $(".toast_obsimg").css({
		// 	margin: "-35px",
		// 	width: "50px",
		// 	overflow: "hidden",
		// 	height: "50px",
		// 	display: "inline-block",
		// 	transform: "scale(1.3)"
		// })
	}
}

class SkillInfoParser {
	static parse = function (str) {
		return str
			.replace(/\<\/\>/g, "</i>")
			.replace(/\\n/g, "<br>")
			.replace(/\[/g, "<i class='braket'>[")
			.replace(/\]/g, "]</i>")
			.replace(/\{/g, "<i class='skill_name'>[")
			.replace(/\}/g, "]&emsp; </i>")
			.replace(/\<cool\>/g, "<i class='cooltime'><img src='res/img/svg/skillinfo/cooltime.svg'>")
			.replace(/\<skill\>/g, "<i class='skill_name_desc'>")
			.replace(/\<lowerbound\>/g, "<i class='down'><img src='res/img/svg/skillinfo/lower.png'>")
			.replace(/\<upperbound\>/g, "<i class='up'><img src='res/img/svg/skillinfo/upper.png'>")
			.replace(/\<up\>/g, "<i class='up'><img src='res/img/svg/skillinfo/up.png'>")
			.replace(/\<down\>/g, "<i class='down'><img src='res/img/svg/skillinfo/down.png'>")
			.replace(/\<stat\>/g, "<i class='stat'>")
			.replace(/\<range\>/g, "<i class='range'>&ensp;<img src='res/img/svg/skillinfo/range.png'>")
			.replace(/\<currHP\>/g, "<i class='health'><img src='res/img/svg/skillinfo/currhp.svg'>")
			.replace(/\<maxHP\>/g, "<i class='health'><img src='res/img/svg/skillinfo/maxhp.png'>")
			.replace(/\<missingHP\>/g, "<i class='health'><img src='res/img/svg/skillinfo/missinghp.png'>")
			.replace(/\<area\>/g, "<i class='emphasize'><img src='res/img/svg/skillinfo/area.png'>")
			.replace(/\<money\>/g, "<i class='money'><img src='res/img/svg/skillinfo/money.png'>")
			.replace(/\<mdmg\>/g, "<i class='mdmg'><img src='res/img/svg/skillinfo/mdamage.png'>")
			.replace(/\<pdmg\>/g, "<i class='pdmg'><img src='res/img/svg/skillinfo/pdamage.png'>")
			.replace(/\<tdmg\>/g, "<i class='tdmg'><img src='res/img/svg/skillinfo/fdamage.png'>")
			.replace(/\<heal\>/g, "<i class='heal'><img src='res/img/svg/skillinfo/heal.png'>")
			.replace(/\<shield\>/g, "<i class='shield'><img src='res/img/svg/skillinfo/shield.svg'>")
			.replace(/\<proj\>/g, "<i class='emphasize'><img src='res/img/svg/skillinfo/pos.png'>")
			.replace(/\<projsize\>/g, "<i class='emphasize'><img src='res/img/svg/skillinfo/size.png'>")
			.replace(/\<duration\>/g, "<i class='emphasize'><img src='res/img/svg/skillinfo/duration.png'>")
			.replace(/\<radius\>/g, "<i class='emphasize'><img src='res/img/svg/skillinfo/around.svg'>")
			.replace(/\<basicattack\>/g, "<i class='basicattack'><img src='res/img/ui/basicattack.png'>")
			.replace(/\<target\>/g, "<i class='emphasize'><img src='res/img/svg/skillinfo/target.svg'>")
			.replace(/\<emp\>/g, "<i class='emphasize_simple'>")
			.replace(/\<skillimg([0-9]+-[0-9]+)>/g, "<img class='info_skillimg' src='res/img/skill/$1.jpg'>")
			.replace(/<scale(.+?)>/g, "<i class='scaled_value' value=$1>")
			.replace(/\<badeffect([0-9]+)\>/g, "<i class='badeffect info_effect' value='$1'>")
			.replace(/\<goodeffect([0-9]+)\>/g, "<i class='goodeffect info_effect' value='$1'>")
			.replace(/(?![^<>]+>)(\d+)(?!\d)/g, "<b>$1</b>") //wraps all numbers that is not a tag attribute
	}
}
