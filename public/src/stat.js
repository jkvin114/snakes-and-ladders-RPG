const ip = "http://" + sessionStorage.ip_address
let table = []
let othertable = []
let itembuildTable = []
let statData = []
let LANG = sessionStorage.language
let itemLists = []
let playerNameLists = []

let SETTING = null
let ITEMS = null

class InterfaceState {
	constructor() {
		InterfaceState.gamelist_hidden = false
		InterfaceState.gamelist_hidden_smallscreen = true
		InterfaceState.gamelist_maximized = false
		InterfaceState.page_type = ""
		InterfaceState.page_start = 0
		InterfaceState.page_max = 12
		InterfaceState.current_page = 0
		InterfaceState.page_direction = "next"
	}
}
const chooseLang = function (kor, eng) {
	if (LANG === "kor") return kor
	return eng
}
function changelang() {
	$(".lang_dropdown").show()	
}

/**
 * called right after finishing simulation or game
 * used to display immediate results
 * @param {*} params url query string
 */
function requestStatAfterGame(params) {
	console.log(params)
	$("#main").css("grid-template-columns", "auto")
	$.get(ip + "/stat/result?" + params).done((data) => showStat(data))
}
function requestSimulationSummary(start, count) {
	$.get(ip + "/stat/simulation/summary?start=" + start + "&count=" + count).done((data) =>
		onReceiveSimulationSummary(data)
	)
}
function requestGames(start, count) {
	$.get(ip + "/stat/game?start=" + start + "&count=" + count).done((data) => onReceiveGames(data))
}
function requestOneSimulationList(id) {
	$.get(ip + "/stat/simulation/gamelist?statid=" + id).done((data) => onReceiveOneSimulationList(data))
}

function requestOneGameInSimulation(id, index) {
	$.get(ip + "/stat/simulation/game?statid=" + id + "&index=" + index).done((data) =>
		onReceiveOneGameInSimulation(data)
	)
}

function onPageResponse(success) {
	if (success) {
	} else {
		if ((InterfaceState.page_direction = "next")) {
			InterfaceState.current_page -= 1
		} else if ((InterfaceState.page_direction = "prev")) {
			InterfaceState.current_page += 1
		}
		alert("End of page")
	}
	console.log(InterfaceState.page_direction, InterfaceState.current_page)
	$("#pagenum").html(InterfaceState.current_page + 1)
}

function onReceiveGames(data) {
	if (!data) {
		onPageResponse(false)
		return
	}

	onPageResponse(true)
	InterfaceState.page_type = "games"
	showStat(data)
}

function getlockedTeam(char, teamlock) {
	if (teamlock[0].includes(char)) return "red"
	else if (teamlock[1].includes(char)) return "blue"
	else return ""
}
/**
 * displays simulation summary
 * @param {*} data
 */
function onReceiveSimulationSummary(data) {
	if (!data) {
		onPageResponse(false)
		return
	}
	onPageResponse(true)
	InterfaceState.page_type = "simulations"

	$("#summary").removeClass("hidden")
	$("#intro").hide()
	$("#holder").hide()
	data = JSON.parse(data)
	let str = ""
	for (const s of data) {
		let teamlock = getSetting(s, "teamLock")
		if (!teamlock || teamlock.length === 0) teamlock = [[], []]

		str += '<div class="summary_item"><div class="summary_characters">'
		if (s.setting.length > 0) {
			for (let c of getSetting(s, "characterPool")) {
				str +=
					'<div class="summary_char_icon ' +
					getlockedTeam(c, teamlock) +
					'"><img src="' +
					getCharImgUrl(c) +
					'"></div>  '
			}
			for (let c of getSetting(s, "lockedCharacters")) {
				str +=
					'<div class="summary_char_icon locked ' +
					getlockedTeam(c, teamlock) +
					'"><img src="' +
					getCharImgUrl(c) +
					'"></div>  '
			}

			str +=
				'</div><div class="summary_detail"><img src="res/img/svg/chart.svg" value="' +
				s.id +
				'" class="show_detail summary_detail_btn summary_to_detail"></div><div>'

			for (let m of getSetting(s, "mapPool")) {
				str += '<div class="summary_map_icon" title="Map Type: '+getMapName(m)+'"><img src="' + getMapIconUrl(m) + '"></div>  '
			}
			str += "</div><div>"
			if (getSetting(s, "isTeam")) {
				str += '<img src="res/img/ui/team_black.png"  title="Team Game">'
				if (getSetting(s, "divideTeamEqually")) {
					str += '<img src="res/img/ui/equal.png"  title="Divided team equally">'
				}
			}
			if (getSetting(s, "allowMirrorMatch")) {
				str += '<img src="res/img/ui/mirror.png"  title="Allowed mirror match">'
			}
			str += '</div><div><img src="res/img/svg/num.svg"  title="Game count">:' + s.count + '  <img src="res/img/svg/users.svg"  title="Player count per game">:'
			if (getSetting(s, "randomizePlayerNumber")) {
				str += "?"
			} else {
				str += getSetting(s, "playerNumber")
			}
			str += "</div></div>"
		} else {
			//if there is no setting stored in data
			str +=
				'</div><div class="summary_detail"><img src="res/img/svg/chart.svg" value="' +
				s.id +
				'" class="show_detail summary_detail_btn summary_to_detail"></div>' +
				'<div><img src="res/img/svg/num.svg">:' +
				s.count +
				"</div></div>"
		}
	}
	for (let i = 0; i < 5; ++i) {
		str += '<div class="summary_item dummy"></div>'
	}
	$("#summary").html(str)
	$(".summary_to_detail").click(function () {
		requestStatById($(this).attr("value"))
	})
}

function requestStatById(id) {
	let xhr = $.get(ip + "/stat/simulation?statid=" + id)

	xhr.done((data) => {
		window.location.href = "#gamelist"
		showStat(data)
	})
}
function requestGlobalSetting() {
	let xhr = $.get(ip + "/resource/globalsetting")

	xhr.done((data) => {
		data = JSON.parse(data)
		SETTING = data

		let params = document.location.href.split("?")[1]
		if (params) requestStatAfterGame(params)
		
	})
}
function requestItem() {
	let xhr = $.get(ip + "/resource/item")

	xhr.done((data) => {
		data = JSON.parse(data)
		ITEMS = data.items
	})
}
/**
 * get item description for tooltip
 * @param {*} item
 * @returns
 */
