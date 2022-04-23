import { Room } from "../room";

class MarbleRoom extends Room{
    getMapId(): number {
        throw new Error("Method not implemented.");
    }
    user_message(turn: number, msg: string): string {
        throw new Error("Method not implemented.");
    }
    gameloop:MarbleGameLoop

    constructor(name:string){
        super(name)
        this.gameloop
    }
    
}
export {MarbleRoom}