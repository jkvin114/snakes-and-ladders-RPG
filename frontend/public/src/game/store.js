const EMPTY = -1
import { sleep } from "./RPGGameScene.js"
import { GAME, format } from "./GameMain.js"
const DOUBLECLICK_TOL = 150
export class StoreStatus {
	constructor() {
		this.itemList //
		this.sortedItemList //Map
		this.item = []
		this.money = 0
		this.token = 2
		this.life = 0
		this.lifeBought = 0
		this.recommendeditem = []
		this.itemLimit = 6
		this.priceMultiplier = 1
		this.itemSlots = [] //int[] (item slots)
		this.itemPrices = [] //아이템 현재가 저장용
		this.itemAvaliablity = [] //아이템 구매가능여부 저장용
	}
	init(itemLimit, recommendeditem) {
		this.itemLimit = itemLimit
		for (let i = 0; i < this.itemLimit; ++i) {
			this.item.push(-1)
		}
		this.recommendeditem = recommendeditem
		GAME.store_ui.initstore()
		for (let i = 0; i < itemLimit; ++i) {
			$("#newstorecurritem").append(
				"<div class=store_curritemimg value=-1><img src='res/img/store/emptyslot.png'> </div>"
			)
		}
	}
	hideLife() {
		$(".store_life_summary").hide()
	}

	setItemList(itemList, sortedItemList) {
		//console.log(sortedItemList)
		this.itemList = itemList
		this.sortedItemList = sortedItemList
		for (let it of this.itemList) {
			this.itemPrices.push(it.price)
			this.itemAvaliablity.push(false)
		}
	}
	set(data) {
		this.itemSlots = data.item
		this.money = data.money
		this.token = data.token
		this.life = data.life
		this.lifeBought = data.lifeBought
		this.recommendeditem = data.recommendeditem
		this.itemLimit = data.itemLimit
		this.priceMultiplier = data.priceMultiplier
		this.updateMoney(this.money)
		return this
	}

	updateToken(token) {
		this.token = token
		$("#storetoken").html("&times; " + token)
	}
	updateLife(life) {
		this.life = life
		$("#storelife").html("&times; " + (life + 1))
	}
	updateItemSlot(items) {
		this.itemSlots = Array.from(items)
	}

	canBuyItem(item_id) {
		return this.money >= this.itemPrices[item_id] && this.itemAvaliablity[item_id]
	}
	updateMoney(money) {
		$("#storemoney").html(money + "$")
	}

	spendMoney(money) {
		this.money -= money
		this.updateMoney(this.money)
	}

	onReceiveSellTokenData(token) {
		if (token > 0) {
			$("#sell_token").show(500, "swing")
			this.sellToken(token)
		} else {
			this.onTokenSellComplete(0, 0)
		}
	}

	onTokenSellComplete(token, moneyspent) {
		if (GAME.ismyturn) {
			GAME.connection.sellTokenComplete({
				type: "sell_token",
				complete: true,
				objectResult: {
					money: moneyspent,
					token: token,
				},
			})
		}
	}

	sellToken(token) {
		$("#selltokenbtn").off()
		$("#sellalltokenbtn").off()

		$("#selltokenclose").off()

		$("#sell_token h6").html(GAME.PAGELOCALE.coin.have + token)

		let price = getTokenSellPrice()
		GAME.store.tokensold = token
		$("#sell_token h5").html(GAME.PAGELOCALE.coin.sell + price + "$")
		$("#token_sell_range").on("input", function () {
			GAME.store.tokensold = Math.floor(token * (this.value / 100))
			$("#token_sell_total").html(
				format(GAME.PAGELOCALE.coin.sellprice, [GAME.store.tokensold]) + GAME.store.tokensold * price + "$"
			)
		})

		$("#selltokenbtn").click(() => {
			$("#sell_token").hide(500, "swing")
			this.onTokenSellComplete(GAME.store.tokensold, GAME.store.tokensold * price)
			if (GAME.store.tokensold < 1) return
			$("#token_sell_total").html("")
			GAME.playSound("store")
			GAME.store.tokensold = 0
		})

		$("#sellalltokenbtn").click(() => {
			$("#sell_token").hide(500, "swing")
			this.onTokenSellComplete(token, token * price)
			if (GAME.store.tokensold < 1) return
			$("#token_sell_total").html("")
			GAME.playSound("store")
			GAME.store.tokensold = 0
		})
		$("#selltokenclose").click(() => {
			$("#sell_token").hide(500, "swing")
			this.onTokenSellComplete(0, 0)
			GAME.store.tokensold = 0
		})
	}
}