function getItemDescription(item) {
	let ability = ""
	for (let a of item.ability) {
		let ab = "<a class=ability_name>" + chooseLang(a.type_kor, a.type) + "</a> +" + a.value

		if (a.type === "addMdmg" || a.type === "skillDmgReduction" || a.type === "absorb" || a.type === "obsR") {
			ab += "%"
		}
		ability += ab
		ability += "<br>"
	}
	if (item.unique_effect != null) {
		ability += `<b class=unique_effect_name>[${chooseLang("고유지속효과", "unique passive")}]</b>:
			 ${chooseLang(item.unique_effect_kor, item.unique_effect)}`
		if(item.active_cooltime!=null){
			ability+=chooseLang(`(쿨타임 ${item.active_cooltime}턴)`,`(cooltime ${item.active_cooltime} turns)`)
		}
	}
	ability += "<br><br>" + chooseLang("가격: ", "price: ") + "<b class=price>" + String(item.price) + "</b>"
	return ability
}
/**
 * register item tooltip event
 */
function addItemTooltipEvent() {
	$(".item_tooltip").off()
	$(".item_tooltip").mouseenter(function (e) {
		$(".tooltiptext")
			.css({
				visibility: "visible"
			})
			.css($(this).offset())
		

		if($(this).offset().left < window.innerWidth/2){
			$(".tooltiptext").removeClass("rightside")
			$(".tooltiptext").addClass("leftside")
		}
		else{
			$(".tooltiptext").removeClass("leftside")
			$(".tooltiptext").addClass("rightside")
		}

		let item = ITEMS[Number($(this).attr("value"))]
		$(".tooltiptext h4").html(chooseLang(item.kor_name, item.name))
		$(".tooltiptext p").html(getItemDescription(item))
	})
	$(".item_tooltip").mouseleave(function (e) {
		$(".tooltiptext").css("visibility", "hidden")
	})
}
$(document).ready(function () {
	itemLists = $(".itemlist").toArray()
	playerNameLists = $(".playername").toArray()
	table = $(".statTableRow").toArray()
	othertable = $(".otherTableRow").toArray()
	itembuildTable = $(".itembuildTableRow").toArray()
	let is = new InterfaceState()
	$("#stattable").hide()
	$("#detailbtn_container").hide()
	$("#summary_navbar").hide()
	requestGlobalSetting()
	requestItem()

	addItemTooltipEvent()
	$(".dropitem").click(function(){
		$(".lang_dropdown").hide()
		let lang=$(this).attr("value")
		LANG=lang
	  })

	  $("#toggle_fullscreen").click(()=>{
	//	console.log($(this).data("on"))
		if(!$(this).data("on")){
		  
		  document.documentElement.requestFullscreen()
		  $(this).data("on",true)
		}
		else {
		  document.exitFullscreen()
		  $(this).data("on",false)
		}
	  })

	$(".intro_simulation").click(function () {
		window.scrollTo(0,0)
		$("#sidebar").css({left:"-50%"})
		requestSimulationSummary(0, InterfaceState.page_max)
		$("#summary_navbar").show()
		//console.log("intro")
	})
	$(".intro_game").click(function () {
		requestGames(0, InterfaceState.page_max)
		window.scrollTo(0,0)
		$("#sidebar").css({left:"-50%"})
		$("#summary_navbar").show()
	})
	$(".quit").click(function () {
		window.location.href = "index.html"
	})
	$(".reset").click(function () {
		window.location.href = "/statpage.html"
	})
	$("#gotop").click(function () {
		location.href = "#"
	})
	$(".prevpage").click(function () {
		if (InterfaceState.current_page === 0) {
			return
		}
		InterfaceState.page_direction = "prev"
		InterfaceState.current_page -= 1
		if (InterfaceState.page_type === "simulations") {
			requestSimulationSummary(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
		} else if (InterfaceState.page_type === "games") {
			requestGames(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
		}
	})
	$(".nextpage").click(function () {
		InterfaceState.page_direction = "next"
		InterfaceState.current_page += 1
		if (InterfaceState.page_type === "simulations") {
			requestSimulationSummary(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
		} else if (InterfaceState.page_type === "games") {
			requestGames(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
		}
	})

	$("#togglelist").click(function () {
		if (InterfaceState.gamelist_hidden) {
			$("#gamelist_wrapper").show()
			if (window.innerWidth > 1300) {
				$(this).css("left", "426px")

				$("#main").css("grid-template-columns", "420px auto")
			} else if (window.innerWidth > 900) {
				$(this).css("left", "226px")
				$("#main").css("grid-template-columns", "220px auto")
			}
			InterfaceState.gamelist_hidden = false
		} else {
			$("#gamelist_wrapper").hide()
			$(this).css("left", "0")
			$("#main").css("grid-template-columns", "auto")
			InterfaceState.gamelist_hidden = true
		}
	})

	//for small screen
	$("#listhidebtn").click(function () {
		if (!InterfaceState.gamelist_hidden_smallscreen) {
			$("#gamelist_wrapper").css("height", "320px")
			$(this).css("transform", "rotate(270deg)")
			window.location.href = "#main_start"
			InterfaceState.gamelist_hidden_smallscreen = true
		} else {
			$("#gamelist_wrapper").css("height", "100%")
			$(this).css("transform", "rotate(90deg)")

			InterfaceState.gamelist_hidden_smallscreen = false
		}
	})
	$("#maximize_list_btn").click(function () {
		if (InterfaceState.gamelist_maximized) {
			if (window.innerWidth > 1300) {
				$("#main").css("grid-template-columns", "420px auto")
			} else if (window.innerWidth > 900) {
				$("#main").css("grid-template-columns", "220px auto")
			}
			InterfaceState.gamelist_maximized = false
			$(this).attr("src", "res/img/svg/maximize.svg")
		} else {
			InterfaceState.gamelist_maximized = true
			$("#main").css("grid-template-columns", "auto")
			$(this).attr("src", "res/img/svg/push.svg")
			$(this).css("transform", "rotate(180deg)")
		}
	})
	$(".detailbtn").click(function () {
		let v = $(this).val()
		$("#otherstattable").css({ visibility: "collapse" })
		$("#itembuildTable").css({ visibility: "collapse" })
		$("#position_chart").hide()
		$("#money_chart").hide()
		$("#killRecordTable").css({ display: "none" })
		switch (Number(v)) {
			case 1:
				$("#otherstattable").css({ visibility: "visible" })
				break
			case 2:
				$("#itembuildTable").css({ visibility: "visible" })
				break
			case 3:
				$("#killRecordTable").css({ display: "inline-block" })
				break
			case 4:
				$("#position_chart").show()
				break
			case 5:
				$("#money_chart").show()
				break
		}
	})

	let holder = document.getElementById("holder")

	holder.ondragover = function () {
		this.className = "hover"
		return false
	}
	holder.ondragend = function () {
		this.className = ""
		return false
	}
	holder.ondrop = function (e) {
		this.className = ""
		e.preventDefault()

		let file = e.dataTransfer.files[0],
			reader = new FileReader()
		reader.onload = function (event) {
			try {
				showStat(event.target.result)
			} catch (e) {
				console.error(e)
				alert("invaild file!")
			}
		}
		reader.readAsText(file)

		return false
	}
	$("#sidebarbtn").click(function(){
		$("#sidebar").animate({left:0},500)
	})
	$("#close_sidebar").click(function(){
		$("#sidebar").animate({left:-700},500,function(){
			$("#sidebar").css({left:"-50%"})
		})
	})
})

function setItem(num, list, names) {
	let str = ""
	for (let i = 0; i < list.length; ++i) {
		if (list[i] > 0) {
			str += names[i] + "x" + list[i] + "    "
		}
	}
	$(".itemlist").append(num + 1 + "P Items have: " + str + "<br>")
}

function convertCountToItemSlots(items) {
	let itemslot = []
	for (let i = 0; i < items.length; ++i) {
		for (let j = 0; j < items[i]; ++j) {
			itemslot.push(i)
		}
	}
	return itemslot
}
function setItemList(turn, item) {
	//console.log(turn)
	let text = ""
	if (item.length > 10) {
		item = convertCountToItemSlots(item)
	}
	for (let it of item) {
		if (it === -1) {
			text += "<div class='toast_itemimg'><img src='res/img/store/emptyslot.png'> </div>"
		} else {
			text +=
				"<div class='toast_itemimg item_tooltip' value=" +
				it +
				"><img src='res/img/store/items.png' style='margin-left: " +
				-1 * it * 100 +
				"px'; > </div>"
		}
	}

	$(itemLists[turn]).html(text)

	// $(".toast_itemimg").css({
	// 	margin: "-30px",
	// 	width: "100px",
	// 	overflow: "hidden",
	// 	height: "100px",
	// 	display: "inline-block",
	// 	transform: "scale(0.4)"
	// })
}

function getPlayerName(rank, data) {
	if (data.players[rank].name == null) {
		return ""
	} else {
		return data.players[rank].name
	}
}
/**
 * get character img url for each character
 * @param {*} champ_id
 * @returns
 */
function getCharImgUrl(champ_id) {
	return "res/img/character/" + SETTING.characters[champ_id].imgdir
}
function getMapIconUrl(map_id) {
	if (map_id === 0 || map_id === "default") {
		return "res/img/map_thumbnail/default_icon.jpg"
	}
	if (map_id === 1 || map_id === "ocean") {
		return "res/img/map_thumbnail/ocean_icon.jpg"
	}
	if (map_id === 2 || map_id === "casino") {
		return "res/img/map_thumbnail/casino_icon.jpg"
	}
	if (map_id === 3 || map_id === "train") {
		return "res/img/ui/setting.png"
	}
}
function getMapName(map_id){
	if (map_id === 0 || map_id === "default") {
		return "Default"
	}
	if (map_id === 1 || map_id === "ocean") {
		return "Ocean"
	}
	if (map_id === 2 || map_id === "casino") {
		return "Casino"
	}
	if (map_id === 3 || map_id === "train") {
		return "Train"
	}
}
function getChampImgofTurn(data, turn) {
	if (turn === -1) return "res/img/ui/obstacle.png"
	for (let p of data.players) {
		if (p.turn === turn) return getCharImgUrl(p.champ_id)
	}
	return ""
}

function writeTrainStats(totalturn,playerdata){
	str=`${playerdata.name}<br> 데스당 피해량: ${Math.floor(playerdata.stats[2]/Math.max(playerdata.death,0.5))}
	<br> 턴당 피해감소량: ${Math.floor(playerdata.stats[7]/totalturn)}
	<br> 피해감소율: ${playerdata.stats[7]/(playerdata.stats[7]+playerdata.stats[0])}<br>
	골드당 피해량: ${playerdata.stats[2]/(playerdata.stats[4])}<br>
	골드당 피해감소량: ${playerdata.stats[7]/(playerdata.stats[4])}<br>
	골드당 회복량: ${playerdata.stats[3]/(playerdata.stats[4])}<br>`
	$("#train_detail p").append(str)
}

function drawKillRecord(data) {
	//if there is no record
	if (data.killRecord.length === 0) {
		$(".detailbtn:nth-child(3)").hide()
		return
	}
	$(".detailbtn:nth-child(3)").show()
	let turn = data.killRecord[0].turn
	let str = "<div class='killframewrapper'><b>" + chooseLang("턴 ", "Turn ") + String(turn) + "</b>"
	for (let k of data.killRecord) {
		if (k.turn !== turn) {
			str += "</div><b>&#10140;</b><div class='killframewrapper'>"
			str += "<b>" + chooseLang("턴 ", "Turn ") + String(k.turn) + "</b>"
			turn = k.turn
		}
		str += "<div class='killframe'><div class='charframe'><img src='" + getChampImgofTurn(data, k.killer) + "'>"
		if (k.killer >= 0) {
			str += "<b class='charframetxt'>" + (k.killer + 1) + "P</b>"
		} else {
			str += "<b class='charframetxt'>EX</b>"
		}
		str +=
			"</div><img src='res/img/ui/kill.png'><div class='charframe2'><img src='" +
			getChampImgofTurn(data, k.dead) +
			"'><b class='charframetxt'>" +
			(k.dead + 1) +
			"P</b></div></div><br>"
	}
	str += "</div>"

	$("#killRecordTable").html(str)
}

/*
아이템빌드 (턴)
턴별 위치
킬/데스 맵

*/
function getSetting(game, setting) {
	if (!game || game.setting.length === 0 || !game.setting[0].name) return null
	let s = game.setting.filter((s) => s.name === setting)
	if (s && s.length > 0) return s[0].value
	return []
}

function drawSimulationGraph(winRateList, avgDamageList) {
	am4core.createFromConfig(
		{
			type: "XYChart",
			data: avgDamageList,
			titles: [
				{
					text: chooseLang("평균 딜량", "Average Damage Dealt"),
					fontSize: 30,
					fill: "white"
				}
			],
			xAxes: [
				{
					type: "CategoryAxis",
					dataFields: {
						category: "category"
					},
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 10
						},
						grid: {
							template: {
								disabled: true
							}
						},
						minGridDistance: 20
					}
				}
			],
			yAxes: [
				{
					type: "ValueAxis",
					min: 0,
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 15
						},
						maxLabelPosition: 1,
						grid: {
							template: {
								disabled: true
							}
						}
					}
				}
			],
			series: [
				{
					bullets: [
						{
							type: "LabelBullet",
							label: {
								text: "{value}",
								fontSize: 15,
								fill: "white",
								truncate: false,
								hideOversized: false,
								dy: 15
							}
						}
					],
					type: "ColumnSeries",
					columns: {
						fill: "#6593F5",
						width: "50%",
						stroke: "none"
					},
					dataFields: {
						valueY: "value",
						categoryX: "category"
					}
				}
			]
		},
		document.getElementById("avgdamageGraph")
	)

	am4core.createFromConfig(
		{
			titles: [
				{
					text: chooseLang("승리횟수", "Wins"),
					fontSize: 30,
					fill: "white"
				}
			],
			type: "PieChart",
			data: winRateList,
			series: [
				{
					slices: {
						stroke: "#4a2abb",
						strokeWidth: 2,
						strokeOpacity: 1
					},
					ticks: {
						stroke: "white",
						fill: "white",
						strokeWidth: "3px"
					},
					labels: {
						fontSize: "1.3vw",
						fill: "white",
						maxWidth: 200,
						wrap: true
					},
					type: "PieSeries",
					dataFields: {
						value: "value",
						category: "category"
					}
				}
			],
			radius: "70%",
			innerRadius: "30%"
		},
		document.getElementById("winrateGraph")
	)
}

