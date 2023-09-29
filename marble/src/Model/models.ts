
export enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai"
}
export type ProtoPlayer={
    type: string;
    name: string;
    team: boolean;
    champ: number;
    ready: boolean;userClass:number;
    data?:any
}
export const userEvents={
	PRESS_DICE:`press_dice`,
	SELECT_BUILD:`select_build`,
	SELECT_BUYOUT:`select_buyout`,
	SELECT_LOAN:`select_loan`,
	SELECT_TILE:`select_tile`,
	OBTAIN_CARD:`obtain_card`,
	CONFIRM_CARD_USE:`confirm_card_use`,
	SELECT_GODHAND_SPECIAL:`select_godhand_special`,
	SELECT_ISLAND:`select_island`,
	RUN_SIMULATION:"start_sim"
}