class ItemTreeNode {
	/**
	 *
	 * @param {*} item_id number
	 * @param {*} children ItemTreeNode[]
	 * @param {*} price numb
	 * @param {*} canbuy bool
	 * @param {*} have bool
	 */
	constructor(item_id, price, canbuy, have, isparent) {
		this.item_id = item_id
		this.price = price
		this.canbuy = canbuy
		this.have = have
		this.isparent = isparent
	}
	getNodeStr() {
		let str =
			`<div class='onetreeitem ${this.canbuy ? "canbuy" : ""} ${this.isparent ? "parents" : ""}' value='${String(
				this.item_id
			)}' data-price='${this.price}'>` +
			`<div class='store_treeitemimg ${!this.canbuy || this.have ? "itemhave" : ""}'>` +
			`<img src='res/img/store/items.png' style='margin-left:${-1 * this.item_id * 100}px';>` +
			`</div><b>$${this.price}</b>` +
			(this.have && !this.isparent ? "<img class='itemcheck' src='res/img/ui/confirm.png'>" : "") +
			"</div>"
		return str
	}
}

class ItemTreeBuilder {
	constructor(storeStatus, storeInstance) {
		this.currentMoney = 0
		this.itemSlotCounter
		this.storeStatus = storeStatus
		this.storeInstance = storeInstance
		this.stringBuilder = ""
	}
	reset() {
		this.stringBuilder = ""
		return this
	}
	setItemSlot(itemSlots) {
		this.itemSlotCounter = Array.from(itemSlots)
		return this
	}
	setCurrentMoney(money) {
		this.currentMoney = money
		return this
	}
	createItemNode(item_id, isparent) {
		let index = this.itemSlotCounter.indexOf(item_id)
		let have = false
		if (index >= 0) {
			this.itemSlotCounter[index] = -1
			have = true
		}
		let price = this.storeStatus.itemPrices[item_id]
		let canbuy = price <= this.currentMoney && this.storeStatus.itemAvaliablity[item_id]
		return new ItemTreeNode(item_id, price, canbuy, have, isparent)
	}
	build(item_id, itemlevel) {
		if (itemlevel === 3) {
			this.searchChildren(item_id, true)
		} else {
			this.searchChildrenAndParent(item_id)
		}

		return this.stringBuilder
	}
	stradd(str) {
		this.stringBuilder += str
	}

	searchChildren(item_id, isparent) {
		this.stradd("<span class='tf-nc'>")
		this.stradd(this.createItemNode(item_id, isparent).getNodeStr())
		this.stradd("</span>")
		let children = this.storeStatus.itemList[item_id].children

		if (children.length === 0) return
		this.stradd("<ul>")
		for (let child of children) {
			this.stradd("<li>")
			this.searchChildren(child, false)
			this.stradd("</li>")
		}
		this.stradd("</ul>")
	}

	searchChildrenAndParent(item_id) {
		this.stradd("<span class='tf-nc parents'>")
		for (let p of this.storeStatus.itemList[item_id].parents) {
			this.stradd(this.createItemNode(p, true).getNodeStr())
		}
		this.stradd("</span>")

		this.stradd("<ul><li>")
		this.searchChildren(item_id, false)
		this.stradd("</ul></li>")
	}
}

export class StoreInterface {
	constructor(StoreStatus, storeInstance) {
		if (StoreInterface._instance) {
			return StoreInterface._instance
		}
		StoreInterface._instance = this
		this.isDetailOpen = false
		this.storeStatus = StoreStatus
		this.storeInstance = storeInstance
		this.isStoreOpen = false
		this.currentCategory = 0
		this.currentTreeItem = 0
		this.treeBuilder = new ItemTreeBuilder(StoreStatus, storeInstance)
		this.isGrid = false
		this.isAuto = false
		this.categorybtn = $(".categorybtn").toArray()
		this.naviRecord = []

		$("#newstore").css("visibility", "hidden")
		$("#newstoremoney").css("visibility", "hidden")
		$("#newstorecurritem").css("visibility", "hidden")
		$(".itemdetail").css("visibility", "hidden")
		$("#statinfopopup").hide()
	}

