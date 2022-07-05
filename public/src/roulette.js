
/**
 * Depreciated
 */

const CASINO = 1
const TRIAL = 2
const casinocolor = [
	"#f5dd42",
	"#f5b642",
	"#f5dd42",
	"#f5b642",
	"#f5dd42",
	"#f5b642",
]
const trialcolor = ["#fbc", "#f88", "#fbc", "#f88", "#fbc", "#f88"]
import { GAME } from "./script.js"

const slices = 6
const sliceDeg = 360 / slices
let deg = rand(0, 360)
let speed = 0
const slowDown = 0.989
let ctx = document.getElementById("roullete").getContext("2d")
const width = document.getElementById("roullete").width // size
const center = width / 2 // center
let isStopped = false
let rouletteType = 0
let framecount = 0
function rand(min, max) {
	return Math.random() * (max - min) + min
}

function deg2rad(deg) {
	return (deg * Math.PI) / 180
}

function drawSlice(deg, color) {
	ctx.beginPath()
	ctx.fillStyle = color
	ctx.moveTo(center, center)
	ctx.arc(center, center, width / 2, deg2rad(deg), deg2rad(deg + sliceDeg))
	ctx.lineTo(center, center)
	ctx.fill()
}

function drawText(deg, text) {
	ctx.save()
	ctx.translate(center, center)
	ctx.rotate(deg2rad(deg))
	ctx.textAlign = "right"
	ctx.fillStyle = "#000"
	if (text.length > 15) {
		ctx.font = "bold 7px Do Hyeon"
	} else {
		ctx.font = "bold 12px Do Hyeon"
	}
	ctx.fillText(text, 130, 10)
	ctx.restore()
}

function drawImg() {
	ctx.clearRect(0, 0, width, width)
	for (let i = 0; i < slices; i++) {
		if (rouletteType === CASINO) {
			drawSlice(deg, casinocolor[i])
			drawText(
				deg + sliceDeg / 2,
				GAME.strRes.CASINO_LABELS[i]
			)
		} else if ((rouletteType = TRIAL)) {
			drawSlice(deg, trialcolor[i])
			drawText(deg + sliceDeg / 2, GAME.strRes.TRIAL_LABELS[i])
		}
		deg += sliceDeg
	}
}

function anim() {
	deg += speed
	deg %= 360
	framecount += 1
	// Increment speed
	if (!isStopped && speed < 4.7) {
		speed = speed + 1 * 0.1
	}
	if (speed > 4.5) {
		isStopped = true
	}
	// Decrement Speed
	if (isStopped) {
		speed = speed > 0.2 ? (speed *= slowDown) : 0
	}
	// Stopped!
	if (!speed) {
		indicateRoulleteResult()
		setTimeout(roulleteEnd, 1500)
	}

	drawImg()
	if (speed > 0) {
		window.requestAnimationFrame(anim)
	}
}

function indicateRoulleteResult() {
	if (rouletteType === CASINO) {
		GAME.ui.showObsNotification(38,
				GAME.strRes.CASINO_LABELS[GAME.roullete_result]
		)
	} else if (rouletteType === TRIAL) {
		GAME.playSound("judgement")
		GAME.ui.showObsNotification(37,
				GAME.strRes.TRIAL_LABELS[GAME.roullete_result]
		)
	}
}

export function randomObs(iscasino,num) {
	GAME.roullete_result = num
	if (iscasino) {
		rouletteType = CASINO
	} else {
		rouletteType = TRIAL
	}
	console.log(GAME.roullete_result)
	$("#casino").show()
	$(".overlay").show()
	let r = 1
	console.log("roullete", GAME.roullete_result)
	deg = Math.abs(GAME.roullete_result - 6) * 60 + Math.random() * 15 + 95
	drawImg()

	if (GAME.ismyturn) {
		$("#casinobtn").show()
	} else {
		$("#casinobtn").hide()
	}
	// $("#casinobtn").show()
}

/**
 * 룰렛 돌리면 호출
 */
 export function calculatePrize() {
	GAME.playSound("roullete")
	$("#casinobtn").hide()
	//let stopAt = (GAME.roullete_result -1) * 60 + (Math.random() * 20);
	if (GAME.ismyturn) {
		GAME.connection.turnRoullete() //다른플레이어에게 전송
	}
	anim()
	// setTimeout(()=>{isStopped=true},2000)
}

function roulleteEnd() {
	$("#casino").hide()
	$(".overlay").hide()
	if (GAME.ismyturn) {
		GAME.connection.roulleteComplete()
	}
	isStopped = false
	speed = 0
}


$(document).ready(function(){
	$("#casinobtn").click(calculatePrize)
})
// Usual pointer drawing code.

function playRoulleteSound() {
	return
	let audio = document.getElementById("sound_tick")
	audio.pause()
	audio.currentTime = 0 // Play the sound.
	audio.play()
}
