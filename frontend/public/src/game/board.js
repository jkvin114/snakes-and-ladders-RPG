const ZOOM_BTN_SCALES = [0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8]
const PLAYER_POS_DIFF = [
	[8, 9],
	[-17, 2],
	[6, -5],
	[-12, -9],
] //플레이어별 위치 차이
let BOARD_MARGIN = 200
const FRAME = 50 //milisecond
const TILE_SHADOW_THICKNESS_RIGHT = 5
const TILE_SHADOW_THICKNESS_BOTTOM = 10
export const COLOR_LIST_BG = ["#a6c8ff", "#ff7070", "#95ff80", "#fdff80"] //플레이어별 연한 색상
export const easeLinear = function (t, b, c, d) {
	return b + (t / d) * c
}

const sleep = (m) => new Promise((r) => setTimeout(r, m))

export class Board {
	constructor(game) {
		this.game = game
		this.canvas = null
		this.zoomScale = 1 //줌 얼마나 했는지
		this.tiles = [] //모든타일 저장
		this.shadow = null //화면어둡게할때 사용
		this.arrow = null //현재 턴 플레이어 표시
		this.pin = null //플레이어 도착위치 표시
		this.possiblePosList = []
		this.possiblePosTexts = []
		this.tile_shadows = null
		this.boardScale = 1
		this.boardInnerHeight = 0
		this.boardInnerWidth = 0
		this.boardOriginalHeight = 0
		this.boardOriginalWidth = 0
		this.activetiles = [] //선택가능한 타일 저장

		this.canRender = true //make sure the canvas renders only once per certain interval
		this.renderInterval = null
		this.Map
		this.mapname
		this.coordinates
		this.players = []
		this.board_drawn = false
		//singleton
		if (Board._instance) {
			return Board._instance
		}
		Board._instance = this
		this.shouldRender = false
		this.gameSpeed = 1
		this.frame = FRAME
	}
	startRenderInterval() {
		this.renderInterval = setInterval(
			function () {
				// this.canRender = true
				if (this.shouldRender) {
					this.canvas.requestRenderAll()
					this.shouldRender = false
				}
			}.bind(this),
			this.frame
		)
	}

	//===========================================================================================================================
	clearRenderInterval() {
		clearInterval(this.renderInterval)
	}
	changeFPS(fps) {
		this.frame = 1000 / fps
		this.clearRenderInterval()
		this.startRenderInterval()
	}
	//===========================================================================================================================
	getMoveSpeed(type) {
		let speed = 500
		switch (type) {
			case "step":
				speed = 100
				break
			case "tp_simple":
				speed = 500
				break
			case "tp_levitate":
				speed = 300
				break
			case "tp_levitate_hide":
				speed = 150
				break
			case "indicator":
				speed = 2000
				break
			case "entity_move":
				speed = 500
				break
		}

		return this.modifyMoveSpeed(speed)
	}
	modifyMoveSpeed(val) {
		return Math.floor(val / Math.min(4, this.gameSpeed))
	}
	forceRender() {
		this.canvas.renderAll()
	}
	render() {
		this.shouldRender = true
		return
		//	this.canvas.renderAll.bind(this.canvas)
		if (this.canRender) {
			this.canvas.renderAll()
			this.canRender = false
		}
	}
	zoomIn(strength, originX, originY) {
		//upper bound of zoom
		if (this.zoomScale > ZOOM_BTN_SCALES[ZOOM_BTN_SCALES.length - 1]) {
			return
		}
		//pinch zoom
		if (strength > 0) {
			this.scaleBoard(this.zoomScale + strength, originX, originY)
		} //button
		else {
			for (let i = 0; i < ZOOM_BTN_SCALES.length; ++i) {
				if (this.zoomScale < ZOOM_BTN_SCALES[i]) {
					this.scaleBoard(ZOOM_BTN_SCALES[i], originX, originY)
					return
				}
			}
		}
		//$("#board").css("transform","scale(1.4)")
	}
	//===========================================================================================================================