	naviBack() {
		this.naviRecord.pop()
		let prev = this.naviRecord.pop()
		if (!prev) return
		if (prev.type === "category") {
			this.showCategory(prev.val)
		}
		if (prev.type === "life") {
			this.showLifeDetail()
		}
		if (prev.type === "token") {
			this.showTokenDetail()
		}
		if (prev.type === "item") {
			this.showDetail(prev.val, true)
		}
	}
	saveNaviRecord(type, val) {
		if (
			this.naviRecord.length > 1 &&
			this.naviRecord[this.naviRecord.length - 1].type === type &&
			this.naviRecord[this.naviRecord.length - 1].val === val
		)
			return

		this.naviRecord.push({
			type: type,
			val: val,
		})
	}
	initstore() {
		// let storehometexts = $("#storehome > p").toArray()
		// $(storehometexts[0]).html(GAME.chooseLang("Special Items", "특수 아이템"))
		// $(storehometexts[1]).html(GAME.chooseLang("Recommended Items", "추천 아이템"))

		// $("#store_auto_text").html(GAME.chooseLang("Item auto buy", "아이템 자동구매"))
		// $("#loweritem").html(GAME.chooseLang("Lower Level Items", "하위 아이템"))
		// $("#upperitem").html(GAME.chooseLang("Upper Level Items", "상위 아이템"))
		// $(".store_life_summary p").html(GAME.chooseLang("Additional Life", "추가 목숨"))
		// $(".store_token_summary p").html(GAME.chooseLang("Coin Investment", "코인 투자"))
		// $("#store_buytoken #itemname").html(GAME.chooseLang("Coin", "코인"))
		// $("#store_buylife #itemname").html(GAME.chooseLang("Additional Life", "추가 목숨"))
		$("#store_buytoken #token_description").html(
			format(GAME.PAGELOCALE.coin.desc, [
				"<div class=coinstoreimg><img src='res/img/board/obstacles.png' style='margin-left: -3350px'; > </div>",
			])
		)
		const _this = this

		$(".coinstoreimg").css({
			width: "50px",
			overflow: "hidden",
			height: "50px",
			display: "inline-block",
			background: "white",
		})
		$(".typelistbtn").click(function () {
			_this.hideItemDetail()
			if ($(this).attr("value") === "back") {
				_this.naviBack()
			} else _this.showCategory(Number($(this).attr("value")))
		})
		$("#back").click(function () {
			_this.goBack()
		})
		// $(".itemsummary").click(function () {
		// 	//console.log("itemsummary")
		// 	GAME.store_ui.showDetail(Number($(this).val()))
		// })

		// $(".store_otherlevelitemimg").click(function () {
		// 	GAME.store_ui.showDetail(Number($(this).val()))
		// })
		$("#statinfo").click(function () {
			$("#statinfopopup").show()
		})

		$(".itemdetail *:not(#statinfo)").click(function () {
			$("#statinfopopup").hide()
		})

		// $(".detailclose").click(function () {
		// 	GAME.store_ui.hideItemDetail()
		// })
		$(".storeclose").click(function () {
			_this.closeStore()
		})
		$(".storebtn2").click(function () {
			_this.openStore()

			//$(".overlay").show(0)
		})
		$("#store_title").click(() => GAME.store.storehome())

		// $("#storeclose").click(function () {
		// 	if(GAME.store_ui!=null)
		// 		GAME.store_ui.closeStore()
		// })

		$("#token_buy_range").on("input", function () {
			_this.updateTokenCount(this.value)
		})
		$("#store_grid").click(() => {
			this.isGrid = true
			this.updateStoreContent()
		})
		$("#store_list").click(() => {
			this.isGrid = false
			this.updateStoreContent()
		})
		// $("#store_auto").click(function(){
		// 	this.isAuto=$(this).is(':checked');
		// 	GAME.connection.update("auto_store",this.isAuto)
		// 	// GAME.android_toast(this.isAuto)
		// })
	}
	syncMoneyDisplay(data) {
		this.storeStatus.updateMoney(data.money)
		this.storeStatus.updateToken(data.token)
		this.storeStatus.updateLife(data.life)
	}
	updateStoreBtnState() {
		// $(".storebtn2").show()
		if (this.storeInstance.enabled) {
			$(".storebtn2").attr("disabled", false)
			$(".storebtn2").removeClass("unavaliable")
		} else {
			$(".storebtn2").attr("disabled", true)
			$(".storebtn2").addClass("unavaliable")
		}
	}
	openNewStore(data) {
		this.syncMoneyDisplay(data)
		this.updateStoreBtnState()
		this.updateStoreHome()
	}
	showCategory(category) {
		this.saveNaviRecord("category", category)
		$(".typelistbtn").removeClass("focus")

		$(this.categorybtn[category]).addClass("focus")
		// //console.log("showcat" + category)
		// document.getElementById("storecontent").scrollTo(0,0)
		this.currentCategory = category
		if (category === 0) {
			this.updateStoreHome()
			$("#storecontent").hide()
			$("#storehome").show()
		} else {
			this.updateStoreCategory(category)
			$("#storecontent").show()
			$("#storehome").hide()
		}
	}
	initStoreHome() {
		this.setRecommendedItem()

		$(".cannotbuyitem img").css({ filter: " brightness(0.5)" })
		let _this = this

		$(".itemsummary").click(function () {
			_this.showDetail(Number($(this).attr("value")), true)
		})
	}

	setRecommendedItem() {
		let str = ""
		let count = 0
		for (let i = 0; i < this.storeStatus.recommendeditem.length - 1; ++i) {
			let item = this.storeStatus.recommendeditem[i]
			if (this.storeStatus.itemSlots.includes(item)) continue

			str += this.getItemSummaryStr(item)
			count++
			if (count >= 4) break
		}

		//add final item
		if (count < 4 && this.storeStatus.recommendeditem.length > 0) {
			str += this.getItemSummaryStr(this.storeStatus.recommendeditem[this.storeStatus.recommendeditem.length - 1])
		}
		$(".recommendeditem").html(str)
	}
	updateStoreHome() {
		//if (!this.storeInstance.enabled) return

		this.setRecommendedItem()

		if (GAME.scene.Map.mapname === "casino") {
			$(".store_token_summary b").html(this.storeInstance.tokenprice + "$")
		}
		$(".cannotbuyitem img").css({ filter: " brightness(0.5)" })
		// $(".store_token_summary b").html(this.storeInstance.tokenprice + "$")
		$(".store_life_summary b").html(Math.pow(2, this.storeStatus.lifeBought) * 150 + "$")
		$(".itemsummary").off()
		let _this = this
		$(".itemsummary").click(function () {
			_this.showDetail(Number($(this).attr("value")), true)
		})
	}

