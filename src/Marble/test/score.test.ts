import { mockGame } from "./mockers"

describe("scoretest", () => {
    const game=mockGame()
    game.totalBet=10000*10000
    game.mediator.pOfTurn(0).totalBet=5000*10000
    game.mediator.pOfTurn(1).totalBet=5000*10000
    let scores=game.getPlayerWinScores(0,2)
    console.log(scores)
})