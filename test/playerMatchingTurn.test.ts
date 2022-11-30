import { PlayerMatchingState } from "./../src/PlayerMatchingState";
import { PlayerType, ProtoPlayer } from "./../src/core/Util"


describe("matchingturn", () => {
    let state=new PlayerMatchingState()
    test("empty-24", () => {
        state.setPlayerList([
            {
                type: PlayerType.PLAYER_CONNECED,
                name: "trump",
                team: true,
                champ: 1,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 2,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "bush",
                team: true,
                champ: 3,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 4,
                ready: false,
                userClass:0
            }
        ])
        let newturns=state.assignGameTurns(false)
        console.log(state.turnMapping)
		expect(newturns[0].type).toBe(PlayerType.PLAYER_CONNECED)
        expect(newturns[1].type).toBe(PlayerType.AI)
        expect(newturns[2].type).toBe(PlayerType.EMPTY)
        expect(newturns[3].type).toBe(PlayerType.EMPTY)

        expect(state.playerlist[0].name).toBe("trump")
        expect(state.playerlist[1].name).toBe("bush")
	})
    state=new PlayerMatchingState()
    test("empty-23", () => {
        state.setPlayerList([
            {
                type: PlayerType.PLAYER_CONNECED,
                name: "lee",
                team: true,
                champ: 1,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 2,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 4,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "park",
                team: true,
                champ: 3,
                ready: false,
                userClass:0
            }
        ])
        let newturns=state.assignGameTurns(false)
		expect(newturns[0].type).toBe(PlayerType.PLAYER_CONNECED)
        expect(newturns[1].type).toBe(PlayerType.AI)
        expect(newturns[2].type).toBe(PlayerType.EMPTY)
        expect(newturns[3].type).toBe(PlayerType.EMPTY)
        expect(state.turnMapping[0]).toBe(0)
        expect(state.turnMapping[3]).toBe(1)

        expect(state.playerlist[0].name).toBe("lee")
        expect(state.playerlist[1].name).toBe("park")
	})
    test("empty-2", () => {
        state.setPlayerList([
            {
                type: PlayerType.PLAYER_CONNECED,
                name: "miyeon",
                team: true,
                champ: 1,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 2,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "shuhua",
                team: true,
                champ: 4,
                ready: false,
                userClass:0
            },{
                type: PlayerType.PLAYER_CONNECED,
                name: "yuqi",
                team: true,
                champ: 3,
                ready: false,
                userClass:0
            }
        ])
        let newturns=state.assignGameTurns(false)
		expect(newturns[0].type).toBe(PlayerType.PLAYER_CONNECED)
        expect(newturns[1].type).toBe(PlayerType.AI)
        expect(newturns[2].type).toBe(PlayerType.PLAYER_CONNECED)
        expect(newturns[3].type).toBe(PlayerType.EMPTY)
        expect(state.turnMapping[0]).toBe(0)
        expect(state.turnMapping[2]).toBe(1)
        expect(state.turnMapping[3]).toBe(2)

        expect(state.playerlist[0].name).toBe("miyeon")
        expect(state.playerlist[1].name).toBe("shuhua")
        expect(state.playerlist[2].name).toBe("yuqi")
	})

    test("empty-24-shuffle", () => {
        state.setPlayerList([
            {
                type: PlayerType.PLAYER_CONNECED,
                name: "soyeon",
                team: true,
                champ: 1,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 2,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "minnie",
                team: true,
                champ: 4,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 3,
                ready: false,
                userClass:0
            }
        ])
        let newturns=state.assignGameTurns(true)
        expect(state.turnMapping[0]).toBeLessThan(2)
        expect(state.turnMapping[2]).toBeLessThan(2)
        expect(state.turnMapping[1]).toBeGreaterThanOrEqual(2)
        expect(state.turnMapping[3]).toBeGreaterThanOrEqual(2)
        expect(state.playerlist[state.turnMapping[2]].name).toBe("minnie")
        expect(state.playerlist[state.turnMapping[0]].name).toBe("soyeon")

	})
    test("empty-3-shuffle", () => {
        state.setPlayerList([
            {
                type: PlayerType.PLAYER_CONNECED,
                name: "a",
                team: true,
                champ: 1,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "b",
                team: true,
                champ: 2,
                ready: false,
                userClass:0
            },{
                type: PlayerType.EMPTY,
                name: "",
                team: true,
                champ: 4,
                ready: false,
                userClass:0
            },{
                type: PlayerType.PLAYER_CONNECED,
                name: "c",
                team: true,
                champ: 3,
                ready: false,
                userClass:0
            }
        ])
        let newturns=state.assignGameTurns(true)
        console.log(state.turnMapping)
        expect(state.turnMapping[0]).toBeLessThan(3)
        expect(state.turnMapping[1]).toBeLessThan(3)
        expect(state.turnMapping[3]).toBeLessThan(3)
        expect(state.turnMapping[2]).toBeGreaterThanOrEqual(3)

        
        expect(state.playerlist[state.turnMapping[0]].name).toBe("a")
        expect(state.playerlist[state.turnMapping[1]].name).toBe("b")
        expect(state.playerlist[state.turnMapping[3]].name).toBe("c")

	})
    
    test("full-shuffle", () => {
        state.setPlayerList([
            {
                type: PlayerType.PLAYER_CONNECED,
                name: "a",
                team: true,
                champ: 1,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "b",
                team: true,
                champ: 2,
                ready: false,
                userClass:0
            },{
                type: PlayerType.AI,
                name: "c",
                team: true,
                champ: 4,
                ready: false,
                userClass:0
            },{
                type: PlayerType.PLAYER_CONNECED,
                name: "d",
                team: true,
                champ: 3,
                ready: false,
                userClass:0
            }
        ])
        let newturns=state.assignGameTurns(true)


        expect(state.playerlist[state.turnMapping[0]].name).toBe("a")
        expect(state.playerlist[state.turnMapping[1]].name).toBe("b")
        expect(state.playerlist[state.turnMapping[2]].name).toBe("c")
        expect(state.playerlist[state.turnMapping[3]].name).toBe("d")

	})
})