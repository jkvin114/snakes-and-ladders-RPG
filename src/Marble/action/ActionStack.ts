import { Action, ACTION_LIST, ACTION_TYPE } from "./Action"

export class ActionStack {
	stack: Action[]

	constructor() {
		this.stack = []
	}
	pop(): Action | undefined {
		console.log("pop")
		let a=this.stack.pop()
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
	push(action: Action | undefined) {
		if (!action) return
		console.log("push")
		
		this.stack.push(action)
		this.iterate()
	}
	pushAll(action: Action[]) {
		for (let i = action.length-1; i >=0; --i) {
			this.push(action[i])
		}
	}
	iterate() {
		console.log("---------------")
		for (let i = this.stack.length - 1; i >= 0; --i) {
			console.log(ACTION_LIST[this.stack[i].type] + " turn:"+ this.stack[i].turn)
			//console.log(this.stack[i])
			// console.log(this.stack[i].id + ", source:" + this.stack[i].source.eventType)
		}
		console.log("---------------")
	}
	isEmpty() {
		return this.stack.length === 0
	}
	removeByType(type:ACTION_TYPE) {
		this.stack=this.stack.filter((action:Action)=>{
			return action.type !==type
		})
	}
	removeByTurn(turn:number) {
		this.stack=this.stack.filter((action:Action)=>{
			return action.turn !==turn
		})
	}
	peek(): Action {
		return this.stack[this.stack.length - 1]
	}
	clear() {
		this.stack = []
	}
	hasType(type: ACTION_TYPE) {
		return this.stack.some((a: Action) => a.type === type)
	}
}