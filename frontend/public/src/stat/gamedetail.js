/**
 * set player table`s item list
 * @param {*} turn
 * @param {*} item
 */
function setItemList(turn, item, isZeroIndex) {
	//console.log(turn)
	let text = ""

	//for legacy format support
	if (item.length > 20) {
		item = convertCountToItemSlots(item, isZeroIndex)
	}
	let i = 0
	for (let it of item) {
		i += 1
		if (it === -1) {
			text += "<div class='toast_itemimg scalable'><img alt='empty' src='res/img/store/emptyslot.png'> </div>"
		} else {
			text +=
				"<div class='toast_itemimg item_tooltip scalable' value=" +
				it +
				"><img alt='item' src='res/img/store/items.png' style='margin-left: " +
				-1 * it * 100 +
				"px'; > </div>"
		}
		if (i > 0 && i % 6 === 0) text += "<br>"
	}

	$(itemLists[turn]).html("<div class=itemlist_container>" + text + "</div>")
}

function drawKillRecord(data) {
	//if there is no record
	if (data.killRecord.length === 0) {
		$(".detailbtn:nth-child(3)").hide()
		return
	} //<b>&#10140;</b>
	let count = 1
	$(".detailbtn:nth-child(3)").show()
	let turn = data.killRecord[0].turn
	let str = "<div class='killframewrapper'>"
	for (let k of data.killRecord) {
		if (k.turn !== turn) {
			str += "<b>" + chooseLang("턴 ", "Turn ") + String(turn) + "</b>" + "</div>"
			turn = k.turn
			if (count % 12 === 0) str += "<br>"
			count += 1
			str += "<div class='killframewrapper'>"
		}
		str +=
			"<div class='killframe'><div class='charframe'><img alt='char' src='" + getChampImgofTurn(data, k.killer) + "'>"
		if (k.killer >= 0) {
			str += "<b class='charframetxt'>" + (k.killer + 1) + "P</b>"
		} else {
			str += "<b class='charframetxt'>EX</b>"
		}
		str +=
			"</div><img alt='char' src='res/img/ui/basicattack.png'><div class='charframe2'><img src='" +
			getChampImgofTurn(data, k.dead) +
			"'><b class='charframetxt'>" +
			(k.dead + 1) +
			"P</b></div></div><br>"
	}

	str += "<b>" + chooseLang("턴 ", "Turn ") + String(turn) + "</b>" + "</div>"

	$("#killRecordContent").html(str)
}

function multiKillText(count) {
	let multiKillText = ""
	if (count >= 2) {
		multiKillText = "<br><b class='multikill-text' lkey='multikill.double'>" + LOCALE.multikill.double + "</b>"
	}
	if (count >= 3) {
		multiKillText = "<br><b class='multikill-text' lkey='multikill.triple'>" + LOCALE.multikill.triple + "</b>"
	}
	if (count >= 4) {
		multiKillText = "<br><b class='multikill-text' lkey='multikill.quad'>" + LOCALE.multikill.quad + "</b>"
	}
	if (count >= 5) {
		multiKillText = "<br><b class='multikill-text' lkey='multikill.penta'>" + LOCALE.multikill.penta + "</b>"
	}
	return multiKillText
}
/**
 * display single game data
 * @param {*} data
 */
