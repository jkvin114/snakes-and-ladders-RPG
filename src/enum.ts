enum CHANGE_MONEY_TYPE{ EARN, SPEND, TAKEN, EVERY_TURN}
enum EFFECT_TIMING{TURN_START,TURN_END,BEFORE_SKILL}
enum EFFECT{
	SLOW= 0,
	SPEED= 1,
	STUN= 2,
	SILENT= 3,
	SHIELD= 4,
	POISON= 5,
	RADI= 6,
	ANNUITY= 7,
	SLAVE= 8,
	BACKDICE= 9,
	DOUBLEDICE= 10,
	BLIND= 11,
	IGNITE= 12,
	INVISIBILITY= 13,
	PRIVATE_LOAN= 14,
	ANNUITY_LOTTERY= 15,
	CURSE= 16,
	FARSIGHT=17,


	REAPER_Q_SHIELD=31,
	REAPER_ULT_SHIELD=32,

	GHOST_ULT_DAMAGE=33,
	GHOST_ULT_WEAKEN=34,

	ELEPHANT_W_SIGN=35,
	ELEPHANT_ULT_SHIELD=36,
	ELEPHANT_ULT_RESISTANCE=37,
	ELEPHANT_PASSIVE_RESISTANCE=38,

	SNIPER_ULT_SHIELD=39,

	MAGICIAN_W_SHIELD=40,
	MAGICIAN_W_BURN=41,

	KRAKEN_W_SHIELD=42,

	BIRD_ULT_SHIELD=43,
	BIRD_ULT_ABILITY=44,
	BIRD_ULT_BURN=45,

	DINOSAUR_W=46,

	TREE_WITHER=47,
	TREE_ULT=48,
	TREE_Q_SHIELD=49,

	MAGIC_CASTLE_ADAMAGE=69,

	ITEM_SHIELDSWORD=70,
	ITEM_FRUIT=71,
	ITEM_POWER_OF_NATURE=72,
	ITEM_POWER_OF_MOTHER_NATURE=73,
	ITEM_POWER_OF_MOTHER_NATURE_ABILITY=74,
	ITEM_CARD_OF_DECEPTION=75,
	ITEM_ANCIENT_SPEAR_ADAMAGE=76,
	ITEM_SPEAR_ADAMAGE=77,
	ITEM_CROSSBOW_ADAMAGE=78,
	ITEM_DIAMOND_ARMOR_MAXHP_GROWTH=79,
	ITEM_BOOTS_OF_ENDURANCE=80,
	ITEM_SHIELDSWORD_SHIELD=81,
	ITEM_SHIELDSWORD_ABSORB=82,
	ITEM_INVISIBILITY_CLOAK=83


}
enum STAT {
	DAMAGE_TAKEN_BY_CHAMP= 0,
	DAMAGE_TAKEN_BY_OBS= 1,
	DAMAGE_DEALT= 2,
	HEAL_AMT= 3,
	MONEY_EARNED= 4,
	MONEY_SPENT= 5,
	MONEY_TAKEN= 6,
	DAMAGE_REDUCED= 7,
	REVIVE= 8,
	FORCEMOVE= 9,
	BASICATTACK= 10,
	EXECUTED= 11,
}


enum SKILL {
	Q= 0,
	W= 1,
	ULT= 2,
}
enum INIT_SKILL_RESULT {
	NOT_LEARNED= 0,
	NO_COOL= 1,
	NON_TARGET= 2,
	NO_TARGET= 3,
	PROJECTILE= 4,
	NEED_TARGET= 5,
	AREA_TARGET= 6,

}
enum AI_SKILL_RESULT_TYPE {
	TARGET,
	LOCATION,
	NON_TARGET,
	AREA_TARGET
}

enum ARRIVE_SQUARE_RESULT_TYPE {
	NONE= 0,
	STORE= -5,
	STUN= -6,
	FINISH= -7,
}

enum SKILL_INIT_TYPE {
	NO_TARGET= -2,
	CANNOT_USE= -1,
	NON_TARGET= 0,
	PROJECTILE= 1,
	TARGETING= 2,
	AREA_TARGETING= 3,

}
enum MAP_TYPE{
	NORMAL=0,
	OCEAN=1,
	CASINO=2
}
enum ITEM{
	EPIC_SWORD=0,
	RARE_SWORD=1,
	COMMON_SWORD=2,
	EPIC_CRYSTAL_BALL=3,
	RARE_CRYSTAL_BALL=4,
	COMMON_CRYSTAL_BALL=5,
	EPIC_SHIELD=6,
	RARE_SHIELD=7,
	COMMON_SHIELD=8,
	EPIC_FRUIT=9,
	RARE_FRUIT=10,
	COMMON_FRUIT=11,
	EPIC_ARMOR=12,
	RARE_ARMOR=13,
	COMMON_ARMOR=14,
	GUARDIAN_ANGEL=15,
	BLOODSUCKER=16,
	SWORD_OF_BLOOD=17,
	POWER_OF_MOTHER_NATURE=18,
	POWER_OF_NATURE=19,
	CARD_OF_DECEPTION=20,
	DIAMOND_CRYSTAL=21,
	ANCIENT_SPEAR=22,
	EPIC_WHIP=23,
	RARE_WHIP=24,
	RARE_MAGIC_AXE=25,
	COMMON_MAGIC_AXE=26,
	SPEAR=27,
	BOOTS=28,
	BOOTS_OF_HASTE=29,
	MEDIEVAL_BOW=30,
	CROSSBOW_OF_PIERCING=31,
	FULL_DIAMOND_ARMOR=32,
	INVISIBILITY_CLOAK=33,
	DIAMOND_SHARD=34,
	WARRIORS_SHIELDSWORD=35,
	BOOTS_OF_PROTECTION=36,
	BOOTS_OF_ENDURANCE=37
}


export {
	CHANGE_MONEY_TYPE,
	EFFECT,
	STAT,
	SKILL,
	INIT_SKILL_RESULT,
	AI_SKILL_RESULT_TYPE,
	ARRIVE_SQUARE_RESULT_TYPE,
	SKILL_INIT_TYPE,
	EFFECT_TIMING,
	MAP_TYPE,
	ITEM
}

