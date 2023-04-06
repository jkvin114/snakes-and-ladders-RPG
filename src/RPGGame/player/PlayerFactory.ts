
import { Creed } from "../characters/Creed"
import { Silver } from "../characters/Silver"
import { Timo } from "../characters/Timo"
import { Yangyi } from "../characters/Yangyi"
import { Jean } from "../characters/Jean"
import { Jellice } from "../characters/Jellice"
import { Gorae } from "../characters/Gorae"
import { Bird } from "../characters/Bird"
import { Tree } from "../characters/Tree"
import type { Game } from "../Game"
import { Player } from "./player"
import { Hacker } from "../characters/Hacker"
import TreeAgent from "../AiAgents/TreeAgent"
import YangyiAgent from "../AiAgents/YangyiAgent"
import CreedAgent from "../AiAgents/CreedAgent"
import BirdAgent from "../AiAgents/BirdAgent"
import GoraeAgent from "../AiAgents/GoraeAgent"
import HackerAgent from "../AiAgents/HackerAgent"
import JeanAgent from "../AiAgents/JeanAgent"
import JelliceAgent from "../AiAgents/JelliceAgent"
import SilverAgent from "../AiAgents/SilverAgent"
import TimoAgent from "../AiAgents/TimoAgent"
import { EntityMediator } from "../entity/EntityMediator"

export class PlayerFactory {
	static create(character_id: number, name: string, turn: number, team: number, game: Game, isAI: boolean,mediator:EntityMediator) :Player{
		let char
		let ai
		const player=new Player(turn, team, game, isAI, name,character_id)
		player.setMediator(mediator)
		switch (character_id) {

			case 0:
				char= new Creed(player)
				ai=new CreedAgent(player,char)
				break
			case 1:
				char= new Silver(player)
				ai=new SilverAgent(player,char)
				break
			case 2:
				char= new Timo(player)
				ai=new TimoAgent(player,char)
				break
			case 3:
				char= new Yangyi(player)
				ai=new YangyiAgent(player,char)
				break
			case 4:
				char= new Jean(player)
				ai=new JeanAgent(player,char)
				break
			case 5:
				char= new Jellice(player)
				ai=new JelliceAgent(player,char)
				break
			case 6:
				char= new Gorae(player)
				ai=new GoraeAgent(player,char)
				break
			case 7:
				char= new Bird(player)
				ai=new BirdAgent(player,char)
				break
			case 8:
				char= new Tree(player)
				ai=new TreeAgent(player,char)
				break
			case 9:
				char= new Hacker(player)
				ai=new HackerAgent(player,char)
				break
			default:
				char= new Creed(player)
				ai=new CreedAgent(player,char)
				break
		}
		player.bindCharacter(character_id,char,ai)
		player.AiAgent.onCreate()
		return player
	}
}
