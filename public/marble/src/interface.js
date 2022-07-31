import { GAME } from "./marble.js"
import { moneyToString, COLORS } from "./marble_board.js"
class BuildingSelector {
	constructor(builds, buildsHave, discount, avaliableMoney) {
		this.builds = builds
		this.discount = discount
		this.avaliableMoney = avaliableMoney
		this.buildsHave = buildsHave
		this.doms = {
			buildingSelections: $(".building-selection").toArray(),
			buildingSelectionChecks: $(".building-selection-check").toArray(),
			buildingSelectionDescriptions: $(".building-selection-desc").toArray(),
			buildingSelectionPrices: $(".building-selection-price").toArray()
		}
		this.state = [false, false, false, false, false]
		Object.freeze(this.doms)
	}
	/**
	 * 창 처음 켜질때만 호출
	 */
	setState() {
		for (const b of this.builds) {
			this.state[b.type] = true
		}
		let moneyNeeded = 0
		//보유중인 건물 체크
		for (let i = 0; i < 4; ++i) {
			$(this.doms.buildingSelectionPrices[i]).html("")
			$(this.doms.buildingSelectionDescriptions[i]).hide()
			//보유중
			if (this.buildsHave.includes(i + 1)) {
				$(this.doms.buildingSelections[i]).addClass("have")
				$(this.doms.buildingSelections[i]).off()
				$(this.doms.buildingSelectionChecks[i]).hide()
				this.state[i + 1] = false
				// //깃발
				// if (i === 0) $(this.doms.buildingSelectionDescriptions[i]).hide()
			} else {
				//미보유
				$(this.doms.buildingSelections[i]).removeClass("have")

				if (i === 0) $(this.doms.buildingSelectionDescriptions[i]).show()
				moneyNeeded += this.builds[i].buildPrice * this.discount

				//더돌아야 건설가능
				if (this.builds[i].cycleLeft > 0) {
					this.state[i + 1] = false
					$(this.doms.buildingSelectionChecks[i]).hide()
					$(this.doms.buildingSelectionDescriptions[i]).html(
						this.builds[i].cycleLeft + "바퀴<br>더 돌아야 <br>건설가능"
					)
					$(this.doms.buildingSelectionDescriptions[i]).show()
					$(this.doms.buildingSelections[i]).off()
				}
				//돈부족
				else if (this.avaliableMoney < moneyNeeded) {
					this.state[i + 1] = false
					$(this.doms.buildingSelectionChecks[i]).hide()
					$(this.doms.buildingSelectionDescriptions[i]).html("보유자금<br>부족")
					$(this.doms.buildingSelectionDescriptions[i]).show()
					$(this.doms.buildingSelections[i]).off()
				}
			}
		}
	}

	/**
	 * 건물 체크 변경시마다 호출
	 */
	setButtons() {
		let totalprice = 0
		let totaltoll = 0

		for (let i = 0; i < this.builds.length; ++i) {
			let buildType = this.builds[i].type - 1

			$(this.doms.buildingSelectionPrices[buildType]).html(moneyToString(this.builds[i].buildPrice, "무료"))

			if (this.state[buildType + 1]) {
				//체크됨
				$(this.doms.buildingSelectionChecks[buildType]).show()
				totalprice += this.builds[i].buildPrice
				totaltoll += this.builds[i].toll
			} else {
				//체크 안됨
				$(this.doms.buildingSelectionChecks[buildType]).hide()
			}
		}
		$(".window-content-text1").html("건설 비용: " + moneyToString(totalprice, "무료"))
		$(".window-content-text2").html("건설비용할인: " + moneyToString(totalprice * (1 - this.discount)))

		let price = totalprice * this.discount
		if (this.avaliableMoney < price) {
			$("#landwindow .window-confirm-btn").addClass("disabled")
			$("#window-confirm-btn-price").html("잔액 부족")
		} else {
			$("#landwindow .window-confirm-btn").removeClass("disabled")
			$("#window-confirm-btn-price").html(moneyToString(price, "무료"))
		}

		$(".window-content-text-nobackground").html("통행료: " + moneyToString(totaltoll, "무료"))
	}
	/**
	 * 건물 체크 변경시 호출
	 * @param {*} building
	 */
	onClick(building) {
		this.state[Number(building)] = !this.state[Number(building)]
		this.setButtons()
	}
	/**
	 *
	 * @returns 서버 전송용 결과 리스트
	 */
	result() {
		let list = []
		for (let i = 1; i < 5; ++i) {
			if (this.state[i]) list.push(i)
		}
		return list
	}
}

