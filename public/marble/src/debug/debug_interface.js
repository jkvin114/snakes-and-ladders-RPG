class DebugWindow {
	constructor() {
		this.isvisible = false
		this.stackNo = 0
		this.maxstacks = 60
	}
}

const STATE = new DebugWindow()
export function debugActionStack(stack) {
	// console.table()
	stack = stack.reverse()
	let str = `<div class="stack-item" id=action_${STATE.stackNo}>`
	STATE.stackNo++

	for (const action of stack) {
		let priority = `<b>M</b>`
		if (action.priority === 2) priority = `<b class="before">B</b>`

		if (action.priority === 3) priority = `<b class="after">A</b>`

		let cat = action.category
		if (!action.valid) cat = "disabled"
		str += `
        <div class="action ${cat}">
            <div>
                <b>${action.turn + 1}</b>
                ${priority}
            </div>
            <div>
                ${action.type}
            </div>
        </div>`
	}
	str += "</div>"
	$("#debug-stack").append(str)
	if (STATE.stackNo > STATE.maxstacks) {
		$("#action_" + (STATE.stackNo - STATE.maxstacks)).remove()
	}
}
export function initDebug() {
	document.addEventListener(
		"keydown",
		((event) => {
			event.preventDefault()
			const keyName = event.key
			if (keyName === "F3") {
				console.log("key")
				if (STATE.isvisible) {
					STATE.isvisible = false
					$("#debug-window").hide()
				} else {
					STATE.isvisible = true
					$("#debug-window").show()
				}
			}
		}).bind(this)
	)
}