	zoomOut(strength, originX, originY) {
		//lower bound of zoom
		if (this.zoomScale <= ZOOM_BTN_SCALES[0]) {
			return
		} //pinch zoom
		if (strength) {
			this.scaleBoard(this.zoomScale - strength, originX, originY)
		} //button
		else {
			for (let i = ZOOM_BTN_SCALES.length - 1; i >= 0; --i) {
				if (this.zoomScale > ZOOM_BTN_SCALES[i]) {
					this.scaleBoard(ZOOM_BTN_SCALES[i], originX, originY)
					return
				}
			}
		}
		// this.scaleBoard(Math.max(0, (this.zoomScale -= 1)))
	}
	/**	//===========================================================================================================================

	 * for zoom button
	 * transform origin always 50% 50%
	 */
	zoomInCenterOrigin() {
		if (this.zoomScale > ZOOM_BTN_SCALES[ZOOM_BTN_SCALES.length - 1]) {
			return
		}

		for (let i = 0; i < ZOOM_BTN_SCALES.length; ++i) {
			if (this.zoomScale < ZOOM_BTN_SCALES[i]) {
				this.scaleBoard(ZOOM_BTN_SCALES[i], 0.8, 0.2)
				return
			}
		}
	}
	//===========================================================================================================================

	/**
	 * for zoom button
	 * transform origin always 50% 50%
	 */
	zoomOutCenterOrigin() {
		if (this.zoomScale <= ZOOM_BTN_SCALES[0]) {
			return
		}
		for (let i = ZOOM_BTN_SCALES.length - 1; i >= 0; --i) {
			if (this.zoomScale > ZOOM_BTN_SCALES[i]) {
				this.scaleBoard(ZOOM_BTN_SCALES[i], 0.8, 0.2)
				return
			}
		}
	}
	//===========================================================================================================================

	// /**
	//  * 터치/클릭 좌표에서 보드에서 위치 구함
	//  * @param {f} pageX
	//  * @param {*} pageY
	//  * @returns
	//  */
	// pagePosToTransformOrigin(pageX, pageY) {
	// 	let board_container = this.game.ui.elements.board_container
	// 	let y = (board_container.scrollLeft + pageX) / (this.boardOriginalWidth * this.zoomScale)
	// 	let x = (board_container.scrollTop + pageY) / (this.boardOriginalHeight * this.zoomScale)

	// 	return { x: x, y: y }
	// }

	//===========================================================================================================================

	scaleBoard(scale, originX, originY) {
		this.zoomScale = scale
		$("#boardwrapper").css("transform-origin", String(originX * 100) + "% " + String(originY * 100) + "%")

		$("#boardwrapper").css("transform", `scale(${this.zoomScale})`)
	}
	moveBoardToPlayer(turn) {
		// $("#canvas-container").stop()
		let pos = this.getPlayerPos(turn)
		let rect = document.getElementById("boardwrapper").getBoundingClientRect()
		//	//console.log(pos.x * this.zoomScale, pos.y * this.zoomScale)
		// rect = document.getElementById("canvas-container").getBoundingClientRect()
		// //console.log(rect)

		let x = rect.left + pos.x * this.boardScale * this.zoomScale - window.innerWidth / 2 //+ ( )// - this.game.ui.winwidth/2)
		let y = rect.top + pos.y * this.boardScale * this.zoomScale - window.innerHeight / 2

		if (this.game.ui != null) this.game.ui.elements.board_container.scrollBy(x, y)
		//		 this.game.ui.elements.board_container.scrollBy((pos.x* this.zoomScale-this.game.ui.winwidth/2), 0)

		// //console.log("moveboard x" + Math.floor(this.game.ui.elements.board_container.scrollLeft)
		// + "  y" + Math.floor(this.game.ui.elements.board_container.scrollTop))
	}
	lockFabricObject(obj) {
		obj.set({
			lockMovementX: true,
			lockMovementY: true,
			hasControls: false,
			hasBorders: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			originX: "center",
			originY: "center",
		})
	}
	//===========================================================================================================================