class AbilityBuffer {
	static TOP = 0
	static BOTTOM = 1
	//pos:top or bottom
	constructor(pos) {
		this.pos = pos
		this.firstId = ""
		this.secondId = ""
		this.interval = null
		this.queue = []
	}
	enqueue(ui, name, itemName, desc, isblocked) {
		this.queue.push([ui, name, itemName, desc, isblocked])
		if(ui===3) console.log(this.queue)
		if (this.interval === null) {
			this.dequeue()
			this.interval = setInterval(() => this.dequeue(), 1500)
		}
	}
	dequeue() {
		if (this.queue.length === 0) {
			clearInterval(this.interval)
			this.interval = null
			return
		}

		let id = String("ablilty_" + Math.floor(Math.random() * 10000))
		const [ui, name, itemName, desc, isblocked] = this.queue.shift()
		this.hideThird(this.secondId)
		this.moveSecond(this.firstId)
		this.secondId=this.firstId
		this.firstId=id
		this.display(id,ui, name, itemName, desc, isblocked)
	}

	display(id,ui, name, itemName, desc, isblocked){
		// let ui = this.turnToUi.get(turn)
		let pos = ["top-left", "bottom-left", "top-right", "bottom-right"][ui]

		if (itemName === "") {
			let img = ""
			let text = ""
			if (name === "angel") {
				img = "res/angel.png"
				text = "모두방어"
			} else if (name === "discount") {
				img = "res/coupon.png"
				text = "할인"
			} else if (name === "shield") {
				img = "res/shield.png"
				text = "공격방어"
			} else return
			$("#ability-container").append(
				`<div class="ability-notification card ${pos}" id='${id}'>
					<img src="${img}"><br>
					<a>${text}</a>
				</div>`
			)
		} else {
			$("#ability-container").append(
				`<div class="ability-notification ability ${pos}" id='${id}'>
					<div class=ability-noti-text>
						<b>${itemName}</b>
						<hr>
						<p>${desc}</p>
					</div>
				</div>`
			)
		}
		if (ui === 0 || ui === 1) {
			$("#" + id).animate({ left: 5 }, 400)
		} else {
			$("#" + id).animate({ right: 5 }, 400)
		}
		setTimeout(() => $("#" + id).remove(), 3000)
	}
	moveSecond(id)
	{
		if(id==="" || $("#" + id).length===0) return
		if(this.pos===AbilityBuffer.TOP){
			$("#" + id).animate({ top: 120 }, 200)
		}
		else{
			$("#" + id).animate({ bottom: 120 }, 200)
		}
	}
	hideThird(id){
		if(id==="" || $("#" + id).length===0) return

		$("#" + id).hide()
	}
}
const TILE_SELECTIONS = {
	godhand_special_build: {
		title: "특수 지역",
		desc: "건설할 땅을 선택하세요"
	},
	start_build: {
		title: "시작지점 혜택",
		desc: "건설할 땅을 선택하세요"
	},
	travel: {
		title: "세계여행",
		desc: "이동할 땅을 선택하세요"
	},
	olympic: {
		title: "올림픽 개최",
		desc: "올림픽을 개최할 땅을 선택하세요"
	},
	selloff: {
		title: "강제 매각",
		desc: "강제 매각할 땅을 선택하세요"
	},
	land_change: {
		title: "도시 체인지",
		desc: "교환할 땅을 선택하세요"
	},
	earthquake: {
		title: "지진",
		desc: "지진을 일으켜 건물 1단계 파괴"
	},
	pandemic: {
		title: "전염병",
		desc: "전염병을 일으켜 통행료 50% 감소"
	},
	blackout: {
		title: "정전",
		desc: "정전을 일으켜 통행료 무료"
	},
	land_change_1: {
		title: "도시 체인지",
		desc: "상대에게 줄 땅 선택"
	},
	land_change_2: {
		title: "도시 체인지",
		desc: "상대에게서 가져올 땅 선택"
	},
	donate_land: {
		title: "도시 기부",
		desc: "기부할 땅을 선택하세요"
	},
	go_special: {
		title: "특수지역 이동",
		desc: "이동할 특수지역을 선택하세요"
	}
}
const FORTUNECARD = {
	shield: {
		title: "방어",
		desc: "상대의 공격 방어",
		image: "shield.png"
	},
	discount: {
		title: "할인쿠폰",
		desc: "통행료 절반 할인",
		image: "coupon.png"
	},
	angel: {
		title: "천사",
		desc: "통행료 면제 혹은 공격방어",
		image: "angel.png"
	},
	go_start: {
		title: "새 출발",
		desc: "즉시 출발지로 이동!",
		image: "start.png"
	},
	olympic: {
		title: "올림픽 개최",
		desc: "원하는 도시에 올림픽 개최!",
		image: "olympic.png"
	},
	go_olympic: {
		title: "올림픽 관람",
		desc: "즉시 올림픽 개최지로 이동!",
		image: "olympic.png"
	},
	go_special: {
		title: "특수지역 이동",
		desc: "원하는 특수지역으로 이동!",
		image: "column.png"
	},
	go_travel: {
		title: "여행 초대권",
		desc: "즉시 세계여행으로 이동!",
		image: "travel.png"
	},
	donate_land: {
		title: "도시 기부",
		desc: "통큰 기부! 랜덤 상대에게 내 도시 기부",
		image: ""
	},
	go_island: {
		title: "무인도",
		desc: "즉시 무인도로 이동!",
		image: "island.png"
	},
	selloff: {
		title: "강제 매각",
		desc: "원하는 상대의 도시를 강제로 매각",
		image: "judgement.png"
	},
	land_change: {
		title: "도시 체인지",
		desc: "원해는 상대의 도시와 내 도시를 교환",
		image: ""
	},
	earthquake: {
		title: "지진",
		desc: "도시에 지진을 일으켜 건물 1단계 파괴",
		image: ""
	},
	pandemic: {
		title: "전염병",
		desc: "도시에 전염병을 퍼뜨려 통행료 하락",
		image: ""
	},
	blackout: {
		title: "도시 정전",
		desc: "도시에 정전을 일으켜 무료 통과",
		image: ""
	}
}
export class GameInterface {
	constructor(game) {
		this.game = game
		this.doms = {
			buildingSelections: $(".building-selection").toArray(),
			buildingSelectionChecks: $(".building-selection-check").toArray(),
			buildingSelectionDescriptions: $(".building-selection-desc").toArray(),
			buildingSelectionPrices: $(".building-selection-price").toArray(),
			// moneyTable:$(".money-table").toArray(),
			// playerTable:$(".player-table").toArray(),
			// cardTable: $(".card-table").toArray(),
			playerUi: $(".player-ui").toArray(),
			playerTurn: $(".player-ui-turn a").toArray(),
			playerChar: $(".player-ui-char > img").toArray(),
			playerCard: $(".player-ui-card").toArray(),
			playerName: $(".player-ui-name").toArray(),
			playerTimeout: $(".player-ui-timeout span").toArray(),
			playerMoney: $(".player-ui-money-text").toArray()
		}
		Object.freeze(this.doms)
		this.onCreate()
		this.oddeven = 0
		this.diceThrowerPos = 0
		this.canChangeFullscreen = true
		this.turnToUi = new Map()
		this.abilityBuffer = [
			new AbilityBuffer(AbilityBuffer.TOP),
			new AbilityBuffer(AbilityBuffer.BOTTOM),
			new AbilityBuffer(AbilityBuffer.TOP),
			new AbilityBuffer(AbilityBuffer.BOTTOM)
		]
	}
	onCreate() {
		$("#dialog").hide()

		$(".loan-window-confirm").click(() => {
			this.onSelectLoan(true)
		})
		$(".loan-window-bankrupt").click(() => {
			this.onSelectLoan(false)
		})
		$("#odd").click(() => {
			this.clickOdd()
		})
		$("#even").click(() => {
			this.clickEven()
		})
		$("#toggle_fullscreen").click(async function () {
			console.log($(this).data("on"))
			if (!GAME.ui.canChangeFullscreen) return

			GAME.ui.canChangeFullscreen = false
			if (!$(this).data("on")) {
				await document.documentElement.requestFullscreen()
				$(this).data("on", true)
			} else {
				await document.exitFullscreen()
				$(this).data("on", false)
			}
			GAME.scene.setBoardScale()
			GAME.ui.canChangeFullscreen = true
		})
		$(".player-ui").click(function () {
			let turn = $(this).data("turn")
			GAME.ui.showPlayerWindow(turn)
		})
		$("#playerwindow .window-close").click(() => {
			$("#playerwindow").hide()
		})

		$("#quit").click(() => GAME.onQuit())
		$("#fortunecard-cancel").click(() => {
			$("#fortunecard").hide()
			this.game.finishObtainCard(false)
		})
		$("#fortunecard-confirm").click(() => {
			$("#fortunecard").hide()
			this.game.finishObtainCard(true)
		})

		$("#confirmwindow-cancel").click(() => {
			$("#confirmwindow").hide()
			this.game.onConfirmFinish(false, $("#confirmwindow").data("cardname"))
		})
		$("#confirmwindow-confirm").click(() => {
			$("#confirmwindow").hide()
			this.game.onConfirmFinish(true, $("#confirmwindow").data("cardname"))
		})
	}
	init(setting, myturn) {
		//
		//topleft,bottomleft,topright,bottomright

		this.turnToUi.set(myturn, 3)
		$(this.doms.playerUi[3]).addClass(COLORS[myturn])
		$(this.doms.playerUi[3]).data("turn", myturn)

		let playerCount = setting.players.length
		if (playerCount >= 3) $(".player-ui-bottom-left").css("visibility", "visible")
		if (playerCount >= 4) $(".player-ui-top-right").css("visibility", "visible")

		let ui = 0
		for (let i = 0; i < setting.players.length; ++i) {
			if (i !== myturn) {
				let ui_index = 0
				if (ui === 1) ui_index = 1
				if (ui === 2) ui_index = 2

				this.turnToUi.set(i, ui_index)
				$(this.doms.playerUi[ui_index]).addClass(COLORS[i])
				$(this.doms.playerUi[ui_index]).data("turn", i)

				ui++
			}
			let ui_index = this.turnToUi.get(i)
			let p = setting.players[i]
			$(this.doms.playerName[ui_index]).html(p.name)
			$(this.doms.playerTurn[ui_index]).html(String(i + 1))
			$(this.doms.playerChar[ui_index]).attr(
				"src",
				"./../res/img/character/" +
					["reaper", "elephant", "ghost", "dinosaur", "sniper", "magician", "kraken", "bird", "tree"][p.char] +
					".png"
			)
			$(this.doms.playerMoney[ui_index]).html(moneyToString(p.money))
			this.setSavedCard(i, p.card)
			// $(this.doms.moneyTable[p.turn]).html(moneyToString(p.money))
		}
	}

