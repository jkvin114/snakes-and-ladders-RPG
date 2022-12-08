import type { Player } from "./player"

export interface PlayerComponent{
    onTurnStart:()=>void
    onTurnEnd:()=>void
}