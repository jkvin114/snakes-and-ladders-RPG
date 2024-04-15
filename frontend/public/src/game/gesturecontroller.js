export class GestureController {
	constructor(game) {
		this.game = game
		this.lastZoomScale = null
		this.waitingDoudleClick = false
		this.mousePosX = 0
		this.mousePosY = 0
		this.clicked = false //for drag check

		this.board_container = document.getElementById("canvas-container")
		this._boardside = document.getElementById("boardside")
	}
	init() {
		this.addMouseEvent()
		this.addTouchEvent()
		this.addWheelEvent()
	}

	addWheelEvent() {
		// wheelzoom(document.getElementById("board"), {zoom:0.05});
		// return
		document.getElementById("boardwrapper").addEventListener(
			"wheel",
			function (event) {
				event.preventDefault()

				let rect = document.getElementById("boardwrapper").getBoundingClientRect()
				let originX = Math.max((this.mousePosX - rect.left) / rect.width, 0)
				let originY = Math.max((this.mousePosY - rect.top) / rect.height, 0)
				if (event.deltaY < 0) {
					this.game.scene.zoomOut(0.05, originX, originY)
				} else if (event.deltaY > 0) {
					this.game.scene.zoomIn(0.05, originX, originY)
				}
			}.bind(this)
		)
		document.getElementById("board").addEventListener("wheel", function (event) {
			event.preventDefault()
		})
		this._boardside.addEventListener(
			"mousemove",
			function (coord) {
				this.mousePosX = coord.pageX
				this.mousePosY = coord.pageY
			}.bind(this)
		)
	}

	addTouchEvent() {
		let board_container = this.board_container
		this._boardside.addEventListener(
			"touchstart",
			function (click_pos) {
				this.clicked = true

				let origX = click_pos.changedTouches[0].pageX + board_container.scrollLeft
				let origY = click_pos.changedTouches[0].pageY + board_container.scrollTop

				if (this.waitingDoudleClick && click_pos.targetTouches.length === 1) {
					//double touch
					this.waitingDoudleClick = false
					if (this.game.myturn !== undefined) this.game.scene.moveBoardToPlayer(this.game.myturn)
					this.clicked = false
				} else if (click_pos.targetTouches.length === 1) {
					this.waitingDoudleClick = true
					setTimeout((() => (this.waitingDoudleClick = false)).bind(this), 150)
				}

				this.lastZoomScale = 0

				this._boardside.addEventListener(
					"touchmove",
					function (e) {
						if (e.targetTouches.length === 2) {
							let l = this.lastZoomScale
							let gesturedata = this.gesturePinchZoom(e)
							if (!gesturedata) return

							let rect = document.getElementById("boardwrapper").getBoundingClientRect()
							let originX = Math.max((gesturedata.originX - rect.left) / rect.width, 0)
							let originY = Math.max((gesturedata.originY - rect.top) / rect.height, 0)

							if (gesturedata.zoom > 0.4) {
								this.game.scene.zoomIn(0.07, originX, originY)
							} else if (gesturedata.zoom < -0.4) {
								this.game.scene.zoomOut(0.07, originX, originY)
							}
						} else {
							if (!this.clicked) return
							let curX = e.changedTouches[0].pageX + board_container.scrollLeft
							let diffX = origX - curX

							let curY = e.changedTouches[0].pageY + board_container.scrollTop
							let diffY = origY - curY

							board_container.scrollBy(diffX, diffY)
						}
					}.bind(this),
					false
				)
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"touchend",
			function () {
				this.lastZoomScale = null
				this.clicked = false
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"touchcancel",
			function () {
				this.lastZoomScale = null
				this.clicked = false
			}.bind(this),
			false
		)
	}
	gesturePinchZoom(event) {
		let zoom = false

		if (event.targetTouches.length === 2) {
			let p1 = event.targetTouches[0]
			let p2 = event.targetTouches[1]
			let zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)) //euclidian distance
			let centerX = (p2.pageX + p1.pageX) / 2
			let centerY = (p2.pageY + p1.pageY) / 2
			//	let origin = GAME.scene.pagePosToTransformOrigin(centerX, centerY)

			if (this.lastZoomScale !== null) {
				zoom = zoomScale - this.lastZoomScale
			}

			this.lastZoomScale = zoomScale
			return {
				zoom: zoom,
				originX: centerX,
				originY: centerY,
			}
		}
		return null
	}

	addMouseEvent() {
		let board_container = this.board_container
		this._boardside.addEventListener(
			"mousedown",
			function (click_pos) {
				let origX = click_pos.pageX + board_container.scrollLeft
				let origY = click_pos.pageY + board_container.scrollTop
				this.clicked = true
				// console.log("mousedown")
				if (this.waitingDoudleClick) {
					this.waitingDoudleClick = false
					if (this.game.myturn !== undefined) this.game.scene.moveBoardToPlayer(this.game.myturn)
					this.clicked = false
				} else {
					this.waitingDoudleClick = true
					setTimeout(() => (this.waitingDoudleClick = false), 150)
				}
				this._boardside.addEventListener(
					"mousemove",
					function (coord) {
						if (!this.clicked) return
						let curX = coord.pageX + board_container.scrollLeft
						let diffX = origX - curX

						let curY = coord.pageY + board_container.scrollTop
						let diffY = origY - curY

						board_container.scrollBy(diffX, diffY)
						////console.log("x" + Math.floor(board_container.scrollLeft) + "  y" + Math.floor(board_container.scrollTop))
					}.bind(this),
					false
				)
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"mouseup",
			function (e) {
				this.clicked = false
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"mouseleave",
			function (e) {
				this.clicked = false
			}.bind(this),
			false
		)
		this._boardside.addEventListener(
			"mouseout",
			function (e) {
				this.clicked = false
			}.bind(this),
			false
		)
	}
}