	updateStoreCategory(category) {
		GAME.extendTimeout()
		// if(!this.storeInstance.enabled) return

		let levels = $(".levelitems").toArray()
		let leveltexts = $("#storecontent > p").toArray()
		let isReversed = false
		//3등급 아이템 위로
		if (GAME.myStat.level <= 2) {
			$(leveltexts[2]).html(GAME.PAGELOCALE.itemlevel.epic)
			$(leveltexts[1]).html(GAME.PAGELOCALE.itemlevel.rare)
			$(leveltexts[0]).html(GAME.PAGELOCALE.itemlevel.common)
			isReversed = true
		} else {
			$(leveltexts[0]).html(GAME.PAGELOCALE.itemlevel.epic)
			$(leveltexts[1]).html(GAME.PAGELOCALE.itemlevel.rare)
			$(leveltexts[2]).html(GAME.PAGELOCALE.itemlevel.common)
		}

		let categories = ["attack_lv", "magic_lv", "defence_lv", "health_lv", "utility_lv"]
		for (let i = 0; i < 3; ++i) {
			let lvl = String(i + 1)
			let item_ids = this.storeStatus.sortedItemList.get(categories[category - 1] + lvl)
			let str = ""
			for (let item_id of item_ids) {
				str += this.getItemSummaryStr(item_id)
			}
			if (isReversed) {
				$(levels[i]).html(str)
			} else {
				$(levels[2 - i]).html(str)
			}
		}
		$(".cannotbuyitem img").css({ filter: " brightness(0.5)" })
		let _this = this

		$(".itemsummary").off()
		$(".itemsummary").click(function () {
			//console.log("itemsummary")
			_this.showDetail(Number($(this).attr("value")), true)
		})
	}

	getItemSummaryStr(item_id) {
		// //console.log("getItemSummaryStr"+item_id)
		let canbuy = this.storeStatus.canBuyItem(item_id)
		let str = `<div class='itemsummary ${canbuy ? "" : " cannotbuy "} ${this.isGrid ? "grid" : ""}' value='${String(
			item_id
		)}'>
				<div>
					<div class=store_curritemimg ><img src='res/img/store/items.png' style='margin-left:${-1 * item_id * 100}px';> 
					</div><b class='summaryprice ${canbuy ? "" : " cannotbuyitem "}'> $${this.storeStatus.itemPrices[item_id]}</b>
				</div>
				<p>${GAME.LOCALE.item[item_id].summary}
				</p>
			</div>`

		return str
	}

	updateAllCurrentItem(items) {
		let str = ""
		// $("#newstorecurritem").html("")
		for (let it of items) {
			if (it === EMPTY) {
				str += "  <div class=store_curritemimg value=-1><img src='res/img/store/emptyslot.png'> </div>"
			} else {
				str +=
					`<div class='store_curritemimg sellitem' value=${String(it)}>` +
					`<img src='res/img/store/items.png' style='margin-left:${-1 * it * 100}px';></div>`
			}
		}
		$("#newstorecurritem").html(str)

		let _this = this
		$(".sellitem").click(function () {
			let item_id = Number($(this).attr("value"))
			if (item_id === -1) {
				return
			}

			_this.onItemSellClick(item_id)
		})
	}
	closeStore() {
		this.naviRecord = []
		$("#tokentotal").html("")
		this.isStoreOpen = false

		this.storeInstance.onStoreClose()

		// $(".itemdetail").css("visibility", "hidden")
		$(".itemdetail").css("visibility", "hidden")

		$("#newstore").css("visibility", "hidden")
		$("#newstoremoney").css("visibility", "hidden")
		$("#newstorecurritem").css("visibility", "hidden")
	}

	openStore() {
		this.isStoreOpen = true

		if (this.storeInstance.enabled) {
			this.storeInstance.updateAllItemPrices()
			this.storeInstance.onStoreOpen()
		}

		// this.updateStoreHome()
		this.showCategory(this.currentCategory)
		if (GAME.scene.Map.mapname === "casino") {
			$("#store_token_summary").show()
			$("#store_token_indicator").show()
		} else {
			$(".store_token_summary").hide()
		}

		$("#store_token_indicator").show()

		$("#newstore").css("visibility", "visible")
		$("#newstoremoney").css("visibility", "visible")
		$("#newstorecurritem").css("visibility", "visible")
		if (this.isDetailOpen) {
			//	$(".itemdetail").css("visibility", "visible")
		}
	}

