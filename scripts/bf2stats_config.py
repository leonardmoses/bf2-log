"""Settings for scripts/bf2stats_to_sql.py. Edit here when the game setup changes."""

# Dates shown on the site use this timezone (the stats database stores UTC).
TIMEZONE = "America/New_York"

# The site models 3-8 human players. Rounds outside this range are not imported.
PLAYER_RANGE = (3, 8)

# A stats round is paired with a session you logged by hand in admin when the map,
# player count and result match and the dates are within this many days.
PAIR_DAYS = 2

# Stats-database map name -> sort_order of the map in bf2_maps (see supabase/schema.sql).
# When a new map shows up in a dump the script lists it as "unmapped" and skips its rounds:
# add the map in admin if it is new, then add a line here.
MAP_ORDER = {
    "aix_archipelago": 1,
    "aix_damocles": 2,
    "aix_greasy_mullet": 3,
    "aix_hammer_down": 4,
    "aix_operation_static": 5,
    "aix_sf_surge": 7,
    "aix_trident": 8,
    "aix_wake_island_2007": 9,
    "city_district": 10,
    "dalian_plant": 11,
    "daqing_dawn": 12,  # legacy name for Daqing Oilfields
    "devils_perch": 13,
    "dragon_valley": 14,
    "dragon_valley_moon": 15,
    "falklands": 16,
    "greatwall": 18,
    "gulf_of_oman": 19,
    "karkand_stormfront": 21,
    "mass_destruction": 23,
    "night_flight": 25,  # played as "Day Flight" (same map, daytime effects)
    "processing_plant": 26,
    "road_to_jalalabad": 27,
    "sf_midnight_sun": 28,
    "sf_op_harvest": 29,
    "sf_road_rage": 30,
    "sf_smoke_screen": 31,
    "sharqi_peninsula": 33,
    "the_push_day": 34,
    "tng_airport": 35,
    "tng_clean_sweep_ii": 36,
    "tng_course_of_the_river": 37,
    "tng_fushe_pass": 38,
    "tng_kubra_dam": 42,
    "tng_sands_of_sinai": 46,
    "tng_street": 47,
    "tng_the_push_day": 49,
    "tng_town_strike": 50,
    "urban_decay": 56,
    "urban_jungle": 57,
    "wake_twilight": 58,
    "warlord": 59,
    "zatar_wetlands_ii": 60,
}

# Map size (16/32/64) is not recorded in the stats database, so it is inferred:
#   3-4 human players -> the smallest size the map has
#   5-8 human players -> 64
# with these exceptions (sort_order values):
URBAN_ORDERS = {56, 57}    # Urban Decay / Urban Jungle: always played at 32
CITY_DISTRICT_ORDER = 10   # City District only goes up to 32
SMALL_GAME_MAX_PLAYERS = 4
