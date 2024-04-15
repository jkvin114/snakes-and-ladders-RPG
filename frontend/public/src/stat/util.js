function getBrightness(hexcolor) {
	let r = parseInt(hexcolor.substring(1, 3), 16)
	let g = parseInt(hexcolor.substring(3, 5), 16)
	let b = parseInt(hexcolor.substring(5, 7), 16)
	let yiq = (r * 299 + g * 587 + b * 114) / 256000
	console.log(yiq)
	return yiq
}
function getGameTypeStr(gametype) {
	switch (gametype) {
		case "2P":
			return LOCALE.game_2p
		case "3P":
			return LOCALE.game_3p
		case "4P":
			return LOCALE.game_4p
		case "TEAM":
			return LOCALE.game_team
	}
	return ""
}
/**
 * check if a character is included in team lock array
 * @param {*} char
 * @param {*} teamlock
 * @returns
 */
function getlockedTeam(char, teamlock) {
	if (teamlock[0].includes(char)) return "red"
	else if (teamlock[1].includes(char)) return "blue"
	else return ""
}

/**
 * get item description for tooltip
 * @param {*} item
 * @returns
 */
function getItemDescription(item) {
	let ability = ""
	const id = item.id
	for (let a of item.ability) {
		let ab = "<a class=ability_name>" + LOCALE_GAME.stat[a.type] + "</a> +" + a.value

		if (a.type === "addMdmg" || a.type === "skillDmgReduction" || a.type === "absorb" || a.type === "obsR") {
			ab += "%"
		}
		ability += ab
		ability += "<br>"
	}
	if (item.hasPassive) {
		ability += `<b class=unique_effect_name>[${LOCALE.item.passive}]</b>:
			 ${LOCALE_GAME.item[id].unique_effect}`
		if (item.active_cooltime != null) {
			ability += `(${LOCALE.item.cool} ${item.active_cooltime} ${LOCALE.turn})`
		}
	}
	ability += `<br><br>${LOCALE.item.price} :<b class=price>` + String(item.price) + "</b>"
	return ability
}
/**
 * register item tooltip event
 */
function addItemTooltipEvent() {
	$(".item_tooltip").off()
	$(".item_tooltip").mouseenter(function (e) {
		const rootpos = $("#stat-root").offset()
		// console.log(rootpos)
		const pos = $(this).offset()
		$(".tooltiptext")
			.css({
				visibility: "visible",
			})
			.css({
				top: pos.top - rootpos.top,
				left: pos.left - rootpos.left,
			})

		if ($(this).offset().left < window.innerWidth / 2) {
			$(".tooltiptext").removeClass("rightside")
			$(".tooltiptext").addClass("leftside")
		} else {
			$(".tooltiptext").removeClass("leftside")
			$(".tooltiptext").addClass("rightside")
		}

		let item = ITEMS[Number($(this).attr("value"))]
		// console.log(chooseLang("ko", "en"))
		$(".tooltiptext h4").html(LOCALE_GAME.item[Number($(this).attr("value"))].name)
		$(".tooltiptext p").html(getItemDescription(item))
	})
	$(".item_tooltip").mouseleave(function (e) {
		$(".tooltiptext").css("visibility", "hidden")
	})
}

function compareVersion(v1, v2) {
	v1 = v1.split(".").map((s) => Number(s))
	v2 = v2.split(".").map((s) => Number(s))

	return v1[0] !== v2[0] ? v2[0] - v1[0] : v1[1] !== v2[1] ? v2[1] - v1[1] : v2[2] - v1[2]
}

function convertCountToItemSlots(items, isZeroIndex) {
	let itemslot = []
	for (let i = 0; i < items.length; ++i) {
		for (let j = 0; j < items[i]; ++j) {
			itemslot.push(isZeroIndex ? i : i - 1)
		}
	}
	return itemslot
}

/**
 *
 * @param {*} rank
 * @param {*} data
 * @returns player name of the rank(index)
 */
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
	if (champ_id === undefined) return ""
	return "res/img/character/illust/" + SETTING.characters[champ_id].illustdir
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
	if (map_id === 3 || map_id === "rapid") {
		return "res/img/map_thumbnail/rapid_icon.jpg"
	}
	if (map_id === 4 || map_id === "train") {
		return "res/img/ui/setting.png"
	}
}
function getMapName(map_id) {
	if (map_id === 0 || map_id === "default") {
		return "Default"
	}
	if (map_id === 1 || map_id === "ocean") {
		return "Ocean"
	}
	if (map_id === 2 || map_id === "casino") {
		return "Casino"
	}
	if (map_id === 3 || map_id === "rapid") {
		return "Rapid"
	}
	if (map_id === 4 || map_id === "train") {
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

function getSetting(game, setting) {
	if (!game || !game.setting || game.setting.length === 0 || !game.setting[0].name) return null
	let s = game.setting.filter((s) => s.name === setting)
	if (s && s.length > 0) return s[0].value
	return null
}

const randomHex = (length) =>
	("0".repeat(length) + Math.floor(Math.random() * 16 ** length).toString(16)).slice(-length)

async function updateGameLocale() {
	let la = currentLocale()
	LOCALE_GAME = await fetch(`/res/locale/game/${la}.json`).then((response) => response.json())
	SkillParser.updateLocale(la)
	SkillParser.EFFECTS = LOCALE_GAME.statuseffect_data
	SkillParser.descriptions = LOCALE_GAME.skills
}
function currentLocale() {
	let la = "en"
	if (sessionStorage.language === "eng" || sessionStorage.language === "en") la = "en"
	else if (sessionStorage.language === "kor" || sessionStorage.language === "ko") la = "ko"
	return la
}
const chooseLang = function (kor, eng) {
	if (sessionStorage.language === "ko") return kor
	return eng
}