	showLifeDetail() {
		this.saveNaviRecord("life", 0)
		$("#buylife").off()
		$("#life_description").html(GAME.PAGELOCALE.life_desc)
		$("#store_buylife").css("visibility", "visible")
		$("#buylife").click(
			function () {
				this.onLifeBuy()
			}.bind(this)
		)

		let price = this.storeInstance.getLifePrice()

		$("#buylife").html("$" + price)

		if (price > this.storeStatus.money || !this.storeInstance.enabled) {
			$("#buylife").off()
			$("#buylife").css({
				filter: "grayscale(90%)",
				color: "gray",
			})
		} else {
			$("#buylife").css({
				filter: "none",
				color: "#f4d142",
			})
		}
	}
	onLifeBuy() {
		GAME.playSound("store")
		this.storeInstance.buyLife()
		this.storeInstance.sendPurchaseData()
		this.showLifeDetail()
	}
	showTokenDetail() {
		this.saveNaviRecord("token", 0)
		$("#buytoken").off()
		$("#tokentotal").html("")
		$("#store_buytoken").css("visibility", "visible")

		$("#buytoken").click(
			function () {
				this.onTokenBuy()
			}.bind(this)
		)
		this.updateTokenCount(0)

		if (!this.storeInstance.enabled) {
			$("#tokenprice").html(GAME.PAGELOCALE.coin.price + ": ??")
		} else {
			$("#tokenprice").html(GAME.PAGELOCALE.coin.price + ": $" + this.storeInstance.tokenprice)
		}
		//mot enough money
		if (this.storeInstance.tokenprice > this.storeStatus.money || !this.storeInstance.enabled) {
			$("#buytoken").off()
			$("#buytoken").html(GAME.PAGELOCALE.coin.buy).css({
				filter: "grayscale(90%)",
				color: "gray",
			})
		} else {
			$("#buytoken").html(GAME.PAGELOCALE.coin.buy).css({
				filter: "none",
				color: "#f4d142",
			})
		}
	}

	onTokenBuy() {
		this.storeInstance.buyToken()
		this.storeInstance.sendPurchaseData()
		$("#token_buy_range").val(0)
		this.showTokenDetail()
	}
	updateTokenCount(val) {
		if (this.storeStatus.money < 0 || !this.storeInstance.enabled) return
		this.storeInstance.updateTokenCount(val)
		$("#tokentotal").html(
			format(GAME.PAGELOCALE.coin.buyprice, [this.storeInstance.tokencount]) +
				this.storeInstance.tokencount * this.storeInstance.tokenprice +
				"$"
		)
	}
	updateStoreContent() {
		if (this.currentCategory === 0) {
			this.updateStoreHome()
		} else {
			this.updateStoreCategory(this.currentCategory)
		}
	}
	hideItemDetail() {
		this.updateStoreContent()
		this.isDetailOpen = false

		$(".itemdetail").css("visibility", "hidden")
		$("#store_buytoken").css("visibility", "hidden")
	}
	onTreeItemDoubleClick(item_id, price, currentPageItem) {
		//console.log("doubleclick" + item_id)
		let predicted_itemlist = Array.from(this.storeStatus.itemSlots)

		this.storeInstance.calcDiscount(item_id, predicted_itemlist)
		this.onItemBuy(item_id, predicted_itemlist, price, currentPageItem)
	}

