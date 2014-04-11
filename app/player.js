/**************************************************
 ** GAME PLAYER CLASS
 **************************************************/
function Player(id, name) {
  this.id = id;
  this.nickname = name;
}
Player.prototype.id = "";
Player.prototype.nickname = "";
Player.prototype.gold = 0;
Player.prototype.ownedDistricts = [];
Player.prototype.districtHand = [];
Player.prototype.ownedDistricts = [];
Player.prototype.setGold = function (gold) {
  this.gold = gold;
};
Player.prototype.setDistrictHand = function (cards) {
  this.districtHand = cards;
};
Player.prototype.setOwnedDistricts = function (districts) {
  this.ownedDistricts = districts;
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;