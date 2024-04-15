async function showAnalysisPage(version) {
	$("#overlay").addClass("visible")
	$("#character-table-container").addClass("hidden")
	try {
		let maps = await (await fetch(SERVER_URL + `/stat/eval/list/map/${version}`)).json()
		let versions = await (await fetch(SERVER_URL + `/stat/eval/list/version`)).json()
		let str = ` <li class="dropdown-item version-item" data-version="recent">${LOCALE.recent}</li>`
		versions = versions.versions.reverse()
		for (const v of versions) {
			str += ` <li class="dropdown-item version-item" data-version="${v}">v${v}</li>`
		}
		$("#version-dropdown").html(str)

		str = ""
		let map = ""

		for (const m of maps.maps) {
			//select first appearing map as default
			if (map === "") map = m
			str += `
			<div class="character-table-mapbtn ${
				map === m ? "selected" : ""
			}" id="mapbtn-${m}" data-map="${m}" data-version="${version}">
				<img src="${getMapIconUrl(m)}">
				<a>${m}</a>
			</div>`
		}
		if (map === "") {
			$("#character-table-maps").html("No data")
			$("#overlay").removeClass("visible")
			$("#analysis").removeClass("hidden")

			$(".version-item").click(function () {
				showAnalysisPage($(this).data("version"))
				$(".version-dropdown-btn").html($(this).data("version") + "<b style='float: right;'>&#9660;</b")
			})

			return
		}

		$("#character-table-maps").html(str)
		$(".version-item").click(function () {
			showAnalysisPage($(this).data("version"))
			$(".version-dropdown-btn").html($(this).data("version") + "<b style='float: right;'>&#9660;</b")
		})
		$(".character-table-mapbtn").click(function () {
			$(".character-table-mapbtn").removeClass("selected")
			$(this).addClass("selected")
			showAnalysisTable($(this).data("version"), $(this).data("map"))
		})

		showAnalysisTable(version, map)
		$("#analysis").removeClass("hidden")
	} catch (e) {
		console.error(e)
		$("#overlay").removeClass("visible")
		return
	}
}

function charDataList() {
	let list = []
	for (let i = 0; i < SETTING.characters.length; ++i) {
		list.push({
			id: i,
			total: 0,
			wins: 0,
			winrate: -1,
		})
	}
	return list
}
async function showAnalysisTable(version, map) {
	let data
	console.log(localStorage)
	const isAdmin = localStorage.getItem("username") === "admin" && localStorage.getItem("loggedIn") === "true"
	$(".character-table-delete-btn").off()
	if (isAdmin) {
		$(".character-table-delete-btn").click(function () {
			console.log($(this).data("gametype"))
			$.ajax({
				method: "POST",
				url: `/stat/eval/delete/${map}/${version}/${$(this).data("gametype")}`,
				data: {},
			})
				.done(function (res, statusText, xhr) {
					let status = xhr.status
					if (status === 200) {
						alert("deleted")
					}
				})
				.fail(function (res, statusText, xhr) {
					let status = res.status
					if (status === 401) alert("unauthorized!")
					else alert("deletion failed!")
				})
		})
		$(".character-table-delete-btn").show()
	} else {
		$(".character-table-delete-btn").off()
		$(".character-table-delete-btn").hide()
	}
	try {
		data = await (await fetch(SERVER_URL + `/stat/eval/overview/${map}/${version}`)).json()
	} catch (e) {
		console.error(e)
		$("#overlay").removeClass("visible")
		return
	}
	if (data.length === 0) {
		$("#overlay").removeClass("visible")
	}

	let characters = new Map()
	characters.set("2P", charDataList())
	characters.set("3P", charDataList())
	characters.set("4P", charDataList())
	characters.set("TEAM", charDataList())

	let metadata = new Map()
	metadata.set("2P", [0, 0]) //[totalgame,totalturn]
	metadata.set("3P", [0, 0])
	metadata.set("4P", [0, 0])
	metadata.set("TEAM", [0, 0])
	const charscores = charDataList()

	for (const eval of data) {
		let arr = metadata.get(eval.gameType)
		arr[0] += eval.count
		arr[1] += eval.averageTotalTurn * eval.count

		metadata.set(eval.gameType, arr)

		for (const char of eval.characters) {
			characters.get(eval.gameType)[char.charId].total += char.count
			characters.get(eval.gameType)[char.charId].wins += char.wins
			charscores[char.charId].total += char.count
			if (eval.gameType === "4P") {
				charscores[char.charId].wins += char.wins * 4
			} else if (eval.gameType === "3P") {
				charscores[char.charId].wins += char.wins * 3
			} else {
				charscores[char.charId].wins += char.wins * 2
			}
		}
	}
	charscores.forEach((val) => {
		if (val.total > 0) val.winrate = val.wins / val.total
	})
	charscores.sort((a, b) => b.winrate - a.winrate)

	let str = ""
	for (const char of charscores) {
		if (char.winrate > 0)
			str += `
			<div class="character-list-card">
				<div class="card-charimg">
				<img src="${getCharImgUrl(char.id)}">
				</div>
				<b>${SETTING.characters[char.id].name}</b>
				<b  class="${char.winrate <= 1 ? "redlabel" : "bluelabel"}" style="font-size:15px;">${Math.round(
				char.winrate * 100
			)}</b>
			</div>`
	}
	$("#character-list").html(str)

	for (const [key, val] of characters.entries()) {
		let arr = metadata.get(key)
		if (arr[0] > 0) arr[1] = Math.round(arr[1] / arr[0])
		else {
			$("#character-table-" + key).html("No data")

			$("#character-table-totalgames-" + key).html("-")
			$("#character-table-avgturns-" + key).html("-")
			continue
		}
		$("#character-table-totalgames-" + key).html(arr[0])
		$("#character-table-avgturns-" + key).html(arr[1])

		for (let i = 0; i < SETTING.characters.length; ++i) {
			if (val[i].total > 0) {
				val[i].winrate = val[i].wins / val[i].total
			}
		}
		let sorted = val.sort((a, b) => b.winrate - a.winrate)
		let s = ""
		sorted.forEach((element, i) => {
			s += `
			<div class="character-winrate-card" data-map="${map}"  data-version="${version}"  data-gametype="${key}"  data-id="${
				element.id
			}" >
				<div>
					<span class="table-char-rank ${i > 2 ? (i > 6 ? "bronze" : "silver") : ""}">${i + 1}</span>
					<div class="table-charimg">
						<img src="${getCharImgUrl(element.id)}">
					</div>
					<b class="table-charname">${SETTING.characters[element.id].name}</b>
				</div>
				<div class="winrate">
					<b>${element.winrate === -1 ? "-" : Math.round(element.winrate * 100) + "%"}</b><br>
					<b class="subtext">${element.wins}/${element.total} games</b>
				</div>
			</div>`
		})

		$("#character-table-" + key).html(s)
	}
	$(".character-winrate-card").click(function () {
		window.history.pushState({ page: "analysis" }, "", window.location.href)
		showCharacterPage($(this).data("version"), $(this).data("map"), $(this).data("gametype"), $(this).data("id"), true)
	})

	$("#character-table-container").removeClass("hidden")
	$("#overlay").removeClass("visible")
}