	showDetail(item_id, changetree) {
		this.saveNaviRecord("item", item_id)
		GAME.extendTimeout()
		this.isDetailOpen = true

		// $("#statinfopopup").html("")
		// $("#parentitems").html("")
		// $("#childitems").html("")
		$("#statinfo").hide()
		$("#buyitem").off()
		//	$("#thisitem .item_description").html("")

		if (item_id === -1) {
			this.showLifeDetail()
			return
		} else if (item_id === -2) {
			this.showTokenDetail()
			return
		} else if (item_id < 0) {
			return
		}

		let thisitem = this.storeStatus.itemList[item_id]

		const itemlocale = GAME.LOCALE.item[item_id]

		$("#itemname").html(itemlocale.name)
		$(".store_thisitemimg").html(
			"<img src='res/img/store/items.png' style='margin-left: " + -1 * item_id * 100 + "px';>"
		)
		let needinfobtn = false
		let ability = ""
		let statinfopopup = ""
		for (let a of thisitem.ability) {
			let ab = `<a class='ability_name'>${GAME.LOCALE.stat[a.type]}</a> + ${a.value}`

			if (a.type === "addMdmg" || a.type === "skillDmgReduction" || a.type === "absorb" || a.type === "obsR") {
				ab += "%"
			}
			ability += ab
			ability += "<br>"
			// if (a.type === "skillDmgReduction") {
			// 	$("#statinfopopup").append("&#8251;" + GAME.strRes.STAT_DETAIL[0] + "<br>")
			// 	needinfobtn = true
			// }

			if (a.type === "attackRange") {
				statinfopopup += "&#8251;" + GAME.LOCALE.stat_detail.attackRange + "<br>"
				needinfobtn = true
			}
			// if (a.type === "regen") {
			// 	$("#statinfopopup").append("&#8251;" + GAME.strRes.STAT_DETAIL[2] + "<br>")
			// 	needinfobtn = true
			// }
			if (a.type === "ultHaste") {
				statinfopopup += "&#8251;" + GAME.LOCALE.stat_detail.ultHaste + "<br>"
				needinfobtn = true
			}
			if (a.type === "moveSpeed") {
				statinfopopup += "&#8251;" + GAME.LOCALE.stat_detail.moveSpeed + "<br>"
				needinfobtn = true
			}
			if (a.type === "adStat") {
				statinfopopup += "&#8251;" + GAME.LOCALE.stat_detail.adStat + "<br>"
				needinfobtn = true
			}
			if (a.type === "basicAttackSpeed") {
				statinfopopup += "&#8251;" + GAME.LOCALE.stat_detail.basicAttackSpeed + "<br>"
				needinfobtn = true
			}
		}

		if (needinfobtn) {
			$("#statinfopopup").html(statinfopopup)
			$("#statinfo").show()
		}
		if (thisitem.hasPassive) {
			ability += "<b class='unique_effect'>[" + GAME.PAGELOCALE.item.passive + "]</b>:" + itemlocale.unique_effect
			if (thisitem.active_cooltime != null) {
				ability += format(GAME.PAGELOCALE.item.cooltime, [thisitem.active_cooltime])
				// GAME.chooseLang(
				// 	`(cooltime ${thisitem.active_cooltime} turns)`,
				// 	`(쿨타임 ${thisitem.active_cooltime}턴)`
				// )
			}
		}
		$("#thisitem .item_description").html(ability)

		let predicted_itemlist = Array.from(this.storeStatus.itemSlots)

		let actual_price = Math.floor(
			(thisitem.price - this.storeInstance.calcDiscount(item_id, predicted_itemlist)) * this.storeStatus.priceMultiplier
		)

		$("#buyitem").html("$" + actual_price)

		let treeItem = this.currentTreeItem
		if (changetree) {
			treeItem = item_id
			this.currentTreeItem = item_id
		}

		// $("#itemtreestart").html("")
		$("#itemtreestart").html(
			this.treeBuilder
				.reset()
				.setCurrentMoney(this.storeStatus.money)
				.setItemSlot(this.storeStatus.itemSlots)
				.build(treeItem, this.storeStatus.itemList[treeItem].itemlevel)
		)

		$(".onetreeitem").off()
		let _this = this

		$(".tf-nc .onetreeitem").click(async function () {
			//console.log($(this).attr("value"))
			await sleep(DOUBLECLICK_TOL)
			if ($(this).data("blockClick") === "true") return

			if ($(this).hasClass("parents")) _this.showDetail(Number($(this).attr("value")), true)
			else _this.showDetail(Number($(this).attr("value")), false)
		})

		$(".tf-nc .onetreeitem.canbuy").dblclick(function () {
			//console.log($(this).attr("value"))
			_this.onTreeItemDoubleClick(Number($(this).attr("value")), $(this).data("price"), item_id)
			$(this).data("blockClick", "true")
		})

		// $(".tf-nc.parents .onetreeitem").click(function () {
		// 	//console.log($(this).attr("value"))
		// 	_this.showDetail(Number($(this).attr("value")), true)
		// })

		if (this.storeStatus.canBuyItem(item_id) && this.storeInstance.enabled) {
			$("#buyitem").css("color", "#f4d142")
			$("#buyitem").css({
				filter: "none",
			})
			$("#buyitem").click(() => _this.onItemBuy(item_id, predicted_itemlist, actual_price))
		} else {
			$("#buyitem").css("color", "gray")
			$("#buyitem").css({
				filter: "grayscale(90%)",
			})
		}
		// $(".have").css({
		// 	border: "7px solid green"
		// })

		$("#store_buyitem").css("visibility", "visible")
	}

	onItemSellClick(item_id) {
		if (!this.storeInstance.enabled) return
		let price = Math.floor(this.storeStatus.itemList[item_id].price / 2.5)

		if (GAME.ui != null)
			GAME.showDialog(
				GAME.LOCALE.item[item_id].name +
					"<br>" +
					GAME.PAGELOCALE.item.price +
					": " +
					price +
					"$<br>" +
					GAME.PAGELOCALE.item.sellconfirm,
				() => this.onItemSellConfirm(item_id, price)
			)

		// let retVal = confirm(
		// 	itemname +
		// 		GAME.chooseLang("\n price:", "\n가격:") +
		// 		price +
		// 		"$" +
		// 		"\n" +
		// 		GAME.chooseLang("Do you really want to sell?", "정말 판매하시겠습니까?")
		// )
		// if (retVal == true) {

		// } else {
		// }
	}

	onItemSellConfirm(item_id, price) {
		// $("#sellitembtn").off()
		this.storeStatus.spendMoney(-1 * price)
		this.storeInstance.moneyspend -= price
		this.storeStatus.updateItemSlot(this.storeInstance.removeItem(this.storeStatus.itemSlots, item_id))

		this.updateAllCurrentItem(this.storeStatus.itemSlots)
		this.storeInstance.sendPurchaseData()
		this.storeInstance.updateAllItemPrices()
		this.hideItemDetail()
		GAME.playSound("store")
		// $(".sell_toast").toast("hide")
	}

