
export enum AgentType {
	RANDOM = "random",
	RATIONAL_RANDOM = "rational_random",
	SMART_CUSTOM_1="smart_custom_1",
	NONE="none"
}

export enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai",
}
export enum GameType{
    INSTANT_SIMULATION="instant_simulation",
    SIMULATION="simulation",
    NORMAL="normal",
    SOLOPLAY="solo",
}
export enum GAME_EFFECT{
    WATER_PUMP_ACTIVATE="water_pump_activate",
    FORCEMOVE_SELECT="forcemove_select",
    FORCEMOVE_POS="forcemove_pos",
}