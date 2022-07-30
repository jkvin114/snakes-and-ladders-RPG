import { Action, ActionModifyFunction, ACTION_LIST, ACTION_TYPE } from "./Action"

export class ActionStack {
	stack: Action[]
	priorityStack:Action[] //우선순의 스택
	constructor() {
		this.stack = []
		this.priorityStack=[]
	}
	pop(): Action | undefined {
		console.log("pop")

		if(this.priorityStack.length>0) {
			return this.priorityStack.pop()
		}

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
		if(action.priority===1) this.priorityStack.push(action)
		else this.stack.push(action)
		this.iterate()
	}
	pushAll(action: Action[]) {
		for (let i = action.length-1; i >=0; --i) {
			this.push(action[i])
		}
		// for (let i = 0; i < action.length; ++i) {
		// 	this.push(action[i])
		// }
	}
	iterate() {
		console.log("---------------")
		for (let i = this.priorityStack.length - 1; i >= 0; --i) {
			console.log(ACTION_LIST[this.priorityStack[i].type] + " turn:"+ this.priorityStack[i].turn)
			//console.log(this.stack[i])
			// console.log(this.stack[i].id + ", source:" + this.stack[i].source.eventType)
		}
		for (let i = this.stack.length - 1; i >= 0; --i) {
			console.log(ACTION_LIST[this.stack[i].type] + " turn:"+ this.stack[i].turn)
			//console.log(this.stack[i])
			// console.log(this.stack[i].id + ", source:" + this.stack[i].source.eventType)
		}
		console.log("---------------")
	}
	isEmpty() {
		return this.stack.length === 0 && this.priorityStack.length === 0
	}
	removeByType(type:ACTION_TYPE) {
		this.stack.forEach((action)=>{
			if(action.type ===type) action.off()
		})

		this.priorityStack.forEach((action)=>{
			if(action.type ===type) action.off()
		})
	}
	removeByTurn(turn:Number) {
		this.stack.forEach((action)=>{
			if(action.turn === turn) action.off()
		})
		this.priorityStack.forEach((action)=>{
			if(action.turn === turn) action.off()
		})
	}
	removeByTurnExcludeType(turn:number,excludeType:ACTION_TYPE[]) {
		this.stack.forEach((action)=>{
			if(excludeType.includes(action.type)) return
			if(action.turn === turn) action.off()
		})

		this.priorityStack.forEach((action)=>{
			if(excludeType.includes(action.type)) return
			if(action.turn === turn) action.off()
		})
	}
	peek(): Action {
		return this.stack[this.stack.length - 1]
	}
	clear() {
		this.stack = []
		this.priorityStack=[]
	}
	hasType(type: ACTION_TYPE) {
		return this.stack.some((a: Action) => a.type === type)
	}
	findById(id:string):Action|null{
		for(const a of this.priorityStack) {if(a.getId()===id) return a} 

		for(const a of this.stack) {if(a.getId()===id) return a} 
		return null
	}
}