	setEffectImageAttr(elem, posX, posY, scaleX, scaleY, opacity, angle) {
		if (!elem) return
		elem
			.set({
				opacity: opacity,
				left: posX,
				top: posY,
				scaleX: scaleX,
				scaleY: scaleY,
				angle: angle,
			})
			.bringToFront()
	}
	removeImage(elem) {
		if (!elem) return
		this.canvas.remove(elem)
	}
	removeImageAfter(elem, ms) {
		if (!elem) return

		setTimeout(() => {
			this.removeImage(elem)
		}, ms)
	}
	extrapolate(start, end, scale) {
		return start + (end - start) * scale
	}
	getBearingAngle(pos1, pos2) {
		let angle
		if (pos1.x === pos2.x && pos2.y === pos1.y) return Math.floor(Math.random() * 180)
		if (pos1.x < pos2.x) {
			angle = 90 + Math.atan((pos2.y - pos1.y) / (pos2.x - pos1.x)) * (180 / Math.PI)
		} else {
			angle = 270 + Math.atan((pos1.y - pos2.y) / (pos1.x - pos2.x)) * (180 / Math.PI)
		}
		return angle
	}

	slopeBearingAngle(slope) {
		return this.getBearingAngle({ x: 0, y: 0 }, { x: 1, y: slope })
	}