	onItemBuy(item_id, predicted_itemlist, actual_price, redirectItem) {
		GAME.playSound("store")
		$("#buyitem").off()
		this.storeStatus.spendMoney(actual_price)
		this.storeInstance.moneyspend += actual_price
		predicted_itemlist = this.storeInstance.addItem(predicted_itemlist, item_id)
		this.storeStatus.updateItemSlot(predicted_itemlist)
		this.updateAllCurrentItem(predicted_itemlist)
		this.storeInstance.sendPurchaseData()
		this.storeInstance.updateAllItemPrices()

		if (!redirectItem) redirectItem = item_id
		this.showDetail(redirectItem, false)
	}

	goBack() {
		let record = this.storeInstance.popRecord()
		if (record == null) return
	}
}

export class StoreInstance {
	constructor(data) {
		this.data = data
		this.moneyspend = 0
		this.tokenbought = 0
		this.tokenprice = this.setTokenPrice()
		this.tokencount = 0
		this.lifecount = 0
		this.enabled = true
		// this.recommended = null

		this.tokensold = 0
		this.itemRecord = [data.itemSlots]
		this.moneyRecord = [data.money]
	}
	addRecord() {
		this.itemRecord.push(this.data.itemSlots)
		this.moneyRecord.push(this.data.money)
	}

	popRecord() {
		return {
			itemSlots: this.itemRecord.pop(),
			money: this.moneyRecord.pop(),
		}
	}

	disable() {
		this.enabled = false
		if (GAME.scene.Map.mapname === "casino") {
			$(".store_token_summary b").html("??$")
		}
	}
	sendPurchaseData() {
		GAME.connection.sendStoreData(this.serialize())
		this.moneyspend = 0
		this.tokenbought = 0
		this.lifecount = 0
	}
	buyToken() {
		if (this.tokencount < 1 || this.data.money < this.tokencount * this.tokenprice) return
		GAME.playSound("store")
		this.data.money -= this.tokencount * this.tokenprice
		this.data.token += this.tokencount
		this.moneyspend += this.tokencount * this.tokenprice
		this.tokenbought += this.tokencount
		this.tokencount = 0
		this.data.updateMoney(this.data.money)
		this.data.updateToken(this.data.token)
	}

	serialize() {
		return {
			item: this.data.itemSlots,
			moneyspend: this.moneyspend,
			turn: GAME.myturn,
			crypt_turn: GAME.crypt_turn,
			tokenbought: this.tokenbought,
			tokenprice: this.tokenprice,
			life: this.lifecount,
		}
	}

	onStoreClose() {
		if (this.moneyspend !== 0) {
			this.sendPurchaseData()
		}
		this.tokenbought = 0
		this.lifecount = 0
		this.moneyspend = 0
	}

	onStoreOpen() {
		this.tokencount = Math.floor(this.data.money / this.tokenprice)
		if (this.tokencount <= 0) {
			$("#buytoken").off()
		}
	}

	updateTokenCount(val) {
		this.tokencount = Math.floor((this.data.money / this.tokenprice) * (val / 100))
	}

	getLifePrice() {
		return Math.pow(2, this.data.lifeBought) * 150
	}
	buyLife() {
		let lifeprice = Math.pow(2, this.data.lifeBought) * 150
		if (this.data.money > lifeprice) {
			this.data.lifeBought += 1

			this.moneyspend += lifeprice
			this.lifecount += 1

			this.data.spendMoney(lifeprice)
			this.data.updateLife(this.data.life + 1)
		}
	}

	/**
	 * 1 1%
	 * 5 4%
	 * 10 5%
	 * 20 45%
	 * 25 25%
	 * 30 20%
	 */
	setTokenPrice() {
		// if (tokenprice > 0) {
		// 	return
		// }
		let r = Math.random()
		let tokenprice = 30
		if (r < 0.01) {
			tokenprice = 1
		} else if (r < 0.05) {
			tokenprice = 5
		} else if (r < 0.2) {
			tokenprice = 10
		} else if (r < 0.55) {
			tokenprice = 20
		} else if (r < 0.8) {
			tokenprice = 25
		}
		return Math.floor(tokenprice * this.data.priceMultiplier)
	}

	getPrice(item_id, predicted_itemlist) {
		let thisitem = GAME.strRes.ITEMS.items[item_id]
		return Math.floor((thisitem.price - this.calcDiscount(item_id, predicted_itemlist)) * this.data.priceMultiplier)
	}

	//item_id:  0~
	canbuy(item_id) {
		let thisitem = GAME.strRes.ITEMS.items[item_id]
		let predicted_itemlist = Array.from(this.data.itemSlots)

		let actual_price = this.getPrice(item_id, predicted_itemlist)
		return (
			this.data.money >= actual_price && !this.isItemLimitExceeded(predicted_itemlist) && this.checkStoreLevel(thisitem)
		)
	}
	/**
	 * 첫번째 상점에선 2등급이상아이템 구입불가
	 * @param {} item
	 */
	checkStoreLevel(item) {
		if (GAME.myStat.level <= 2 && item.itemlevel >= 2) {
			return false
		}
		return true
	}

