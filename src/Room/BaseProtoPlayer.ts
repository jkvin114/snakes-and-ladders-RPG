
enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai"
}
export type BaseProtoPlayer={
    type: PlayerType;
    name: string;
    team: boolean;
    champ: number;
    ready: boolean;userClass:number;
    data?:any
}