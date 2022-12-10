
import { Creed } from "./../characters/Creed"
import { Silver } from "./../characters/Silver"
import { Timo } from "./../characters/Timo"
import { Yangyi } from "./../characters/Yangyi"
import { Jean } from "./../characters/Jean"
import { Jellice } from "./../characters/Jellice"
import { Gorae } from "./../characters/Gorae"
import { Bird } from "./../characters/Bird"
import { Tree } from "./../characters/Tree"
import type { Game } from "../Game"
import type { Player } from "./player"
import { Hacker } from "../characters/Hacker"
export class PlayerFactory {
	static create(character_id: number, name: string, turn: number, team: number, game: Game, isAI: boolean) :Player{
		let char
		switch (character_id) {
			case 0:
				char= new Creed(turn, team, game, isAI, name)
				break
			case 1:
				char= new Silver(turn, team, game, isAI, name)
				break
			case 2:
				char= new Timo(turn, team, game, isAI, name)
				break
			case 3:
				char= new Yangyi(turn, team, game, isAI, name)
				break
			case 4:
				char= new Jean(turn, team, game, isAI, name)
				break
			case 5:
				char= new Jellice(turn, team, game, isAI, name)
				break
			case 6:
				char= new Gorae(turn, team, game, isAI, name)
				break
			case 7:
				char= new Bird(turn, team, game, isAI, name)
				break
			case 8:
				char= new Tree(turn, team, game, isAI, name)
				break
			case 9:
				char= new Hacker(turn, team, game, isAI, name)
				break
			default:
				char=new Creed(turn, team, game, isAI, name)
				break
		}
		char.AiAgent.onAfterCreate()
		return char
	}
}