function showStat(data) {
	$("#intro").hide()
	$("#holder").hide()
	$("#main").removeClass("hidden")
	data = JSON.parse(data)

	if (!data.multiple) {
		$("#gamelist_wrapper").css("visibility", "collapse")
		$(".simulationGraph").hide()
		showSingleStat(data)
	} else {
		$("#simulation_detail").show()
		statData = data.stat
		if(statData.length <=0){
			alert("empty statistics")
			return
		}

		//only simulation
		if (!data.isGamelist) {
			let wins = [0, 0, 0, 0]
			let kdas = [
				{ kill: 0, death: 0, assist: 0 },
				{ kill: 0, death: 0, assist: 0 },
				{ kill: 0, death: 0, assist: 0 },
				{ kill: 0, death: 0, assist: 0 }
			]
			let avgDamageList = []
			let avgKdaList = []
			let winRateList = []
			let dealamt = [0, 0, 0, 0]
			let str = ""
			let totalkills = []
			let totalturn = 0
			for (let s of data.stat) {
				totalturn += s.totalturn

				let onegamekill = 0
				for (let i = 0; i < s.players.length; ++i) {
					if (i === 0) {
						wins[s.players[i].turn] += 1
					}
					dealamt[s.players[i].turn] += s.players[i].stats[2]

					for (let j = 0; j < 3; ++j) {
						if (j === 0) {
							kdas[s.players[i].turn].kill += s.players[i].kda[j]
							onegamekill += s.players[i].kda[j]
						}
						if (j === 1) {
							kdas[s.players[i].turn].death += s.players[i].kda[j]
						}
						if (j === 2) {
							kdas[s.players[i].turn].assist += s.players[i].kda[j]
						}
					}
				}
				totalkills.push(onegamekill)
			}
			// console.table(kdas)
			kdas.map(function (k) {
				k.kill /= data.count
				k.death /= data.count
				k.assist /= data.count
			})
			let plist = Array.from(data.stat[0].players)

			plist.sort((a, b) => a.turn - b.turn)
			for (let i = 0; i < plist.length; ++i) {
				avgDamageList.push({
					category: plist[i].name,
					value: Math.floor(dealamt[i] / data.count)
				})
				avgKdaList.push({
					category: plist[i].name,
					k: Math.floor(100 * kdas[i].kill) / 100,
					d: Math.floor(100 * kdas[i].death) / 100,
					a: Math.floor(100 * kdas[i].assist) / 100
				})
				winRateList.push({
					category: plist[i].name,
					value: wins[i]
				})
			}

			totalturn /= data.count

			$("#simulation_info")
				.html("")
				.append("Count:" + statData.length)
			if (data.version != null && data.createdAt != null) {
				$("#simulation_info").append("<br>version:" + data.version + "<br>Time:" + data.createdAt.slice(0, 16))
			}

			$("#simulation_result").html("Average Turn:" + totalturn + "<br>")
			if (data.version) {
				$("#simulation_result").append("Server version:" + data.version)
			}
			$("#simulation_result").css("font-size", "20px")

			drawSimulationGraph(winRateList, avgDamageList)
		} else {
			//on receive game list
			$("#simulation_detail").hide()
		}

		let string = ""
		for (let i = 0; i < statData.length; ++i) {
			string += '<div class="onegame_container"><div>'
			for (let j = 0; j < 4; ++j) {
				if (j < statData[i].players.length) {
					let p = statData[i].players[j]
					let teamstr = ""
					if (statData[i].isTeam && p.team === true) teamstr = "red"
					else if (statData[i].isTeam && p.team === false) teamstr = "blue"

					string +=
						'<div class="character"><div class="charimg list_charimg ' +
						teamstr +
						'"><img src="' +
						getCharImgUrl(p.champ_id) +
						'"></div><a>' +
						p.kda[0] +
						"/" +
						p.kda[1] +
						"/" +
						p.kda[2] +
						"</a></div>"
				} else {
					string += "<div></div>"
				}
			}
			string += "</div>"

			string += '<div><div class="gameinfo">' + statData[i].totalturn + ' turns<hr></div><div class="gameinfo"></div>'
			if(statData[i].map_data!=null){
				string += '<img class="detail_map_icon" title="Map Type: '+getMapName(statData[i].map_data.name)+'" src="' + getMapIconUrl(statData[i].map_data.name) + '">'
			}
			

			if (statData[i].setting != null && statData[i].setting.length > 0 && statData[i].setting[0].name != null) {
				string +=
					'<img src="res/img/svg/shopping-cart.svg" class="icon" title="item limit">:' +
					getSetting(statData[i], "itemLimit") +
					"<br>"
				if (getSetting(statData[i], "shuffleObstacle")) {
					string += '<img src="res/img/svg/shuffle.svg" class="icon" title="shuffled obstacles">'
				}
				if (getSetting(statData[i], "useAdditionalLife")) {
					string += '<img src="res/img/svg/heart.svg" class="icon" title="additional life avaliable">'
				}
			}

			string +=
				'<img src="res/img/svg/zoom-in.svg" class="show_detail" ' +
				"onclick=showonestat(" +
				String(i) +
				")></div></div>"
		}
		for(let i=0;i<6;++i){
			string+='<div class="onegame_container dummy"></div>'
		}

		if (!data.isGamelist) {
			$("#gamelist_side").html(string)
			$("#gamelist_wrapper").css("visibility", "visible")

		} else {
			$("#summary").removeClass("hidden")
			$("#main").css("grid-template-columns", "auto")
			$("#gamelist_wrapper").css("visibility", "collapse")
			$("#summary").html(string)
		}

		return
	}
}
function showonestat(n) {
	showSingleStat(statData[n])
}