	onTurnStart(turn) {
		$(".player-ui").removeClass("active")
		$(".player-ui").addClass("inactive")

		$(this.doms.playerUi[this.turnToUi.get(turn)]).removeClass("inactive")
		$(this.doms.playerUi[this.turnToUi.get(turn)]).addClass("active")
	}
	showPlayerWindow(turn) {
		let abilities = this.game.getAbilities(turn)
		let str = ""
		for (const ab of abilities) {
			str += `<div class="player-ability">
            <a class="player-ability-title">${ab.name}</a>
            <hr>
            <a class="player-ability-desc">${ab.desc}</a>
          </div>`
		}
		$("#playerwindow .window-content").html(str)
		$("#playerwindow .window-header-content").html($(this.doms.playerName[this.turnToUi.get(turn)]).html())
		$("#playerwindow").show()
	}
	largeText(text, good) {
		$("#largetext").html(text)
		$("#largetext-container").removeClass("good")
		$("#largetext-container").removeClass("bad")
		if (good) {
			$("#largetext-container").addClass("good")
		} else {
			$("#largetext-container").addClass("bad")
		}
		$("#largetext-container").show()
		setTimeout(() => $("#largetext-container").hide(), 2500)
	}
	clickOdd() {
		$("#dicebtn").html("홀")
		this.oddeven = 1
		let positions = []
		for (let i = 0; i < 5; ++i) {
			positions.push((this.diceThrowerPos + 3 + 2 * i) % 32)
		}
		GAME.scene.clearTileHighlight("yellow")
		GAME.scene.showTileHighlight(positions, "yellow")
	}
	clickEven() {
		$("#dicebtn").html("짝")
		this.oddeven = 2
		let positions = []
		for (let i = 0; i < 6; ++i) {
			positions.push((this.diceThrowerPos + 2 + 2 * i) % 32)
		}
		GAME.scene.clearTileHighlight("yellow")
		GAME.scene.showTileHighlight(positions, "yellow")
	}
	onSelectLoan(result) {
		$("#overlay").hide()
		$("#loan-window").hide()
		this.game.connection.chooseLoan(result)
	}
	updateMoney(player, money) {
		$(this.doms.playerMoney[this.turnToUi.get(player)]).html(moneyToString(money))
	}
	showDiceBtn(hasOddEven, origin) {
		this.diceThrowerPos = origin
		this.oddeven = 0
		$("#dice_container").show()
		$("#dicebtn").html("ROLL")
		if (hasOddEven) {
			$("#odd").removeClass("disabled")
			$("#even").removeClass("disabled")
		} else {
			$("#odd").addClass("disabled")
			$("#even").addClass("disabled")
		}
	}
	showBuildSelection(landname, builds, buildsHave, discount, avaliableMoney, onCancel) {
		$("#landwindow").show()
		$("#landwindow .window-header-content").html(landname)

		$("#landwindow .window-close").off()
		$("#landwindow .window-close").click(function () {
			$("#landwindow").hide()
			onCancel()
		})

		$("#landwindow .window-confirm-btn").off()

		$("#window-confirm-btn-type").html("건설")

		//landmark
		if (builds[builds.length - 1].type === 5) {
			$("#landwindow .selection-text").html("랜드마크 건설").show()
			$("#landwindow .building-selection-container").hide()

			$("#landwindow .window-confirm-btn").click(() => {
				$("#landwindow").hide()
				this.game.buildChooseComplete([5])
			})

			$(".window-content-text1").html("건설 비용: " + moneyToString(builds[builds.length - 1].buildPrice, "무료"))
			$(".window-content-text2").html(
				"건설비용할인: " + moneyToString(builds[builds.length - 1].buildPrice * (1 - discount))
			)
			$("#window-confirm-btn-price").html(moneyToString(builds[builds.length - 1].buildPrice * discount, "무료"))
			$(".window-content-text-nobackground").html("통행료: " + moneyToString(builds[builds.length - 1].toll, "무료"))
		}
		//관광지
		else if (builds[0].type === 6) {
			$("#landwindow .selection-text").html("관광지 구매").show()
			$("#landwindow .building-selection-container").hide()

			$("#landwindow .window-confirm-btn").click(() => {
				$("#landwindow").hide()
				this.game.buildChooseComplete([6])
			})

			$(".window-content-text1").html("건설 비용: " + moneyToString(builds[0].buildPrice, "무료"))
			$(".window-content-text2").html("건설비용할인: " + moneyToString(builds[0].buildPrice * (1 - discount)))
			$("#window-confirm-btn-price").html(moneyToString(builds[0].buildPrice * discount, "무료"))
			$(".window-content-text-nobackground").html("통행료: " + moneyToString(builds[0].toll, "무료"))
		} else {
			let selector = new BuildingSelector(builds, buildsHave, discount, avaliableMoney)

			$("#landwindow .selection-text").hide()
			$("#landwindow .building-selection-container").show()
			$(".building-selection").off()
			$(".building-selection").click(function () {
				let build = $(this).data("building")
				selector.onClick(build)
			})
			selector.setState()
			selector.setButtons()

			$(this.doms.buildingSelections[0]).off()
			
			$("#landwindow .window-confirm-btn").click(() => {
				$("#landwindow").hide()
				this.game.buildChooseComplete(selector.result())
			})
		}
	}
	showBuyoutSelection(landname, price, originalPrice, onCancel) {
		$("#landwindow").show()
		$("#landwindow .window-header-content").html(landname)
		$("#landwindow .window-close").off()
		$("#landwindow .window-confirm-btn").off()
		
		$("#landwindow .window-close").click(function () {
			$("#landwindow").hide()
			onCancel()
		})
		$("#landwindow .selection-text")
			.html(landname + " 인수 하시겠습니까?")
			.show()
		$("#landwindow .building-selection-container").hide()

		$("#landwindow .window-confirm-btn").click(() => {
			$("#landwindow").hide()
			this.game.buyoutComplete(true)
		})
		$(".window-content-text1").html("인수 비용: " + moneyToString(originalPrice, "무료"))
		$(".window-content-text2").html("인수비용할인: " + moneyToString(originalPrice - price))
		$("#window-confirm-btn-price").html(moneyToString(price, "무료"))
		$(".window-content-text-nobackground").html("주의: 건설비용의 2배지불")
	}
	showSelectionTitle(source) {
		$("#selectionname").html(TILE_SELECTIONS[source].title)
		$("#selectiondesc").html(TILE_SELECTIONS[source].desc)
		$(".selectiontitle").show()
		$("#selection-cancel").off()
		$("#selection-cancel").click(() => {
			this.game.onTileSelectCancel(source)
		})
	}
	hideSelectionTitle() {
		$(".selectiontitle").hide()
	}
	obtainCard(name, level, type) {
		$("#fortunecard").removeClass("gold")
		$("#fortunecard").removeClass("trash")
		$("#fortunecard").removeClass("silver")
		$("#fortunecard-title").html(FORTUNECARD[name].title)
		$("#fortunecard-button-container p").html(FORTUNECARD[name].desc)

		if (FORTUNECARD[name].image !== "") $("#fortunecard-img img").attr("src", "res/" + FORTUNECARD[name].image)
		else $("#fortunecard-img img").attr("src", "")

		if (level === 0) $("#fortunecard").addClass("trash")
		if (level === 1) $("#fortunecard").addClass("silver")
		if (level === 2) $("#fortunecard").addClass("gold")

		//공격, 명령
		if (type === 0 || type === 2) {
			$("#fortunecard-cancel").hide()
			$("#fortunecard-confirm").html("확인")
		}
		if (type === 1) {
			$("#fortunecard-cancel").show()
			$("#fortunecard-cancel").html("버리기")
			$("#fortunecard-confirm").html("보관하기")
		}
		$("#fortunecard").show()
	}
	setSavedCard(turn, name, level) {
		let ui_index = this.turnToUi.get(turn)

		if (name !== "none" && name !== "") {
			$(this.doms.playerCard[ui_index]).show()
			if (name === "angel_card" || name === "angel")
				$(this.doms.playerCard[ui_index]).find("img").attr("src", "res/angel.png")
			if (name === "discount_card" || name === "discount")
				$(this.doms.playerCard[ui_index]).find("img").attr("src", "res/coupon.png")
			if (name === "shield_card" || name === "shield")
				$(this.doms.playerCard[ui_index]).find("img").attr("src", "res/shield.png")
		} else {
			$(this.doms.playerCard[ui_index]).hide()
		}
	}
	askTollDefenceCard(cardname, before, after) {
		$("#confirmwindow .window-header-content").html(FORTUNECARD[cardname].title)
		$("#confirmwindow").data("cardname", cardname)
		$("#confirmwindow .selection-text").html(
			`통행료 ${moneyToString(before, "무료")} -> ${moneyToString(after, "무료")}`
		)
		$("#confirmwindow .window-content-text-nobackground").html(FORTUNECARD[cardname].title + "카드를 사용할까요?")
		$("#confirmwindow").show()
	}
	askAttackDefenceCard(cardname, attackName) {
		$("#confirmwindow .window-header-content").html(FORTUNECARD[cardname].title)
		$("#confirmwindow").data("cardname", cardname)
		$("#confirmwindow .selection-text").html(`${FORTUNECARD[attackName].title} 공격을 받고 있습니다.`)
		$("#confirmwindow .window-content-text-nobackground").html(FORTUNECARD[cardname].title + "카드를 사용할까요?")
		$("#confirmwindow").show()
	}

	indicateAbility(turn, name, itemName, desc, isblocked) {
		let ui = this.turnToUi.get(turn)
		this.abilityBuffer[ui].enqueue(ui,name, itemName, desc, isblocked)
	}
	showLoanSelection(amount) {
		$("#overlay").show()
		$(".loan-window-amount").html(`부족한 금액: -${moneyToString(amount)}`)
		$("#loan-window").show()
	}
	onBankrupt(turn) {
		$(this.doms.playerMoney[this.turnToUi.get(turn)]).html("파산")
	}
	showDialog(content, onconfirm, oncancel) {
		$("#dialog p").html(content)
		$("#dialog .dialog_cancel").off()
		$("#dialog .dialog_confirm").off()
		$("#dialog .dialog_cancel").click(() => {
			if (oncancel != null) oncancel()
			$("#dialog").hide()
		})
		$("#dialog .dialog_confirm").click(() => {
			if (onconfirm != null) onconfirm()
			$("#dialog").hide()
		})
		$("#dialog").show()
	}
}
