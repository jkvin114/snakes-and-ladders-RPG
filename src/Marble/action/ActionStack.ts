import { Action,  ACTION_LIST, ACTION_TYPE } from "./Action"
import { InstantAction } from "./InstantAction"

export class ActionStack {
	stack: Action[]
	priorityStack: InstantAction[] //우선순의 스택
	constructor() {
		this.stack = []
		this.priorityStack = []
	}
	pop(): Action | undefined {
		 console.log("pop")

		if (this.priorityStack.length > 0) {
			return this.priorityStack.pop()
		}

		let a = this.stack.pop()
		this.iterate()
		return a
	}
	/**
	 * force resolve action and remove from stack
	 * @returns more action left
	 */
	skipOne(): boolean {
		this.stack.pop()
		return this.stack.length !== 0
	}
	private push(action: Action | undefined) {
		if (!action) return
		 console.log("push")
		if (action.priority === 1 && action instanceof InstantAction) this.priorityStack.push(action)
		else this.stack.push(action)
	}
	pushAll(...action: Action[]) {
		for (let i = action.length - 1; i >= 0; --i) {

			if(!action[i].duplicateAllowed && this.hasValidTypeAndTurn(action[i].type,action[i].turn)) continue

			let skip=false
			for(const incompatiable of action[i].incompatiableWith){
				if(this.hasValidTypeAndTurn(incompatiable,action[i].turn)) skip=true
			}
			for(const tocancel of action[i].cancels){
				// console.log("cancel"+ACTION_LIST[tocancel] )
				this.removeByTurnAndType(action[i].turn,tocancel)
			}
			if(!skip)
				this.push(action[i])
		}
	}
	iterate() {
		console.log("---------------")
		for (let i = this.priorityStack.length - 1; i >= 0; --i) {
			if(!this.priorityStack[i].valid) continue
			console.log(ACTION_LIST[this.priorityStack[i].type] + " turn:" + this.priorityStack[i].turn)
		}
		for (let i = this.stack.length - 1; i >= 0; --i) {
			if(!this.stack[i].valid) continue

			console.log(ACTION_LIST[this.stack[i].type] + " turn:" + this.stack[i].turn)
		}
		console.log("---------------")
	}
	isEmpty() {
		return this.stack.length === 0 && this.priorityStack.length === 0
	}
	removeByType(type: ACTION_TYPE) {
		this.stack.forEach((action) => {
			if (action.type === type) action.off()
		})

		this.priorityStack.forEach((action) => {
			if (action.type === type) action.off()
		})
	}
	removeByTurn(turn: Number) {
		this.stack.forEach((action) => {
			if (action.turn === turn) action.off()
		})
		this.priorityStack.forEach((action) => {
			if (action.turn === turn) action.off()
		})
	}
	removeByTurnAndType(turn: number, type: ACTION_TYPE) {
		this.stack.forEach((action) => {
			if (action.turn === turn && action.type === type) action.off()
		})
		this.priorityStack.forEach((action) => {
			if (action.turn === turn && action.type === type) action.off()
		})
	}
	removeByTurnExcludeType(turn: number, excludeType: ACTION_TYPE[]) {
		this.stack.forEach((action) => {
			if (excludeType.includes(action.type)) return
			if (action.turn === turn) action.off()
		})

		this.priorityStack.forEach((action) => {
			if (excludeType.includes(action.type)) return
			if (action.turn === turn) action.off()
		})
	}
	peek(): Action {
		if(this.priorityStack.length>0)
			return this.priorityStack[this.priorityStack.length-1]

		return this.stack[this.stack.length - 1]
	}
	popAllPriorityActions():InstantAction[]{
		let list=Array.from(this.priorityStack)
		this.priorityStack=[]
		return list
	}
	clear() {
		this.stack = []
		this.priorityStack = []
	}
	/**
	 * 해당 타입과 턴의 유효한 액션이 존재하는지
	 * @param type 
	 * @param turn 
	 * @returns 
	 */
	hasValidTypeAndTurn(type: ACTION_TYPE,turn:number) {
		return this.stack.some((a: Action) => a.type === type && a.valid && a.turn===turn)
	}
	findById(id: string): Action | null {
		for (const a of this.priorityStack) {
			if (a.getId() === id) return a
		}

		for (const a of this.stack) {
			if (a.getId() === id) return a
		}
		return null
	}
}