function multiKillText(count) {
	let multiKillText = ""
	if (count >= 2) {
		multiKillText = chooseLang("더블킬", "Double kill")
	}
	if (count >= 3) {
		multiKillText = chooseLang("트리플킬", "Triple kill")
	}
	if (count >= 4) {
		multiKillText = chooseLang("쿼드라킬", "Quadra kill")
	}
	if (count >= 5) {
		multiKillText = chooseLang("펜타킬", "Penta kill")
	}
	return multiKillText
}
function showSingleStat(data) {
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
	$(".otherTableLabel:nth-child(2)").html(chooseLang("사용한 돈", "Money spent"))
	$(".otherTableLabel:nth-child(3)").html(chooseLang("빼앗긴 돈", "Money taken"))
	$(".otherTableLabel:nth-child(4)").html(chooseLang("부활", "Revived"))
	$(".otherTableLabel:nth-child(5)").html(chooseLang("강제이동", "Forcemoved"))
	$(".otherTableLabel:nth-child(6)").html(chooseLang("기본공격", "Basic attack"))
	$(".otherTableLabel:nth-child(7)").html(chooseLang("처형", "Executed"))
	$(".detailbtn:nth-child(1)").html(chooseLang("상세 통계", "Details"))
	$(".detailbtn:nth-child(2)").html(chooseLang("아이템 빌드", "Item Build"))
	$(".detailbtn:nth-child(3)").html(chooseLang("킬/데스", "Kill/Death"))
	$(".detailbtn:nth-child(4)").html(chooseLang("위치", "Position"))
	$(".detailbtn:nth-child(5)").html(chooseLang("돈", "Money"))
	$("#stattable").show()
	$("#detailbtn_container").show()
	location.href = "#stattable"
	$("#position_chart").hide()
	$("#money_chart").hide()

	$("#train_detail p").html("")


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
				value4: -10
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
				value4: -1000
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
							fill: "#ffffff"
						},
						grid: {
							strokeOpacity: 1,
							stroke: "#707070",
							strokeWidth: 1
						}
					})
				}
			}
			respawnpos_list.push({
				value: data.map_data.finish,
				label: {
					text: String(data.map_data.finish),
					fill: "#ffffff"
				},
				grid: {
					strokeOpacity: 1,
					stroke: "#707070",
					strokeWidth: 1
				}
			})
		}

		for (let i = 0; i < data.players.length; ++i) {
			$(itembuildTable[i]).children(".itembuildTableName").html(data.players[i].name)

			//if there is no record
			if (data.players[i].itemRecord.length === 0) {
				$(".detailbtn:nth-child(2)").hide()
				continue
			}
			$(".detailbtn:nth-child(2)").show()
			let turn = data.players[i].itemRecord[0].turn
			let str = "(" + turn + chooseLang("턴", "T") + ")"
			for (let item of data.players[i].itemRecord) {
				if (item.turn !== turn) {
					str += "&#10140;(" + item.turn + chooseLang("턴", "T") + ")"
					turn = item.turn
				}
				for (let j = 0; j < item.count; ++j) {
					str +=
						"<div class='toast_itemimg_itembuild item_tooltip' value=" +
						item.item_id +
						"><img src='res/img/store/items.png' style='margin-left: " +
						-1 * item.item_id * 100 +
						"px'; > </div>"
				}
			}
			$(itembuildTable[i]).children(".itembuildTableContent").html(str)

			$(".toast_itemimg_itembuild").css({
				margin: "-30px",
				width: "100px",
				overflow: "hidden",
				height: "100px",
				display: "inline-block",
				transform: "scale(0.4)",
				"vertical-align": "middle"
			})

			
		}

		drawKillRecord(data)
		$("#detailbtn_container").show()
		$("#game_resulttext").html("Total turn:" + data.totalturn + ", Map: "+getMapName(data.map_data.name))
	}
	else{
		$("#game_resulttext").html("Total turn:" + data.totalturn)
		$("#detailbtn_container").hide()
	}

	
	if (data.players.length < 4) {
		$(table[4]).hide()
		$(othertable[4]).hide()
		$(itembuildTable[3]).hide()
	}
	if (data.players.length < 3) {
		$(table[3]).hide()
		$(othertable[3]).hide()
		$(itembuildTable[2]).hide()
	}

	if (data.isTeam && data.players[0].team === true) {
		$("#resulttext").html("Blue Team Victory!")
	} else if (data.isTeam !== null && data.players[0].team === false) {
		$("#resulttext").html("Red Team Victory!")
	} else {
		$("#resulttext").html("")
	}

	let dataList = $(".statTableCell").toArray()

	let winner_team = true
	for (let i = 0, k = 0; i < data.players.length; ++i, k += 5) {
		if(data.map_data!=null && data.map_data.name==='train')
		{
			writeTrainStats(data.totalturn,data.players[i])
		}

		let p = data.players[i]
		visiblePlayerNames.push((p.turn+1)+ "P(" + p.champ + ")")
		setItemList(i, p.items)

		let charstr = '<div class="charimg table_charimg '

		//팀전
		if (data.isTeam) {
			if (p.team) charstr += "red"
			else charstr += "blue"

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
				charstr += " winner"
			}
		}

		charstr += '"><img src="' + getCharImgUrl(p.champ_id) + '"></div>'

		$(dataList[k + 1]).html(charstr)
		$(dataList[k + 2]).html(p.name)
		$(dataList[k + 3]).html(
			p.kda[0] +
				"/" +
				p.kda[1] +
				"/" +
				p.kda[2] +
				" <br> <b style='background-color:red'>" +
				multiKillText(p.bestMultiKill) +
				"</b>"
		)

		kda_graph.push({
			category: (p.turn+1)+ "P(" + p.champ + ")",
			k: p.kda[0],
			d: p.kda[1],
			a: p.kda[2]
		})
		for (let j = 0; j < p.stats.length; ++j) {
			//$(dataList[k + j + 4]).html(p.stats[j])

			let graphData = {
				category: (p.turn+1)+ "P(" + p.champ + ")",
				"column-2": p.stats[j]
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

	let otherDataList = $(".otherTableCell").toArray()

	for (let i = 0, k = 0; i < data.players.length; ++i, k += 7) {
		let p = data.players[i]
		if (p.stats.length < 9) continue

		$(otherDataList[k]).html(p.name)
		$(otherDataList[k + 1]).html(p.stats[5])
		$(otherDataList[k + 2]).html(p.stats[6])
		$(otherDataList[k + 3]).html(p.stats[8])
		$(otherDataList[k + 4]).html(p.stats[9])
		$(otherDataList[k + 5]).html(p.stats[10])
		$(otherDataList[k + 6]).html(p.stats[11])
	}
	addItemTooltipEvent()
	$(".itemlist").css("font-size", "20px")
	am4core.createFromConfig(
		{
			type: "XYChart",
			data: kda_graph,
			legend: {
				position: "bottom",
				labels: {
					textDecoration: "none",
					fill: "#ffffff"
				}
			},
			titles: [
				{
					text: "KDA",
					fontSize: 30,
					fill: "white"
				}
			],
			xAxes: [
				{
					type: "CategoryAxis",
					dataFields: {
						category: "category"
					},
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 10
						},
						grid: {
							template: {
								disabled: true
							}
						},
						minGridDistance: 20
					}
				}
			],
			yAxes: [
				{
					type: "ValueAxis",
					min: 0,
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 15
						},
						maxLabelPosition: 1.2,
						grid: {
							template: {
								disabled: true
							}
						}
					}
				}
			],
			series: [
				{
					name: "Kill",
					bullets: [
						{
							type: "LabelBullet",
							label: {
								text: "{k}",
								fontSize: 10,
								fill: "white",
								truncate: false,
								dy: 10
							}
						}
					],
					type: "ColumnSeries",
					columns: {
						width: "60%",
						fill: "#6593F5",
						stroke: "none"
					},
					dataFields: {
						valueY: "k",
						categoryX: "category"
					}
				},
				{
					name: "Death",
					bullets: [
						{
							type: "LabelBullet",
							label: {
								text: "{d}",
								fontSize: 10,
								fill: "white",
								truncate: false,
								dy: 10
							}
						}
					],
					type: "ColumnSeries",
					columns: {
						width: "60%",
						fill: "#fc5060",
						stroke: "none"
					},
					dataFields: {
						valueY: "d",
						categoryX: "category"
					}
				},
				{
					name: "Assist",
					bullets: [
						{
							type: "LabelBullet",
							label: {
								text: "{a}",
								fontSize: 10,
								fill: "white",
								truncate: false,
								dy: 10
							}
						}
					],
					type: "ColumnSeries",
					columns: {
						width: "60%",
						fill: "#32cd32",
						stroke: "none"
					},
					dataFields: {
						valueY: "a",
						categoryX: "category"
					}
				}
			]
		},
		document.getElementById("kdaGraph")
	)
	AmCharts.makeChart("chartdiv", {
		type: "serial",
		categoryField: "category",
		columnWidth: 0,
		color: "white",
		maxSelectedSeries: 4,
		rotate: true,
		colors: [1],
		startDuration: 0,
		fontSize: 13,
		handDrawScatter: 0,
		theme: "default",
		categoryAxis: {
			gridPosition: "start",
			gridCount: 4
		},
		trendLines: [],
		graphs: [
			{
				fillAlphas: 1,
				fillColors: "#E9BDFF",
				fixedColumnWidth: 10,
				id: "AmGraph-2",
				labelOffset: 7,
				labelPosition: "right",
				labelText: "[[value]]",
				showBalloon: false,
				tabIndex: 0,
				title: "",
				type: "column",
				valueField: "column-2"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				position: "right",
				stackType: "regular",
				gridColor: "#767676",
				gridCount: 4,
				gridThickness: 0,
				ignoreAxisWidth: true,
				color: "white",
				title: ""
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			enabled: true,
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 25,
				text: chooseLang("입힌 피해", "Damage Dealt"),
				color: "beige"
			}
		],
		dataProvider: damagedealt_graph
	})

	AmCharts.makeChart("chartdiv1", {
		type: "serial",
		categoryField: "category",
		columnWidth: 0,
		maxSelectedSeries: 4,
		rotate: true,
		color: "white",
		colors: [1],
		startDuration: 0,
		fontSize: 13,
		fontColor: "white",
		handDrawScatter: 0,
		theme: "default",
		categoryAxis: {
			gridPosition: "start",
			gridCount: 4
		},
		trendLines: [],
		graphs: [
			{
				fillAlphas: 1,
				fillColors: "#ff8282",
				fixedColumnWidth: 10,
				id: "AmGraph-2",
				labelOffset: 7,
				labelPosition: "right",
				labelText: "[[value]]",
				showBalloon: false,
				tabIndex: 0,
				title: "",
				type: "column",
				valueField: "column-2"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				position: "right",
				stackType: "regular",
				gridColor: "#767676",
				gridCount: 4,
				gridThickness: 0,
				ignoreAxisWidth: true,
				color: "white",
				title: ""
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			enabled: true,
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 25,
				text: chooseLang("플레이어에게 받은 피해", "Damage from Players"),
				color: "beige"
			}
		],
		dataProvider: damagetakenC_graph
	})

	AmCharts.makeChart("chartdiv2", {
		type: "serial",
		categoryField: "category",
		columnWidth: 0,
		maxSelectedSeries: 4,
		rotate: true,
		color: "white",
		colors: [1],
		startDuration: 0,
		fontSize: 13,
		handDrawScatter: 0,
		theme: "default",
		categoryAxis: {
			gridPosition: "start",
			gridCount: 4
		},
		trendLines: [],
		graphs: [
			{
				fillAlphas: 1,
				fillColors: "#ff8282",
				fixedColumnWidth: 10,
				id: "AmGraph-2",
				labelOffset: 7,
				labelPosition: "right",
				labelText: "[[value]]",
				showBalloon: false,
				tabIndex: 0,
				title: "",
				type: "column",
				valueField: "column-2"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				position: "right",
				stackType: "regular",
				gridColor: "#767676",
				gridCount: 4,
				gridThickness: 0,
				ignoreAxisWidth: true,
				color: "white",
				title: ""
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 25,
				text: chooseLang("장애물에게 받은 피해", "Damage from Obstacles"),
				color: "beige"
			}
		],
		dataProvider: damagetakenO_graph
	})
	AmCharts.makeChart("chartdiv3", {
		type: "serial",
		categoryField: "category",
		columnWidth: 0,
		maxSelectedSeries: 4,
		rotate: true,
		color: "white",
		colors: [1],
		startDuration: 0,
		fontSize: 13,
		handDrawScatter: 0,
		theme: "default",
		categoryAxis: {
			gridPosition: "start",
			gridCount: 4
		},
		trendLines: [],
		graphs: [
			{
				fillAlphas: 1,
				fillColors: "#9effa5",
				fixedColumnWidth: 10,
				id: "AmGraph-2",
				labelOffset: 7,
				labelPosition: "right",
				labelText: "[[value]]",
				showBalloon: false,
				tabIndex: 0,
				title: "",
				type: "column",
				valueField: "column-2"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				position: "right",
				stackType: "regular",
				gridColor: "#767676",
				gridCount: 4,
				gridThickness: 0,
				ignoreAxisWidth: true,
				color: "white",
				title: ""
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			enabled: true,
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 25,
				text: chooseLang("회복량", "Heal Amount"),
				color: "beige"
			}
		],
		dataProvider: heal_graph
	})
	AmCharts.makeChart("chartdiv4", {
		type: "serial",
		categoryField: "category",
		columnWidth: 0,
		maxSelectedSeries: 4,
		rotate: true,
		color: "white",
		colors: [1],
		startDuration: 0,
		fontSize: 13,
		handDrawScatter: 0,
		theme: "default",
		categoryAxis: {
			gridPosition: "start",
			gridCount: 4
		},
		trendLines: [],
		graphs: [
			{
				fillAlphas: 1,
				fillColors: "#ffd754",
				fixedColumnWidth: 10,
				id: "AmGraph-2",
				labelOffset: 7,
				labelPosition: "right",
				labelText: "[[value]]",
				showBalloon: false,
				tabIndex: 0,
				title: "",
				type: "column",
				valueField: "column-2"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				position: "right",
				stackType: "regular",
				gridColor: "#767676",
				gridCount: 4,
				gridThickness: 0,
				ignoreAxisWidth: true,
				color: "white",
				title: ""
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			enabled: true,
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 25,
				text: chooseLang("획득한 돈", "Money Obtained"),
				color: "beige"
			}
		],
		dataProvider: gold_graph
	})
	/*
	AmCharts.makeChart("kda_chart", {
		type: "serial",
		categoryField: "category",
		color: "white",
		startDuration: 0,
		categoryAxis: {
			gridPosition: "start"
		},
		trendLines: [],
		graphs: [
			{
				balloonText: "[[title]] of [[category]]:[[value]]",
				bulletAlpha: 0,
				columnWidth: 0.84,
				fillAlphas: 1,
				fillColors: "#FFD800",
				id: "AmGraph-1",
				labelAnchor: "middle",
				labelPosition: "inside",
				labelText: "[[value]]",
				lineAlpha: 0,
				lineThickness: 0,
				showAllValueLabels: true,
				showBalloon: false,
				title: "Kill",
				color: "beige",
				type: "column",
				valueField: "Kill"
			},
			{
				balloonText: "[[title]] of [[category]]:[[value]]",
				fillAlphas: 1,
				fillColors: "#FF6D6D",
				id: "AmGraph-2",
				labelPosition: "inside",
				labelText: "[[value]]",
				showAllValueLabels: true,
				showBalloon: false,
				title: "Death",
				type: "column",
				valueField: "Death",
				color: "beige"
			},
			{
				columnWidth: 0.84,
				fillAlphas: 1,
				gapPeriod: 2,
				id: "AmGraph-3",
				labelPosition: "inside",
				labelText: "[[value]]",
				maxBulletSize: 48,
				showAllValueLabels: true,
				showBalloon: false,
				tabIndex: 0,
				title: "Assist",
				type: "column",
				valueField: "Assist",
				color: "beige"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				gridThickness: 0,
				title: "",
				color: "white"
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			enabled: true,
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 15,
				text: "Kill/Death/Assist",
				color: "beige"
			}
		],
		dataProvider: kda_graph
	})*/

	AmCharts.makeChart("chartdiv5", {
		type: "serial",
		categoryField: "category",
		columnWidth: 0,
		maxSelectedSeries: 4,
		rotate: true,
		color: "white",
		colors: [1],
		startDuration: 0,
		fontSize: 13,
		handDrawScatter: 0,
		theme: "default",
		categoryAxis: {
			gridPosition: "start",
			gridCount: 4
		},
		trendLines: [],
		graphs: [
			{
				fillAlphas: 1,
				fillColors: "#696969",
				fixedColumnWidth: 10,
				id: "AmGraph-2",
				labelOffset: 7,
				labelPosition: "right",
				labelText: "[[value]]",
				showBalloon: false,
				tabIndex: 0,
				title: "",
				type: "column",
				valueField: "column-2"
			}
		],
		guides: [],
		valueAxes: [
			{
				id: "ValueAxis-1",
				position: "right",
				stackType: "regular",
				gridColor: "#767676",
				gridCount: 4,
				gridThickness: 0,
				ignoreAxisWidth: true,
				color: "white",
				title: ""
			}
		],
		allLabels: [],
		balloon: {},
		legend: {
			color: "white",
			enabled: true,
			useGraphSettings: true
		},
		titles: [
			{
				id: "Title-1",
				size: 25,
				text: chooseLang("피해 감소량", "Damage Reduced"),
				color: "beige"
			}
		],
		dataProvider: damageabsorbed_graph
	})

	let position_chart = {
		legend: {
			position: "bottom",
			labels: {
				textDecoration: "none",
				fill: "#ffffff"
				// text: "[bold {stroke}]{name}[/]",
			}
		},
		titles: [
			{
				text: chooseLang("위치", "Positions"),
				fontSize: 40,
				fill: "white"
			}
		],
		type: "XYChart",
		data: position_list,
		xAxes: [
			{
				type: "CategoryAxis",
				dataFields: {
					category: "category"
				},
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 10
					},
					grid: {
						template: {
							disabled: true
						}
					},
					minGridDistance: 20
				}
			}
		],
		yAxes: [
			{
				axisRanges: respawnpos_list,
				min: 0,
				type: "ValueAxis",
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 20,
						template: {
							disabled: true
						}
					},
					maxLabelPosition: 1,
					grid: {
						template: {
							disabled: true
						}
					}
				}
			}
		],
		series: [
			{
				type: "LineSeries",
				name: "",
				fill: "#0077b6",
				stroke: "#0077b6",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#0077b6"
					}
				},
				dataFields: {
					valueY: "value1",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#d54a48",
				stroke: "#d54a48",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#d54a48"
					}
				},
				dataFields: {
					valueY: "value2",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#72cc50",
				stroke: "#72cc50",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#72cc50"
					}
				},
				dataFields: {
					valueY: "value3",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#fff989",
				stroke: "#fff989",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#fff989"
					}
				},
				dataFields: {
					valueY: "value4",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			}
		]
	}

	let money_chart = {
		legend: {
			position: "bottom",
			labels: {
				textDecoration: "none",
				fill: "#ffffff"
				// text: "[bold {stroke}]{name}[/]",
			}
		},
		titles: [
			{
				text: chooseLang("돈 획득", "Money Income"),
				fontSize: 40,
				fill: "white"
			}
		],
		type: "XYChart",
		data: money_list,
		xAxes: [
			{
				type: "CategoryAxis",
				dataFields: {
					category: "category"
				},
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 10
					},
					grid: {
						template: {
							disabled: true
						}
					},
					minGridDistance: 20
				}
			}
		],
		yAxes: [
			{
				min: 0,
				type: "ValueAxis",
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 15
					},
					maxLabelPosition: 1,
					grid: {
						strokeOpacity: 1,
						stroke: "#707070",
						strokeWidth: 1
					}
				}
			}
		],
		series: [
			{
				type: "LineSeries",
				name: "",
				fill: "#0077b6",
				stroke: "#0077b6",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#0077b6"
					},
					children: [{ type: "Circle", width: 5, height: 5, horizontalCenter: "middle", verticalCenter: "middle" }]
				},
				dataFields: {
					valueY: "value1",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#d54a48",
				stroke: "#d54a48",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#d54a48"
					}
				},
				dataFields: {
					valueY: "value2",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#72cc50",
				stroke: "#72cc50",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#72cc50"
					}
				},
				dataFields: {
					valueY: "value3",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#fff989",
				stroke: "#fff989",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 5,
									height: 5,
									horizontalCenter: "middle",
									verticalCenter: "middle"
								}
							]
						}
					],
					template: {
						type: "Bullet",
						fill: "#fff989"
					}
				},
				dataFields: {
					valueY: "value4",
					categoryX: "category"
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100
			}
		]
	}
	for (let i = 0; i < 4; ++i) {
		position_chart.series[i].name = visiblePlayerNames[i]
	}
	for (let i = 0; i < 4; ++i) {
		money_chart.series[i].name = visiblePlayerNames[i]
	}
	am4core.createFromConfig(position_chart, document.getElementById("position_chart"))
	am4core.createFromConfig(money_chart, document.getElementById("money_chart"))
}
// am4core.ready(function () {

// })
// am4core.ready(function () {})
