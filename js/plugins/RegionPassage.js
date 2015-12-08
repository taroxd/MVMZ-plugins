//=============================================================================
// RegionPassage.js
//=============================================================================

/*:
 * @plugindesc Provide advanced options for tile passage.
 * @author taroxd
 *
 * @param Passable Regions
 * @desc Tiles are always passable in these regions. e.g. [3, 5]
 * @default []
 *
 * @param Impassable Regions
 * @desc Tiles are always not passable in these regions. e.g. [3, 5]
 * @default []
 *
 * @help This plugin does not provide plugin commands.
 */

void function() {

    var parameters = PluginManager.parameters('RegionPassage');
    var PASSABLE_REGIONS = JSON.parse(parameters['Passable Regions']);
    var IMPASSABLE_REGIONS = JSON.parse(parameters['Impassable Regions']);

    var REGIONS = {};
    PASSABLE_REGIONS.forEach(function(r) {
        REGIONS[r] = true;
    });
    IMPASSABLE_REGIONS.forEach(function(r) {
        REGIONS[r] = false;
    });

    // Advanced options:

    // REGIONS[r] = function(regionId)
    // When you are in region r,
    // you can only go to regions where function(regionId) returns true.

    // For example,
    // Region 3 can only be entered from region 4.
    // REGIONS[3] = function(r) { return r === 3 || r === 4; };

    // You cannot walk between region 5 and region 6.
    // REGIONS[5] = function(r) { return r !== 6 };

    var enable = Object.keys(REGIONS).length > 0;

    if (!enable) return;

    var ip = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d) {
        var settings = REGIONS[$gameMap.regionId(x, y)];
        switch(typeof settings) {
        case 'boolean':
            return settings;
        case 'function':
            var x2 = $gameMap.roundXWithDirection(x, d);
            var y2 = $gameMap.roundYWithDirection(y, d);
            if (!settings($gameMap.regionId(x2, y2))) {
                return false;
            }
            // no break intentionally
        default:
            return ip.call(this, x, y, d);
        }
    };
}();