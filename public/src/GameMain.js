import { ReplayGame } from "./ReplayGame.js"
import { PlayableGame } from "./PlayableGame.js"
export const VOLUME = 0.4
export class StringResource {
	constructor() {
		this.EFFECTS
		this.STATS
		this.SCALE_NAMES
		this.ITEMS
		this.OBSTACLES
		this.ITEMS_SORTED //Map
		this.GLOBAL_SETTING
		this.VISUAL_EFFECTS
		this.GLOBAL_OBSTACLE_EVENT
		this.SPECIAL_EFFECTS = new Map()
		this.ITEM_DATA = [new Map(), new Map(), new Map(), new Map()]
	}
}

const params = new URL(document.location).searchParams
const isReplay = params.get("isreplay")

export const GAME = isReplay
	? new ReplayGame(params.get("replayid"))
	: new PlayableGame(params.get("is_spectator") === "true")

//when html document is loaded
$(document).ready(function () {
	if (!isReplay) auth()

	extendJqueryEasing()
	includeHTML()
	window.onbeforeunload = function (e) {
		return ""
	}
})

/**
 * window.onload -> socket.connect -> requestsetting -> initialsetting
 * -> initui -> requestobs -> requestitem -> requestmap -> drawboard
 * -> boardready -> setupcomplete -> startgame
 */
/**FOR REPLAY
 * window.onload ->  requestreplay -> replaydata
 * -> initui -> requestobs -> requestitem -> requestmap -> drawboard
 * -> boardready -> setupcomplete -> startgame
 *  */
//called when all files including images are loaded
$(window).on("load", function (e) {
	GAME.onCreate()
	console.log("window onload")
})

function extendJqueryEasing() {
	var baseEasings = {}

	$.each(["Quad", "Cubic", "Quart", "Quint", "Expo"], function (i, name) {
		baseEasings[name] = function (p) {
			return Math.pow(p, i + 2)
		}
	})

	$.extend(baseEasings, {
		Sine: function (p) {
			return 1 - Math.cos((p * Math.PI) / 2)
		},
		Circ: function (p) {
			return 1 - Math.sqrt(1 - p * p)
		},
		Elastic: function (p) {
			return p === 0 || p === 1 ? p : -Math.pow(2, 8 * (p - 1)) * Math.sin((((p - 1) * 80 - 7.5) * Math.PI) / 15)
		},
		Back: function (p) {
			return p * p * (3 * p - 2)
		},
		Bounce: function (p) {
			var pow2,
				bounce = 4

			while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
			return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2)
		},
	})

	$.each(baseEasings, function (name, easeIn) {
		$.easing["easeIn" + name] = easeIn
		$.easing["easeOut" + name] = function (p) {
			return 1 - easeIn(1 - p)
		}
		$.easing["easeInOut" + name] = function (p) {
			return p < 0.5 ? easeIn(p * 2) / 2 : 1 - easeIn(p * -2 + 2) / 2
		}
	})
}

function includeHTML() {
	var z, i, elmnt, file, xhttp
	/* Loop through a collection of all HTML elements: */
	z = document.getElementsByTagName("*")
	for (i = 0; i < z.length; i++) {
		elmnt = z[i]
		/*search for elements with a certain atrribute:*/
		file = elmnt.getAttribute("w3-include-html")
		if (file) {
			/* Make an HTTP request using the attribute value as the file name: */
			xhttp = new XMLHttpRequest()
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						elmnt.innerHTML = this.responseText
					}
					if (this.status == 404) {
						elmnt.innerHTML = "Page not found."
					}
					/* Remove the attribute, and call this function once more: */
					elmnt.removeAttribute("w3-include-html")
					includeHTML()
				}
			}
			xhttp.open("GET", file, true)
			xhttp.send()
			/* Exit the function: */
			return
		}
	}
}

function auth() {
	$.ajax({
		method: "POST",
		url: "/room/game",
		data: {},
	})
		.done(function (data, statusText, xhr) {
			let status = xhr.status
			console.log(status)
		})
		.fail(function (data, statusText, xhr) {
			if (data.status === 401) {
				console.error("unauthorized")
				alert("Invalid access!")
				window.location.href = "index.html"
			}
		})
}

//WEBAPP INTERFACE
function backBtnPressed() {
	if (GAME.store_ui.isStoreOpen) {
		GAME.store_ui.closeStore()
	}
}

export function registerSounds() {
	Howler.volume(0.7)
	const sounds = [
		"hit",
		"hit2",
		"basicattack",
		"curse",
		"dice",
		"subway-express",
		"subway-rapid",
		"ghost",
		"glassbreak",
		"gun",
		"heal",
		"knifeslash",
		"largeexplode",
		"lightning",
		"magic",
		"place",
		"revive",
		"roullete",
		"stab",
		"water",
		"trap",
		"wave",
		"web",
		"gold",
		"gold2",
		"store",
		"store2",
		"1r",
		"2r",
		"3r",
		"4r",
		"5r",
		"6r",
		"7r",
		"8r",
		"9r",
		"10r",
		"8r_hit",
		"judgement",
		"wind",
		"bird",
		"ignite",
		"tree_plant",
		"tree_plant_hit",
		"fruit_crush",
		"takemoney",
		"metal",
		"horse",
		"step",
		"hack",
	]

	for (const sound of sounds) {
		GAME.sounds.set(
			sound,
			new Howl({
				src: ["res/sound/" + sound + ".mp3"],
			})
		)
	}
}
