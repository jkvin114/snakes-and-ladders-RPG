export interface GameEventEmitter {
	(roomname: string, type: string, ...args: unknown[]): void
}