function showSingleStat(data) {
	$("#overlay").addClass("visible")
	onGameDetailShow()
	let damagetakenC_graph = []
	let damagetakenO_graph = []
	let damagedealt_graph = []
	let heal_graph = []
	let gold_graph = []
	let kda_graph = []
	let damageabsorbed_graph = []
	let position_list = []
	let money_list = []
	let respawnpos_list = []
	let visiblePlayerNames = []
	let ranks = $(".rank").toArray()
	$(table[3]).show()
	$(table[4]).show()
	$(othertable[3]).show()
	$(othertable[4]).show()
	$(itembuildTable[2]).show()
	$(itembuildTable[3]).show()
	// $(".detailbtn:nth-child(1)").html(chooseLang("상세 통계", "Details"))
	// $(".detailbtn:nth-child(2)").html(chooseLang("아이템 빌드", "Item Build"))
	// $(".detailbtn:nth-child(3)").html(chooseLang("킬/데스", "Kill/Death"))
	// $(".detailbtn:nth-child(4)").html(chooseLang("위치", "Position"))
	// $(".detailbtn:nth-child(5)").html(chooseLang("돈", "Money"))
	let smallGraphTypes = $(".game-detail-graph-type").toArray()
	$(smallGraphTypes[0]).html(LOCALE.smallgraph.dmgdealt)
	$(smallGraphTypes[1]).html(LOCALE.smallgraph.playerdmg)
	$(smallGraphTypes[2]).html(LOCALE.smallgraph.obsdmg)
	$(smallGraphTypes[3]).html(LOCALE.smallgraph.heal)
	$(smallGraphTypes[4]).html(LOCALE.smallgraph.money)
	$(smallGraphTypes[5]).html(LOCALE.smallgraph.reduce)
	let gameDetailValues = $(".game-detail-value").toArray()
	$("#train_detail").hide()
	$("#stattable").show()
	// $("#detailbtn_container").show()
	if (!data.replay || data.replay === "") {
		$("#replay").hide()
	} else {
		$("#replay").show()
		$("#replay-btn").click(() => {
			window.location.href = "/rpggame?isreplay=true&replayid=" + data.replay
		})
	}
	$("#train_detail p").html("")
	let isLegacy = false

	if (data.version >= 2) {
		$(".detailbtn:nth-child(4)").show()
		$(".detailbtn:nth-child(5)").show()
		if (data.players[0].positionRecord.length === 1) {
			$("#position_chart").hide()
			$(".detailbtn:nth-child(4)").hide()
		}
		if (data.players[0].moneyRecord.length === 1) {
			$("#money_chart").hide()
			$(".detailbtn:nth-child(5)").hide()
		}
		for (let i = 0; i < data.players[0].positionRecord.length; ++i) {
			let pos = {
				category: i,
				value1: -10,
				value2: -10,
				value3: -10,
				value4: -10,
			}
			for (let j = 0; j < data.players.length; ++j) {
				let p = data.players[j].positionRecord[i]
				pos["value" + String(j + 1)] = p
			}

			position_list.push(pos)
		}
		for (let i = 0; i < data.players[0].moneyRecord.length; ++i) {
			let money = {
				category: i,
				value1: -1000,
				value2: -1000,
				value3: -1000,
				value4: -1000,
			}
			for (let j = 0; j < data.players.length; ++j) {
				let p = data.players[j].moneyRecord[i]
				money["value" + String(j + 1)] = p
			}

			money_list.push(money)
		}

		if (data.map_data != null) {
			for (let i = 1; i < data.map_data.respawn.length; ++i) {
				let value = data.map_data.respawn[i]
				if (value > data.map_data.finish) {
					break
				} else {
					respawnpos_list.push({
						value: value,
						label: {
							text: String(value),
							fill: "#ffffff",
						},
						grid: {
							strokeOpacity: 1,
							stroke: "#707070",
							strokeWidth: 1,
						},
					})
				}
			}
			respawnpos_list.push({
				value: data.map_data.finish,
				label: {
					text: String(data.map_data.finish),
					fill: "#ffffff",
				},
				grid: {
					strokeOpacity: 1,
					stroke: "#707070",
					strokeWidth: 1,
				},
			})
		}
		$(".player-data-container").remove()
		$(".tall-dummy-gamedetail").remove()
		for (let i = 0; i < data.players.length; ++i) {
			// $(itembuildTable[i]).children(".itembuildTableName").html(data.players[i].name)
			const p = data.players[i]
			//if there is no record
			let itemstr = ""
			if (p.itemRecord.length > 0) {
				$(".detailbtn:nth-child(2)").show()
				let turn = p.itemRecord[0].turn
				itemstr = "<a class='itemrecord-text'>" + turn + chooseLang("턴", "T") + "</a><div class='itemrecord-item'>"
				for (let item of p.itemRecord) {
					if (item.turn !== turn) {
						itemstr +=
							"</div><a class='itemrecord-text'>&#10140;  " +
							item.turn +
							chooseLang("턴", "T") +
							"</a><div class='itemrecord-item'>"
						turn = item.turn
					}
					for (let j = 0; j < item.count; ++j) {
						itemstr +=
							"<div class='toast_itemimg_itembuild item_tooltip scalable' value=" +
							item.item_id +
							"><img alt='item' src='res/img/store/items.png' style='margin-left: " +
							-1 * item.item_id * 100 +
							"px'; > </div>"
					}
				}
				itemstr += "</div>"
			} else {
				$(".detailbtn:nth-child(2)").hide()
			}

			// $(".itembuildTableContent").html(str)
			let teamstr = ""
			if (data.isTeam) {
				teamstr = `<b class='player-data-header-team ${p.team ? "red" : "blue"}'>${p.team ? "Red" : "Blue"} Team</b>`
			}
			let str = `
			<div class="player-data-container">
				<div class="player-data-header"> 
					<img alt='char' src="${getCharImgUrl(p.champ_id)}">
					<b>${p.name}</b>
					${teamstr}
				</div>
				<div class="player-data-content"> 
					<div class="player-data-otherstat">
						<div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name" lkey="playerdetail_data.moneyspent"> ${
									LOCALE.playerdetail_data.moneyspent
								}: </b><b class="otherstat-value">${p.stats[5]} </b>
							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name" lkey="playerdetail_data.moneytaken"> ${
									LOCALE.playerdetail_data.moneytaken
								}: </b><b class="otherstat-value">${p.stats[6]} </b>

							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name" lkey="playerdetail_data.revive"> ${
									LOCALE.playerdetail_data.revive
								}: </b><b class="otherstat-value">${p.stats[8]} </b>
							</div>
						</div>
						<div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name" lkey="playerdetail_data.forcemove"> ${
									LOCALE.playerdetail_data.forcemove
								}: </b><b class="otherstat-value">${p.stats[9]} </b>
							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name" lkey="playerdetail_data.basicattack"> ${
									LOCALE.playerdetail_data.basicattack
								}: </b><b class="otherstat-value">${p.stats[10]} </b>
							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name" lkey="playerdetail_data.execute"> ${
									LOCALE.playerdetail_data.execute
								}: </b><b class="otherstat-value">${p.stats[11]} </b>
							</div>
						</div>
					</div>
					${
						itemstr === ""
							? ""
							: `
						<div class="player-data-label" lkey="charpage.itembuild">${LOCALE.charpage.itembuild}</div>
						<div class="itembuildTableContent">
							${itemstr}
						</div>
					`
					}
				</div>
			</div>
			`
			$("#game_detail_content").append(str)

			//player-detail-content
		}
		$("#game_detail_content").append(`<div class="tall-dummy tall-dummy-gamedetail"></div>`)

		drawKillRecord(data)
		// $("#detailbtn_container").show()
		$(gameDetailValues[0]).html(data.totalturn)
		$(gameDetailValues[2]).html(getMapName(data.map_data.name))

		let itemlimit = getSetting(data, "itemLimit")
		$(gameDetailValues[3]).html(!itemlimit ? 6 : itemlimit)
		let coldGame = getSetting(data, "coldGame")
		$(gameDetailValues[4]).html(!coldGame ? LOCALE.disabled : LOCALE.enabled)
		let useAdditionalLife = getSetting(data, "useAdditionalLife")
		$(gameDetailValues[5]).html(!useAdditionalLife ? LOCALE.disabled : LOCALE.enabled)
		// $("#game_resulttext").html("Total turn:" + data.totalturn + ", Map: "+getMapName(data.map_data.name))
	} else {
		$("#game_resulttext").html("Total turn:" + data.totalturn)
		$("#detailbtn_container").hide()
		isLegacy = true
	}

	if (data.players.length < 4) {
		$(table[4]).hide()
		// $(othertable[4]).hide()
		// $(itembuildTable[3]).hide()
	}
	if (data.players.length < 3) {
		$(table[3]).hide()
		// $(othertable[3]).hide()
		// $(itembuildTable[2]).hide()
	}

	if (data.isTeam && data.players[0].team === true) {
		$(gameDetailValues[1]).html("Red Team")

		// $("#resulttext").html("Blue Team Victory!")
	} else if (data.isTeam !== null && data.players[0].team === false) {
		// $("#resulttext").html("Red Team Victory!")
		$(gameDetailValues[1]).html("Blue Team")
	} else {
		$(gameDetailValues[1]).html(data.players[0].name)
		$("#resulttext").html("")
	}

	let dataList = $(".statTableCell").toArray()
	$(".statTableCell").removeClass("red")
	$(".statTableCell").removeClass("blue")
	let winner_team = true
	for (let i = 0, k = 0; i < data.players.length; ++i, k += 5) {
		if (data.map_data != null && data.map_data.name === "train") {
			writeTrainStats(data.totalturn, data.players[i])
		}

		let p = data.players[i]
		visiblePlayerNames.push(p.turn + 1 + "P(" + p.champ + ")")

		setItemList(i, p.items, data.version >= 2)

		let charstr = '<div class="charimg table_charimg '

		//팀전
		if (data.isTeam) {
			if (p.team) {
				charstr += "red"
				$(dataList[k + 2]).addClass("red")
				$(dataList[k + 3]).addClass("red")
			} else {
				charstr += "blue"
				$(dataList[k + 2]).addClass("blue")
				$(dataList[k + 3]).addClass("blue")
			}

			if (i === 0) {
				winner_team = p.team
			}
			if (p.team !== winner_team) {
				charstr += " lose_team"
				$(ranks[i]).html("LOSE")
			} else {
				$(ranks[i]).html("WIN")
			}
		} else {
			//개인전
			$(ranks[i]).html(i + 1)
			if (i === 0) {
				$(ranks[i]).html("<img class=winimg src='res/img/svg/trophy.svg'>")
				// charstr += " winner"
			} else if (i === 1) $(ranks[i]).html("2<sup>nd</sup>")
			else if (i === 2) $(ranks[i]).html("3<sup>rd</sup>")
			else $(ranks[i]).html("4<sup>th</sup>")
		}

		charstr += '"><img alt="char" src="' + getCharImgUrl(p.champ_id) + '"></div>'

		$(dataList[k + 1]).html(charstr)
		$(dataList[k + 2]).html(p.name)
		$(dataList[k + 3]).html(
			p.kda[0] +
				"/" +
				p.kda[1] +
				"/" +
				p.kda[2] +
				(multiKillText(p.bestMultiKill) === "" ? "" : multiKillText(p.bestMultiKill))
		)

		kda_graph.push({
			category: p.turn + 1 + "P(" + p.champ + ")",
			k: (p.kda[0] + p.kda[2]) / Math.max(1, p.kda[1]),
		})
		for (let j = 0; j < p.stats.length; ++j) {
			//$(dataList[k + j + 4]).html(p.stats[j])

			let graphData = {
				turn: p.turn,
				champ: p.champ_id,
				value: p.stats[j],
			}
			switch (j) {
				case 0:
					damagetakenC_graph.push(graphData)
					break
				case 1:
					damagetakenO_graph.push(graphData)
					break
				case 2:
					damagedealt_graph.push(graphData)
					break
				case 3:
					heal_graph.push(graphData)
					break
				case 4:
					gold_graph.push(graphData)
					break
				case 7:
					damageabsorbed_graph.push(graphData)
					break
			}
		}
	}

	$(".game-detail-graph-amount").css("width", "0")
	drawSmallGraph(damagedealt_graph, 0)
	drawSmallGraph(damagetakenC_graph, 1)
	drawSmallGraph(damagetakenO_graph, 2)
	drawSmallGraph(heal_graph, 3)
	drawSmallGraph(gold_graph, 4)
	drawSmallGraph(damageabsorbed_graph, 5)

	// let otherDataList = $(".otherTableCell").toArray()

	// for (let i = 0, k = 0; i < data.players.length; ++i, k += 7) {
	// 	let p = data.players[i]
	// 	if (p.stats.length < 9) continue

	// 	$(otherDataList[k]).html(p.name)

	// 	$(otherDataList[k + 1]).html(p.stats[5])
	// 	$(otherDataList[k + 2]).html(p.stats[6])
	// 	$(otherDataList[k + 3]).html(p.stats[8])
	// 	$(otherDataList[k + 4]).html(p.stats[9])
	// 	$(otherDataList[k + 5]).html(p.stats[10])
	// 	$(otherDataList[k + 6]).html(p.stats[11])
	// }
	addItemTooltipEvent()
	$(".itemlist").css("font-size", "20px")

	const pchartconfig = structuredClone(PositionChartConfig)

	const mchartconfig = structuredClone(MoneyChartConfig)

	const kchartconfig = structuredClone(KDAChartConfig)

	pchartconfig.yAxes[0].axisRanges = respawnpos_list
	pchartconfig.data = position_list
	pchartconfig.titles[0].text = LOCALE.graph.position
	mchartconfig.data = money_list
	mchartconfig.titles[0].text = LOCALE.graph.money
	kchartconfig.data = kda_graph
	kchartconfig.titles[0].text = LOCALE.graph.kda
	for (let i = 0; i < 4; ++i) {
		pchartconfig.series[i].name = visiblePlayerNames[i]
	}
	for (let i = 0; i < 4; ++i) {
		mchartconfig.series[i].name = visiblePlayerNames[i]
	}
	am4core.createFromConfig(kchartconfig, document.getElementById("kdaGraph"))
	am4core.createFromConfig(pchartconfig, document.getElementById("position_chart"))
	am4core.createFromConfig(mchartconfig, document.getElementById("money_chart"))
	document.getElementById("game_detail").scrollTo(0, 0)
	$("#game_detail").show()
	setTimeout(() => $("#overlay").removeClass("visible"), 400)
}
