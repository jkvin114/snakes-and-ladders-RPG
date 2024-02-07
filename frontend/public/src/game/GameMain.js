import { ReplayGame } from "./ReplayGame.js"
import { PlayableGame } from "./PlayableGame.js"
export const VOLUME = 0.4

// export const server_url = "http://192.168.0.3:5000"
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
		this.LOCALE
	}
}
export let AxiosApi = {
	get: () => {
		throw Error("Axios api is not initialized")
	},
	post: () => {
		throw Error("Axios api is not initialized")
	},
}
/**
 * axios throws error when status code is >= 300
 */

var everythingLoaded = setInterval(function () {
	if (/loaded|complete/.test(document.readyState)) {
		try {
			if (!axios) return
			axios.defaults.withCredentials = true
			AxiosApi = axios.create({ baseURL: server_url })
			if (main && $) {
				main() // this is the function that gets called when everything is loaded
				clearInterval(everythingLoaded)
			}
		} catch (e) {
			console.error(e)
			// console.error("function main() is not defined!")
			// throw Error("function main() is not defined!   " + e)
		}
	}
}, 100)

const params = new URL(document.location).searchParams
const isReplay = params.get("isreplay")
const isSpectate = params.get("is_spectator") === "true"
export const GAME = isReplay ? new ReplayGame(params.get("replayid")) : new PlayableGame(isSpectate)

export const CONNECTION_TYPE = isReplay ? "rpgreplay" : isSpectate ? "rpgspectate" : "rpggame"

//when html document is loaded
$(document).ready(function () {
	includeHTML()
	window.onbeforeunload = function (e) {
		return ""
	}
})

export function format(str, values) {
	for (const v of values) {
		str = str.replace(/%d/, v)
	}
	return str
}

async function main() {
	if (!isReplay) auth()
	extendJqueryEasing()
	console.log("main")
	await GAME.updateLocale()
	GAME.onCreate()
}
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

// $(window).on("load", async function (e) {
// 	console.log("window onload")
// })

function auth() {
	AxiosApi.post("/room/game")
		.then()
		.catch((e) => {
			if (e.response.status === 401) {
				console.error("unauthorized")
				alert("Invalid access!")
				window.location.href = "/"
			}
		})
}

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

async function includeHTML() {
	var z, i, elmnt, file, xhttp
	/* Loop through a collection of all HTML elements: */
	z = [document.getElementById("newstore_container"), document.getElementById("images_container")]
	for (i = 0; i < z.length; i++) {
		elmnt = z[i]
		/*search for elements with a certain atrribute:*/
		file = elmnt.dataset.html
		if (file) {
			let res = await fetch(file)
			if (res.status == 404) {
				elmnt.innerHTML = "Page not found."
				continue
			}

			const html = await res.text()

			if (res.status == 200) {
				elmnt.innerHTML = html
			}
		}
	}
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
		"scythe",
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
		"throw",
		"launch",
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
