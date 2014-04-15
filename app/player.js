/**************************************************
 ** GAME PLAYER CLASS
 **************************************************/
function Player(id, name) {
  this.id = id;
  this.nickname = name;
  this.gold = 0;
  this.ownedDistricts = [];
  this.districtHand = [];
  this.ownedDistricts = [];
  this.districtPoints = 0;
  this.fiveColorPoints = 0;
  this.enderPoints = 0;
  this.eightDistrictPoints = 0;
  this.totalPoints = 0;
}
Player.prototype.id = "";
Player.prototype.nickname = "";

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