	distance(pos1, pos2) {
		return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2)
	}

	/**
	 *
	 * @param {*} elem element to animate
	 * @param {*} start start x,y pos
	 * @param {*} dest dest x,y pos
	 * @param {*} duration total duartion
	 * @param {*} curveStrength value of parabolaheight/distance
	 * @param {*} angle rotates randomly if set to "random"
	 * @param {*} easing easing method for x direction animation :"in" or "out" or none
	 */
	async animateParabola(elem, start, dest, duration, curveStrength, angle, easing) {
		const bearing = ((this.getBearingAngle(start, dest) + 360) % 360) - 90
		const group = new fabric.Group([elem], { evented: false })
		// console.log(bearing)
		const dist = this.distance(start, dest) //alpha
		const flip = bearing > 90 && bearing < 270

		//if curvestrehgth is nonzero, minimum x distance will be applied
		const parabolaHeight = Math.min(100, dist) * curveStrength //beta
		// console.log(bearing)
		const startAngle = this.slopeBearingAngle((-4 * parabolaHeight) / dist) //* (flip?-1:1) %360
		const angleinit = flip ? -startAngle + 180 : startAngle
		// console.log(startAngle)
		elem.set({
			top: 0,
			left: 0,
			originX: "center",
			originY: "center",
			angle: angleinit,
		})
		group.set({ angle: bearing, left: start.x, top: start.y, originX: "center", originY: "center", flipY: false })
		this.canvas.add(elem)
		this.canvas.add(group)
		this.removeImageAfter(elem, duration + 200)
		this.removeImageAfter(group, duration + 200)

		let xEasing = easeLinear
		if (easing === "in") {
			xEasing = fabric.util.ease.easeInCubic
		} else if (easing === "out") {
			xEasing = fabric.util.ease.easeOutCubic
		}
		elem.animate("left", dist, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: xEasing,
		})
		if (angle === "random") {
			elem.animate("angle", 600, {
				onChange: this.render.bind(this),
				duration: duration,
				easing: easeLinear,
			})
		} else {
			elem.animate("angle", 90, {
				onChange: this.render.bind(this),
				duration: duration / 2,
				easing: fabric.util.ease.easeOutQuad,
			})
		}
		elem.animate("top", parabolaHeight * (flip ? 1 : -1), {
			onChange: this.render.bind(this),
			duration: duration / 2,
			easing: fabric.util.ease.easeOutQuad,
		})
		await sleep(duration / 2)

		elem.animate("top", 0, {
			onChange: this.render.bind(this),
			duration: duration / 2,
			easing: fabric.util.ease.easeInQuad,
		})
		if (angle !== "random") {
			elem.animate("angle", flip ? startAngle : 180 - startAngle, {
				onChange: this.render.bind(this),
				duration: duration / 2,
				easing: fabric.util.ease.easeInQuad,
			})
		}
		// canvas.add(container);
		// canvas.add(group);
	}
	animateOpacity(elem, opacity, duration) {
		if (!elem) return
		elem.animate("opacity", opacity, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	animateScaleY(elem, scaleY, duration) {
		if (!elem) return
		elem.animate("scaleY", scaleY, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	animateScaleX(elem, scaleX, duration) {
		if (!elem) return
		elem.animate("scaleX", scaleX, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	animateScale(elem, scale, duration) {
		if (!elem) return
		this.animateScaleX(elem, scale, duration)
		this.animateScaleY(elem, scale, duration)
	}
	animateAngle(elem, angle, duration) {
		if (!elem) return
		elem.animate("angle", angle, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	animateX(elem, x, duration, linearEasing) {
		if (!linearEasing)
			elem.animate("left", x, {
				onChange: this.render.bind(this),
				duration: duration,
				easing: fabric.util.ease.easeInCubic,
			})
		else
			elem.animate("left", x, {
				onChange: this.render.bind(this),
				duration: duration,
				easing: easeLinear,
			})
	}
	animateY(elem, y, duration, linearEasing) {
		if (!linearEasing)
			elem.animate("top", y, {
				onChange: this.render.bind(this),
				duration: duration,
				easing: fabric.util.ease.easeInCubic,
			})
		else
			elem.animate("top", y, {
				onChange: this.render.bind(this),
				duration: duration,
				easing: easeLinear,
			})
	}
	animateXEaseOut(elem, x, duration) {
		elem.animate("left", x, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	animateYEaseOut(elem, y, duration) {
		elem.animate("top", y, {
			onChange: this.render.bind(this),
			duration: duration,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	lockFabricObjectNoOrigin(obj) {
		obj.set({
			lockMovementX: true,
			lockMovementY: true,
			hasControls: false,
			hasBorders: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
		})
	}
	getPlayerPos(target) {
		return {
			x: this.players[target].playerimg.get("left"),
			y: this.players[target].playerimg.get("top"),
		}
	} //===========================================================================================================================

	getTilePos(tile) {
		return {
			x: this.getCoord(tile).x + BOARD_MARGIN,
			y: this.getCoord(tile).y + BOARD_MARGIN,
		}
	}
	setMap(map) {
		this.Map = map
		this.mapname = this.Map.mapname
		//console.log(this.Map)
	}
	setMapCoordinates(coord) {
		this.coordinates = coord
	}

	setToMarble() {
		BOARD_MARGIN = 0
	}

	getCoord(i) {
		let coord = undefined
		if (i === undefined) i = 0
		if (!this.coordinates) {
			coord = this.Map.coordinates[Math.min(i, this.Map.coordinates.length - 1)]
		} else coord = this.coordinates[Math.min(i, this.coordinates.length - 1)]

		if (!coord) return { x: 0, y: 0 }
		else return coord
	}
	mapLength() {
		if (this.Map.coordinates != null) return this.Map.coordinates.length

		return this.coordinates.length
	}
	tileShadow(i) {
		return new fabric.Image(document.getElementById("tile_shadow"), {
			originX: "center",
			originY: "center",
			width: 55,
			height: 55,
			objectCaching: false,
			top: this.getCoord(i).y + BOARD_MARGIN + TILE_SHADOW_THICKNESS_BOTTOM,
			left: this.getCoord(i).x + BOARD_MARGIN + TILE_SHADOW_THICKNESS_RIGHT,
		})
	}
	tileShadowLarge(i) {
		return new fabric.Image(document.getElementById("tile_shadow"), {
			originX: "center",
			originY: "center",
			width: 110,
			height: 110,
			objectCaching: false,
			top: this.getCoord(i).y + BOARD_MARGIN + TILE_SHADOW_THICKNESS_BOTTOM * 2,
			left: this.getCoord(i).x + BOARD_MARGIN + TILE_SHADOW_THICKNESS_RIGHT * 2,
		})
	}
	drawBoard(resolve) {
		this.canvas = new fabric.Canvas("board", { renderOnAddRemove: false })
		this.canvas.preserveObjectStacking = true

		this.canvas.selection = false

		let boardimg
		if (this.mapname === "ocean") {
			boardimg = document.getElementById("ocean_boardimg")
		} else if (this.mapname === "casino") {
			boardimg = document.getElementById("casino_boardimg")
		} else if (
			this.mapname === "marble_godhand" ||
			this.mapname === "marble_world" ||
			this.mapname === "marble_water"
		) {
			boardimg = document.getElementById("marble_boardimg")
		} else if (this.mapname === "rapid") {
			boardimg = document.getElementById("rapid_boardimg")
		} else {
			boardimg = document.getElementById("boardimg")
		}

		this.canvas.setBackgroundImage(
			new fabric.Image(boardimg, {
				//  scaleX:scale,scaleY:scale,
				left: 0,
				top: 0,
				lockMovementX: true,
				lockMovementY: true,
				hasControls: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
				hoverCursor: "pointer",
				objectCaching: false,
			})
		)
		this.boardInnerHeight = boardimg.naturalHeight
		this.boardInnerWidth = boardimg.naturalWidth
		this.setBoardScale(boardimg)
		this.drawTiles()

		this.showObjects()
	}
	showObjects() {
		//화살표 =============================================================================
		let arrow = new fabric.Image(document.getElementById("arrow"), {
			evented: false,
			opacity: 0,
			left: 0,
			top: 0,
			scaleX: 0.5,
			scaleY: 0.5,
			objectCaching: false,
		})
		this.lockFabricObject(arrow)
		this.canvas.add(arrow)
		this.arrow = arrow
		//도착지점 핀 =============================================================================

		let pin = new fabric.Image(document.getElementById("pin"), {
			evented: false,
			opacity: 0,
			left: 0,
			top: 0,
			scaleX: 0.8,
			scaleY: 0.8,
			objectCaching: false,
		})
		this.lockFabricObject(pin)
		this.canvas.add(pin)
		this.pin = pin
		//주컨사용시 숫자표시=================================================================
		for (let i = 0; i < 6; ++i) {
			let dicenum = new fabric.Text(String(i + 1), {
				fontSize: 30,
				fill: "white",
				// textBackgroundColor: "black",
				opacity: 1,
				evented: false,
				strokeWidth: 1,
				stroke: "black",
				top: 0,
				left: 0,
				visible: false,
				fontFamily: "Do Hyeon",
			})
			this.lockFabricObject(dicenum)
			this.canvas.add(dicenum)
			this.possiblePosTexts.push(dicenum)
		}

		this.shadow = new fabric.Rect({
			left: 0,
			top: 0,
			width: 2500,
			height: 2500,
			lockMovementX: true,
			lockMovementY: true,
			visible: false,
			hasControls: false,
			hasBorders: false,
			evented: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			opacity: 0.4,
		})
		this.canvas.add(this.shadow)
		// this.shadow.bringForward()
	}
	showPlayer(target, pos) {
		this.players[target].playerimg.set({
			opacity: 1,
			top: this.getCoord(pos).y + BOARD_MARGIN + PLAYER_POS_DIFF[target][1],
			left: this.getCoord(pos).x + BOARD_MARGIN + PLAYER_POS_DIFF[target][0],
		})
		this.players[target].nametext.set("stroke", "black")
		this.updateNameText(target)

		this.forceRender()
	}
	//===========================================================================================================================

	updateNameText(turn) {
		let pos = this.getPlayerPos(turn)
		//	//console.log(pos)
		this.players[turn].nametext.set({ top: pos.y - 30, left: pos.x })
		this.render()
	}
	//===========================================================================================================================

	showArrow(turn) {
		this.playersToFront()
		let pos = this.getPlayerPos(turn)
		//console.log(pos)
		this.arrow.set({ top: pos.y - 70, left: pos.x, opacity: 1 }).bringToFront()
		this.forceRender()
	}
	hideArrow() {
		this.arrow.set({ opacity: 0 })
		this.forceRender()
	}
	showPin(pos) {
		pos = this.getTilePos(pos)
		//	//console.log(pos)
		this.pin.set({ top: pos.y - 20, left: pos.x, opacity: 1 }).bringToFront()
		//	this.forceRender()
	}
	teleportPlayer(target, pos, movetype) {
		this.hideArrow()
		if (movetype === "simple") {
			this.tpPlayerSimple(target, pos)
		} else if (movetype === "levitate") {
			// //console.log("tp")
			this.levitatePlayer(target)
			let time = this.getMoveSpeed("tp_levitate")
			//	//console.log("tp")
			setTimeout(() => this.tpPlayer(target, pos), time)
		}
		setTimeout(() => {
			this.updateNameText(target)
		}, this.getMoveSpeed("tp_simple") * 2)
	}
	//===========================================================================================================================

	tpPlayerSimple(target, pos) {
		pos = Math.max(pos, 0)
		let x = this.getCoord(pos).x + BOARD_MARGIN
		let y = this.getCoord(pos).y + BOARD_MARGIN

		this.players[target].pos = pos
		let time = this.getMoveSpeed("tp_simple")

		this.players[target].playerimg.animate("top", y + PLAYER_POS_DIFF[target][1], {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutBack,
		})
		this.players[target].playerimg.animate("left", x + PLAYER_POS_DIFF[target][0], {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutBack,
		})
	}

	moveComplete(turn) {
		this.updateNameText(turn)
		this.pin.set({ opacity: 0 })
	}
	/**
	 *
	 * @param {*} actualdice 주사위 숫자
	 * @param {*} count 현재까지 이동한 칸수
	 * @param {*} pos 움직이기 전 위치
	 * @param {*} turn 플레이어 턴
	 */
	moveBackward(actualdice, count, pos, turn) {
		//뒤로가는 주사위 and 플레이어가 시작점이 아닐경우

		if (count > -1 * actualdice) {
			this.moveComplete(turn)
			return
		}
		// //console.log(pos-count)
		let x = this.getCoord(pos - count).x + PLAYER_POS_DIFF[turn][0] + BOARD_MARGIN
		let y = this.getCoord(pos - count).y + PLAYER_POS_DIFF[turn][1] + BOARD_MARGIN
		const time = this.getMoveSpeed("step")

		this.players[turn].playerimg.animate("left", x, {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutCubic,
		})
		this.players[turn].playerimg.animate("top", y, {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutCubic,
		})
		this.onStep()
		setTimeout(
			function () {
				this.movePlayer(actualdice, count + 1, pos, turn)
			}.bind(this),
			time
		)
	}
	//===========================================================================================================================

	moveForward(actualdice, count, pos, turn) {
		// if((pos+count)>finishPos){
		//   moveComplete(true)
		//   return;
		// }

		if (count > actualdice) {
			this.moveComplete(turn)
			// this.game.moveComplete()
			// let ui = this.game.turn2ui(turn)
			// this.players[turn].nametext.set("text", "(" + String(turn + 1) + "P)" + $(this.game.ui.elements.hpis[ui]).html())
			// this.updateNameText(turn)

			return
		}
		const time = this.getMoveSpeed("step")

		let x = this.getCoord(pos + count).x + PLAYER_POS_DIFF[turn][0] + BOARD_MARGIN
		let y = this.getCoord(pos + count).y + PLAYER_POS_DIFF[turn][1] + BOARD_MARGIN

		this.players[turn].playerimg.animate("left", x, {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutCubic,
		})
		this.players[turn].playerimg.animate("top", y, {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutCubic,
		})
		this.onStep()
		setTimeout(
			function () {
				this.movePlayer(actualdice, count + 1, pos, turn)
			}.bind(this),
			time
		)
	}

	//===========================================================================================================================

	/**
	 *
	 * @param {*} distance 이동해야할 칸수
	 * @param {*} count 현재까지 이동한 칸수
	 * @param {*} pos 움직이기 전 위치
	 * @param {*} turn 플레이어 턴
	 */
	movePlayer(distance, count, pos, turn) {
		this.arrow.set({ opacity: 0 })
		this.arrow.bringToFront()
		if (distance === 0) {
			this.game.moveComplete(false)
			return
		}
		this.hideNameText(turn)
		if (distance < 0) {
			if (-1 * distance > pos) {
				distance = -1 * pos
			}
			this.moveBackward(distance, count, pos, turn)
			return
		}

		this.moveForward(distance, count, pos, turn)
	}
	hideNameText(turn) {
		this.players[turn].nametext.set("text", "")
	}
	async movePlayerThrough(poslist, turn, movetype, callback) {
		if (poslist.length === 0) {
			this.moveComplete(turn)
			callback(turn)
			return
		}
		const time = this.getMoveSpeed("step")
		const speed = movetype === "travel" ? time * 0.4 : time
		this.arrow.set({ opacity: 0 })
		this.arrow.bringToFront()
		this.hideNameText(turn)
		// this.players[turn].nametext.set("text", "")
		this.players[turn].playerimg.bringToFront()
		this.showPin(poslist[poslist.length - 1])
		let count = 0
		const interval = setInterval(() => {
			if (count >= poslist.length) {
				clearInterval(interval)
				this.moveComplete(turn)
				callback(turn)
				return
			}
			const pos = poslist[count]
			let x = this.getCoord(pos).x + PLAYER_POS_DIFF[turn][0] + BOARD_MARGIN
			let y = this.getCoord(pos).y + PLAYER_POS_DIFF[turn][1] + BOARD_MARGIN

			this.players[turn].playerimg.animate("left", x, {
				onChange: this.render.bind(this),
				duration: speed,
				easing: fabric.util.ease.easeOutCubic,
			})
			this.players[turn].playerimg.animate("top", y, {
				onChange: this.render.bind(this),
				duration: speed,
				easing: fabric.util.ease.easeOutCubic,
			})
			this.onStep()
			count++
		}, speed)

		// for (const pos of poslist) {
		// 	let x = this.getCoord(pos).x + PLAYER_POS_DIFF[turn][0] + BOARD_MARGIN
		// 	let y = this.getCoord(pos).y + PLAYER_POS_DIFF[turn][1] + BOARD_MARGIN

		// 	this.players[turn].playerimg.animate("left", x, {
		// 		onChange: this.render.bind(this),
		// 		duration: speed,
		// 		easing: fabric.util.ease.easeOutCubic,
		// 	})
		// 	this.players[turn].playerimg.animate("top", y, {
		// 		onChange: this.render.bind(this),
		// 		duration: speed,
		// 		easing: fabric.util.ease.easeOutCubic,
		// 	})
		// 	this.onStep()
		// 	await sleep(speed)
		// }
	}
	//===========================================================================================================================

	tpPlayer(target, pos) {
		this.players[target].playerimg.set({ opacity: 1 })
		let x = this.getCoord(pos).x + BOARD_MARGIN
		let y = this.getCoord(pos).y + BOARD_MARGIN
		this.players[target].playerimg.set({ left: x + PLAYER_POS_DIFF[target][0], top: 0 })

		this.players[target].pos = pos
		let time = this.getMoveSpeed("tp_levitate")
		this.players[target].playerimg.animate("top", y + PLAYER_POS_DIFF[target][1], {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutBounce,
		})
		// if (target === this.game.myturn) {
		// 	setTimeout(moveBoardInstant({ x: x, y: y }, 2), time - 100)
		// }
	}

	//===========================================================================================================================

	levitatePlayer(target) {
		let time = this.getMoveSpeed("tp_levitate_hide")
		let thisimg = this.players[target].playerimg
		thisimg.animate("top", 0, {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeInCubic,
		})

		setTimeout(
			function () {
				thisimg.set({ opacity: 0 })
			}.bind(this),
			time
		)
	}
	showPossiblePos() {
		if (this.possiblePosList.length < 1) return

		this.canvas.bringToFront(this.shadow)
		this.canvas.discardActiveObject()
		this.shadow.set({ visible: true, opacity: 0.2 })

		for (let i = 0; i < this.possiblePosList.length; ++i) {
			let pos = this.possiblePosList[i]
			if (pos < 0 || pos > this.mapLength()) {
				continue
			}
			//console.log(pos)

			if (this.tiles[pos] != null) {
				this.activetiles.push(pos)
				this.tiles[pos].bringToFront()
			}

			let coordpos = this.getTilePos(pos)
			this.possiblePosTexts[i].set({ left: coordpos.x, top: coordpos.y + 30, visible: true })
			this.possiblePosTexts[i].bringToFront()
			// if (this.Map.muststop.includes(pos)) {
			// 	break
			// }
		}
		for (let p of this.activeProjectileList.values()) {
			p.bringToFront()
		}
		for (let t of this.possiblePosTexts) {
			t.bringToFront()
		}
		this.playersToFront()
	}

	//===========================================================================================================================

	hidePossiblePos() {
		this.shadow.set({ opacity: 0.4 })
		this.tileReset()

		for (let t of this.possiblePosTexts) {
			t.set({ visible: false })
		}
		this.playersToFront()
	}

	//===========================================================================================================================

	playersToFront() {
		for (let i = 0; i < this.players.length; ++i) {
			// //console.log(this.findPlayerImgInGroup(i))
			// //console.log(i)
			// //console.log(this.players[i])
			this.players[i].playerimg.bringToFront()
		}
		this.render()
	} //===========================================================================================================================

	nameTextsToFront() {
		for (let i = 0; i < this.players.length; ++i) {
			// //console.log(this.findPlayerImgInGroup(i))
			this.players[i].nametext.bringToFront()
		}
	}
	showRangeTiles(start, end, type, size) {
		this.canvas.bringToFront(this.shadow)
		this.canvas.discardActiveObject()
		this.shadow.set({ visible: true })
		for (let i = start; i < end; ++i) {
			this.liftTile(i, type, size)
		}
		this.playersToFront()
	}

	showRangeTilesByList(list, type, size) {
		this.canvas.bringToFront(this.shadow)
		this.canvas.discardActiveObject()
		this.shadow.set({ visible: true })
		for (let i of list) {
			this.liftTile(i, type, size)
		}
		this.playersToFront()
	}

	tileReset() {
		this.canvas.discardActiveObject()
		this.playersToFront()
		for (let t of this.activetiles) {
			this.tiles[t].off()
			this.tiles[t].sendToBack()
			this.tiles[t].set({
				hoverCursor: "default",
				evented: false,
			})
		}
		this.shadow.set({ visible: false, opacity: 0.4 })

		this.shadow.sendToBack()
		if (this.tile_shadows) this.tile_shadows.sendToBack()
		this.forceRender()
		this.activetiles = []
	}
	activateTile(index, onSelect) {
		this.activetiles.push(index)
		this.tiles[index].setCoords()
		this.tiles[index].set({ hoverCursor: "pointer", evented: true })
		this.tiles[index].on("mousedown", onSelect)

		this.tiles[index].bringToFront()
	}
}
