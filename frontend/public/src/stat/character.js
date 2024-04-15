function pushCharacterPageState(version, map, gametype, charId) {
	let querystr = `page=character&charid=${charId}&version=${version}&map=${map}&gametype=${gametype}`
	const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + querystr
	window.history.pushState(
		{ version: version, map: map, gametype: gametype, charId: charId, page: "character" },
		"",
		newurl
	)
}
function pushState(state, querystr) {
	const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + querystr
	window.history.pushState(state, "", newurl)
}

async function showCharacterPage(version, map, gametype, charId, isModal, isback) {
	$("#skill-overlay").click(() => {
		$("#skill-overlay").hide()
		$("#skill-tooltip").hide()
	})
	$("#skill-tooltip").click(() => {
		$("#skill-overlay").hide()
		$("#skill-tooltip").hide()
	})

	$("#overlay").addClass("visible")

	if (!version) version = "recent"
	if (!map) map = "rapid"
	if (!gametype) gametype = "4P"

	if (gametype === "TEAM") {
		$("#character-duos-container").show()
	} else {
		$("#character-duos-container").hide()
	}
	// pushCharacterPageState(version, map, gametype, charId)
	$(".summary-gametype").html(getGameTypeStr(gametype))
	$(".summary-map").html(
		"<img src=" + getMapIconUrl(map) + " style='width:20px;vertical-align:middle;'>" + map + " Map"
	)

	let dropdowns = $(".character-dropdown-btn").toArray()
	$(dropdowns[0]).html(gametype + `<b style="float: right;">&#9660;</b>`)
	$(dropdowns[1]).html(map + `<b style="float: right;">&#9660;</b>`)
	$(dropdowns[2]).html((version === "recent" ? "" : "v") + version + `<b style="float: right;">&#9660;</b>`)

	let data
	let trend
	try {
		data = await fetch(SERVER_URL + `/stat/eval/character/${charId}?version=${version}&map=${map}&gametype=${gametype}`)
		if (data.status === 400) {
			alert("invalid query")
		}

		data = await data.json()
		if (data.length === 0) {
			$("#character-content").hide()
			$("#character").removeClass("hidden")
			$("#character-nodata").show()
			$("#overlay").removeClass("visible")
			$("#character-winrate").html("-")
			$("#character-totalgame").html("0")
			return
		}
		$("#character-nodata").hide()
		$("#character-content").show()
		trend = await fetch(SERVER_URL + `/stat/eval/character/${charId}/trend?map=${map}&gametype=${gametype}`)
		if (trend.status === 400) {
			alert("invalid query")
		}

		trend = await trend.json()
	} catch (e) {
		console.error(e)
		$("#overlay").removeClass("visible")
		return
	}
	if (isModal) {
		$("#character-close-btn").removeClass("hidden")
	}
	if (InterfaceState.state === STATE_CHARACTER_ANALYSIS && !isback) {
		pushCharacterPageState(version, map, gametype, charId)
	}
	const colors = SETTING.characters[charId].bgcolors

	document.getElementById(
		"character-header"
	).style.background = `linear-gradient(to top,#200f33 0px,rgba(0,0,0,0) 20px),
	linear-gradient(45deg,${colors[0]},${colors[1]})`

	if (getBrightness(colors[0]) + getBrightness(colors[1]) > 1.1) {
		$("#character-header").addClass("light")
		$("#character-close-btn").addClass("light")
	} else {
		$("#character-header").removeClass("light")
		$("#character-close-btn").removeClass("light")
	}

	$(".summary-charimg").attr("src", getCharImgUrl(charId))
	$(".summary-charname").html(SETTING.characters[charId].name)
	$(".character-skills").html("")
	for (let i = 1; i < 4; ++i) {
		$(".character-skills").append(
			`<img class='skillicon' data-skillid='${charId}-${i - 1}' src="res/img/skill/${Number(charId) + 1}-${i}.jpg">`
		)
	}
	$(".skillicon").click(function () {
		let d = $(this).data("skillid")
		let parsed = SkillParser.parseSkill(Number(d.charAt(0)), Number(d.charAt(2)))
		// console.log(parsed)
		$("#skill-tooltip .skillinfo").html(parsed)
		$("#skill-overlay").show()
		$("#skill-tooltip").show()
	})
	let versionWinrates = new Map()
	let vstr = ""
	for (const ver of trend) {
		if (!versionWinrates.has(ver.patchVersion)) {
			//version,count,wins,winrates
			versionWinrates.set(ver.patchVersion, [ver.patchVersion, ver.count, ver.wins, -1])
		} else {
			let arr = versionWinrates.get(ver.patchVersion)
			arr[1] += ver.count
			arr[2] += ver.wins
			versionWinrates.set(ver.patchVersion, arr)
		}
	}

	// versionWinrates.set("3.14.2", ["3.14.2", 20, 10, -1])
	// versionWinrates.set("3.14.3", ["3.14.3", 20, 8, -1])
	// versionWinrates.set("3.14.3", ["3.14.3", 20, 5, -1])
	const versionlist = [...versionWinrates.values()].sort((v1, v2) => compareVersion(v2[0], v1[0]))
	versionlist.forEach((v) => {
		if (v[1] > 0) v[3] = v[2] / v[1]
		vstr += `<li class="dropdown-item character-version-dropdown" data-version="${v[0]}">v${v[0]}</li>`
	})
	$("#character-version-dropdown").html(vstr)
	const storage = {
		enemy: charDataList(),
		duo: charDataList(),
		item: new Map(),
		itembuild: new Map(),
	}
	let totalgames = 0
	let totalwins = 0
	for (const eval of data) {
		totalgames += eval.count
		totalwins += eval.wins
		for (const char of eval.opponents) {
			storage.enemy[char.for].total += char.count
			storage.enemy[char.for].wins += char.wins
		}
		for (const item of eval.items) {
			if (storage.item.has(item.for)) {
				let arr = storage.item.get(item.for)
				arr[0] += item.count
				arr[1] += item.wins
				storage.item.set(item.for, arr)
			} else {
				storage.item.set(item.for, [item.count, item.wins, -1])
			}
		}
		for (const item of eval.itembuilds) {
			if (storage.itembuild.has(item.for)) {
				let arr = storage.itembuild.get(item.for)
				arr[0] += item.count
				arr[1] += item.wins
				storage.itembuild.set(item.for, arr)
			} else {
				storage.itembuild.set(item.for, [item.count, item.wins, -1])
			}
		}
		if (eval.gameType !== "TEAM") continue
		for (const char of eval.duos) {
			storage.duo[char.for].total += char.count
			storage.duo[char.for].wins += char.wins
		}
	}

	for (let i = 0; i < SETTING.characters.length; ++i) {
		if (storage.enemy[i].total > 0) {
			storage.enemy[i].winrate = storage.enemy[i].wins / storage.enemy[i].total
		}
		if (storage.duo[i].total > 0) {
			storage.duo[i].winrate = storage.duo[i].wins / storage.duo[i].total
		}
	}
	const itemlist = []
	const itembuildlist = []
	for (const [key, val] of storage.item.entries()) {
		if (val[0] > 0) {
			val[2] = val[1] / val[0]
		}
		itemlist.push([key, ...val])
	}
	for (const [key, val] of storage.itembuild.entries()) {
		if (val[0] > 0) {
			val[2] = val[1] / val[0]
		}
		itembuildlist.push([key, ...val])
	}
	storage.enemy.sort((a, b) => b.winrate - a.winrate)
	storage.duo.sort((a, b) => b.winrate - a.winrate)
	itemlist.sort((a, b) => b[1] / totalgames - a[1] / totalgames)
	itembuildlist.sort((a, b) => b[1] / totalgames - a[1] / totalgames)
	$("#character-winrate").html(totalgames === 0 ? "-" : Math.round((totalwins / totalgames) * 100) + "%")
	$("#character-totalgame").html(totalgames)
	let str = ""
	let str2 = ""
	for (let i = 0; i < SETTING.characters.length; ++i) {
		if (storage.enemy[i].winrate > 0)
			str += `
			<div class="character-list-card character-ref" data-id="${storage.enemy[i].id}">
				<div class="card-charimg">
					<img src="${getCharImgUrl(storage.enemy[i].id)}">
				</div>
				<b class="${storage.enemy[i].winrate <= totalwins / totalgames ? "redlabel" : "bluelabel"}">${
				storage.enemy[i].winrate === -1 ? "-" : Math.round(storage.enemy[i].winrate * 100) + "%"
			}</b>
				<a class="subtext">${storage.enemy[i].wins}/${storage.enemy[i].total} games</a>
			</div>`
		if (gametype === "TEAM" && storage.duo[i].winrate > 0)
			str2 += `
			<div class="character-list-card character-ref" data-id="${storage.duo[i].id}">
				<div class="card-charimg">
					<img src="${getCharImgUrl(storage.duo[i].id)}">
				</div>
				<b class="${storage.enemy[i].winrate <= totalwins / totalgames ? "redlabel" : "bluelabel"}">${
				storage.duo[i].winrate === -1 ? "-" : Math.round(storage.duo[i].winrate * 100) + "%"
			}</b>
				<a class="subtext">${storage.duo[i].wins}/${storage.duo[i].total} games</a>
			</div>`
	}

	$("#character-opponents").html(str)
	$("#character-duos").html(str2)
	str = ""
	str2 = ""
	for (const item of itemlist) {
		str += `
		<div class=" character-content-item-list">
			<div>
				<div class='toast_itemimg_itembuild item_tooltip' value="${
					item[0]
				}"><img alt='item' src='res/img/store/items.png' style='margin-left: ${-1 * item[0] * 100}px'; > </div>
			</div>
			<div class="pickrate">
				<b>${Math.round((item[1] / totalgames) * 100)}%</b><br>
				<a class="subtext">${item[1]}/${totalgames} games</a>
			</div>
			<div class="winrate">
				<b>${Math.round(item[3] * 100)}%</b><br>
			</div>
		</div>`
	}

	for (const item of itembuildlist) {
		let itemstr = ""
		let li = item[0].split(",")
		for (let i = 0; i < li.length; ++i) {
			if (i > 0) itemstr += "&#10140;"
			itemstr += `
			<div class='toast_itemimg_itembuild item_tooltip' value="${li[i]}">
				<img src='res/img/store/items.png' style='margin-left: ${-1 * li[i] * 100}px'; > 
			</div>`
		}
		str2 += `
		<div class=" character-content-item-list">
			<div>${itemstr}
				
			</div>
			<div class="pickrate">
				<b>${Math.round((item[1] / totalgames) * 100)}%</b><br>
				<a class="subtext">${item[1]}/${totalgames} games</a>
			</div>
			<div class="winrate">
				<b>${Math.round(item[3] * 100)}%</b><br>
			</div>
		</div>`
	}
	$(".character-gametype-dropdown").off()
	$(".character-map-dropdown").off()
	$(".character-version-dropdown").off()

	$(".character-gametype-dropdown").click(function () {
		showCharacterPage(version, map, $(this).data("gametype"), charId, false)
	})
	$(".character-map-dropdown").click(function () {
		showCharacterPage(version, $(this).data("map"), gametype, charId, false)
	})
	$(".character-version-dropdown").click(function () {
		showCharacterPage($(this).data("version"), map, gametype, charId, false)
	})
	$(".character-ref").off()
	$(".character-ref").click(function () {
		showCharacterPage(version, map, gametype, $(this).data("id"), false)
	})

	$("#character-items").html(str)
	$("#character-itembuilds").html(str2)
	addItemTooltipEvent()
	$("#character").removeClass("hidden")
	$("#stat-navbar").hide()
	$("#overlay").removeClass("visible")
	console.log(versionlist)
	const chartconfig = structuredClone(CharacterTrendChartConfig)
	chartconfig.titles[0].text = LOCALE.graph.trend

	chartconfig.data = versionlist.map((v, i) => {
		return {
			category: "v" + v[0],
			value: Math.round(v[3] * 100),
		}
	})
	am4core.createFromConfig(chartconfig, document.getElementById("character-trend-graph"))
}
