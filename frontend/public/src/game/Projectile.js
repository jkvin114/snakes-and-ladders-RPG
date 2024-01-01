const PROJ_DIFF_X = [0, -3, 0, 3] //플레이어별 투사체범위 위치 차이
const BOARD_MARGIN = 200
const PROJ_DIFF_Y = [-3, 0, 3, 0] //플레이어별 투사체범위 위치 차이

export class PassProjectile {
	/**
	 *
	 * @param {*} pos 위치
	 * @param {*} name 종류
	 * @param {*} tile 타일 오브젝트
	 * @param {*} icon 아이콘 오브젝트
	 * @param {*} id UPID
	 */
	constructor(scene, pos, name, tile, icon, id, stop = null) {
		this.scene = scene
		this.pos = pos
		this.name = name
		this.tile = tile
		this.stop = stop

		this.UPID = id
		this.icon = icon
	}
	show() {
		this.tile.set({
			left: this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN,
			top: this.scene.Map.coordinates[this.pos].y + BOARD_MARGIN,
			visible: true,
			evented: true,
		})

		this.icon.set({
			left: this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN,
			top: this.scene.Map.coordinates[this.pos].y + 25 + BOARD_MARGIN,
			visible: true,
			evented: true,
		})
		if (this.stop) {
			this.stop.set({
				left: this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN,
				top: this.scene.Map.coordinates[this.pos].y + BOARD_MARGIN,
				visible: true,
				evented: true,
			})
		}
		this.bringToFront()
		this.scene.playersToFront()
		this.scene.canvas.renderAll()
	}
	bringToFront() {
		if (this.stop) {
			this.scene.canvas.bringToFront(this.stop)
		}
		this.scene.canvas.bringToFront(this.tile)
		this.scene.canvas.bringToFront(this.icon)
	}
	remove() {
		if (this.stop) {
			this.stop.set({ visible: false, evented: false })
			this.scene.canvas.remove(this.stop)
		}
		this.tile.set({ visible: false, evented: false })
		this.icon.set({ visible: false, evented: false })
		this.scene.canvas.remove(this.tile)
		this.scene.canvas.remove(this.icon)

		this.scene.canvas.renderAll()
	}
}

export class RangeProjectile {
	/**
	 * @param {*} scope int[] 범위
	 * @param {*} scopeTiles 타일 오브젝트들
	 * @param {*} id UPID
	 */
	constructor(scene, scope, scopeTiles, id, owner) {
		this.scene = scene
		this.scope = scope
		this.scopeTiles = scopeTiles
		this.UPID = id
		this.owner = owner
	}

	show() {
		this.scene.game.playSound("place")

		for (let i = 0; i < this.scope.length; ++i) {
			if (this.scene.Map.coordinates.length <= this.scope[i]) continue
			this.scopeTiles[i].set({
				left: this.scene.Map.coordinates[this.scope[i]].x + BOARD_MARGIN + PROJ_DIFF_X[this.owner],
				top: this.scene.Map.coordinates[this.scope[i]].y + BOARD_MARGIN + PROJ_DIFF_Y[this.owner],
				visible: true,
				evented: true,
			})
		}

		this.bringToFront()
		this.scene.playersToFront()
		this.scene.render()
	}

	bringToFront() {
		for (let i of this.scopeTiles) {
			this.scene.canvas.bringToFront(i)
		}
		// if (this.icon) this.scene.canvas.bringToFront(this.icon)
	}

	remove() {
		for (let i of this.scopeTiles) {
			i.set({ visible: false, evented: false })
			this.scene.canvas.remove(i)
		}

		this.scene.render()
	}
}
export class RangeWarnProjectile extends RangeProjectile {
	/**
	 * @param {*} scope int[] 범위
	 * @param {*} scopeTiles 타일 오브젝트들
	 * @param {*} id UPID
	 */
	constructor(scene, scope, scopeTiles, id, owner, isEnemy) {
		super(scene, scope, scopeTiles, id, owner)
		this.isEnemy = isEnemy
	}
	show() {
		this.scene.showWarnDrop(this.scope, this.owner, this.isEnemy)
		setTimeout(() => super.show(), 200)
		// super.show()
	}
}

export class RangeTrapProjectile extends RangeProjectile {
	/**
	 * @param {*} scope int[] 범위
	 * @param {*} scopeTiles 타일 오브젝트들
	 * @param {*} id UPID
	 */
	constructor(scene, scope, scopeTiles, id, owner, icon) {
		super(scene, scope, scopeTiles, id, owner)
		this.icon = icon
	}
	show() {
		if (this.icon)
			this.icon.set({
				left: this.scene.Map.coordinates[this.scope[0]].x + BOARD_MARGIN + PROJ_DIFF_X[this.owner],
				top: this.scene.Map.coordinates[this.scope[0]].y + 25 + BOARD_MARGIN + PROJ_DIFF_Y[this.owner],
				visible: true,
				evented: true,
			})
		super.show()
	}
	bringToFront() {
		super.bringToFront()
		if (this.icon) this.scene.canvas.bringToFront(this.icon)
	}
	remove() {
		if (this.icon) {
			this.icon.set({ visible: false, evented: false })
			this.scene.canvas.remove(this.icon)
		}
		super.remove()
	}
}
