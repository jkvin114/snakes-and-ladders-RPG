import { EntityFilter } from "./../src/EntityFilter";
import { Game, GameSetting } from "./../src/Game";

describe('game', () => {
    let game=new Game(0,"",new GameSetting({
      itemLimit: 6,
      extraResistanceAmount: 1,
      additionalDiceAmount: 1,
      useAdditionalLife: false,
      AAOnForceMove: false,
      AAcounterAttackStrength: 1,
      autoNextTurnOnSilent: false,
      diceControlItemFrequency: 1,
      shuffleObstacle: true,
  
      killRecord: false,
      itemRecord: false,
      positionRecord: false,
      moneyRecord: false,
      summaryOnly: true,
    },false,false))
  
    game.addPlayer(true,0,"hi")
    game.addPlayer(true,2,"hi2")
    game.addPlayer(true,1,"hi3")
  
    test("getallplayer",()=>{
        expect(game.entityMediator.storage.getPlayer(0).turn).toBe(0)
        expect(game.entityMediator.storage.getPlayer(1).turn).toBe(1)
        expect(game.entityMediator.storage.getPlayer(2).turn).toBe(2)
  
        expect(game.entityMediator.allPlayer().length).toBe(3)
        expect(game.pOfTurn(0).pos).toBe(0)
        expect(game.pOfTurn(1).name).toBe("hi2")
       
    })
  
    test("filter",()=>{
      game.pOfTurn(0).pos=10
      game.pOfTurn(1).pos=11
      let p1=game.pOfTurn(1)
      let p2=game.pOfTurn(2)
      p1.invulnerable=false
      p2.invulnerable=false
  
      expect(game.entityMediator.selectAllFrom(EntityFilter.ALL(game.pOfTurn(0)).inRadius(2).notMe())[0]).toBe(game.pOfTurn(1))
      expect(game.entityMediator.selectAllFrom(EntityFilter.ALL_ENEMY_PLAYER(game.pOfTurn(0)).inRadius(2))[0]).toBe(game.pOfTurn(1))
      expect(game.entityMediator.selectAllFrom(EntityFilter.VALID_ATTACK_TARGET(game.pOfTurn(0)))
      .length).toBe(2)
     
  
      expect(p1.isEnemyOf(p2)).toBe(true)
      expect(p1.isTargetableFrom(p2)).toBe(true)
      expect(p1.isEnemyOf(p1)).toBe(false)
      p1.pos=1
      p2.pos=1
      expect(game.entityMediator.selectAllFrom(EntityFilter.ALL(p1).inRadius(0).notMe()).length).toBe(1)
  
  
    })
  })
  