	isItemLimitExceeded(predicted_itemlist) {
		// let emptyslots = predicted_itemlist.reduce((total, curr) => {
		// 	return total + (curr === -1 ? 1 : 0)
		// }, 0)

		return !predicted_itemlist.includes(EMPTY)

		//빈칸이 하나도없으면
		// return emptyslots < 1
	}

	//tobuy:number 0~    temp_itemlist:[]
	calcDiscount(tobuy, predicted_itemlist) {
		let thisitem = this.data.itemList[tobuy]

		if (thisitem.children.length === 0) {
			return 0
		}
		let discount = 0
		//c:number   start with 1
		for (let c of thisitem.children) {
			if (!predicted_itemlist.includes(c)) {
				discount += this.calcDiscount(c, predicted_itemlist)
			} else {
				discount += this.data.itemList[c].price
				predicted_itemlist = this.removeItem(predicted_itemlist, c)
			}
		}
		return discount
	}

	/**
	 *
	 * @param {*} item_id
	 * @returns {price,canbuy}
	 */
	getPriceAndCanbuy(item_id) {
		let thisitem = this.data.itemList[item_id]
		let predicted_itemlist = Array.from(this.data.itemSlots)

		let actual_price = this.getPrice(item_id, predicted_itemlist)
		return {
			price: actual_price,
			canbuy: !this.isItemLimitExceeded(predicted_itemlist) && this.checkStoreLevel(thisitem),
		}
	}

	addItemToMySlot(item_id) {
		this.data.item[this.data.item.indexOf(EMPTY)] = item_id
		this.updateRelatedItemPrices(item_id)
		this.updateItemDetail()
	}
	removeItemFromMySlot(item_id) {
		this.data.item[this.data.item.indexOf(item_id)] = EMPTY
		this.updateRelatedItemPrices(item_id)
		this.updateItemDetail()
	}

	updateRelatedItemPrices(item_id) {
		for (let a of this.getAllAncestors(item_id).concat(this.getAllChildren(item_id))) {
			let state = this.getPriceAndCanbuy(a)
			this.data.itemPrices[a] = state.price
			this.data.itemAvaliablity[a] = state.canbuy
		}
	}

	updateAllItemPrices() {
		for (let item of this.data.itemList) {
			let state = this.getPriceAndCanbuy(item.id)
			this.data.itemPrices[item.id] = state.price
			this.data.itemAvaliablity[item.id] = state.canbuy
		}
	}

	/**
	 *
	 * @param {*} item_id
	 * @returns index list of all ancestor items
	 */
	getAllAncestors(item_id) {
		let list = [item_id]
		let ancestors = []
		while (list.length > 0) {
			let p = list.shift()
			list = list.concat(this.data.itemList[p].parents)
			//console.log("getAllAncestors list" + this.data.itemList[p].parents)
			ancestors.push(p)
		}
		//console.log("getAllAncestors" + ancestors)
		return ancestors
	}
	/**
	 *
	 * @param {*} item_id
	 * @returns index list of all children items
	 */
	getAllChildren(item_id) {
		let list = [item_id]
		let children = []
		while (list.length > 0) {
			let p = list.shift()
			list = list.concat(this.data.itemList[p].children)
			//console.log("getAllchildren list" + this.data.itemList[p].children)
			children.push(p)
		}
		//console.log("getAllAncestors" + children)
		return children
	}

	/**
	 *
	 * @param {*} itemslots
	 * @param {*} item  0~
	 * @returns
	 */
	addItem(itemslots, item) {
		if (itemslots.indexOf(EMPTY) < 0) return

		itemslots[itemslots.indexOf(EMPTY)] = item
		//console.log("additem" + itemslots)
		return itemslots
	}
	/**
	 *
	 * @param {*} itemslots
	 * @param {*} item 0~
	 * @returns
	 */
	removeItem(itemslots, item) {
		if (itemslots.indexOf(item) < 0) return

		itemslots[itemslots.indexOf(item)] = EMPTY
		return itemslots
	}
}

/**
 * 5:3%
 * 10:10%
 * 20 35%
 * 30 30%
 * 40 10%
 * 50 5%
 * 60 5%
 * 70 2%
 * 80 2%
 * 100 1%
 */
function getTokenSellPrice() {
	let r = Math.random()
	let price = 100
	if (r < 0.03) {
		price = 5
	}
	if (r < 0.1) {
		price = 10
	} else if (r < 0.45) {
		price = 20
	} else if (r < 0.75) {
		price = 30
	} else if (r < 0.85) {
		price = 40
	} else if (r < 0.9) {
		price = 50
	} else if (r < 0.95) {
		price = 60
	} else if (r < 0.97) {
		price = 70
	} else if (r < 0.99) {
		price = 80
	}
	return price
}
