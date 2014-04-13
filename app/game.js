var DistrictDeck = require("./deck").DistrictDeck,
  CharacterDeck = require("./deck").CharacterDeck;

function Game(order) {
  this.districtDeck = new DistrictDeck();
  this.characterDeck = new CharacterDeck();

  this.order = order;
  this.king = order[0].nickname;
}
Game.prototype.players = [];
Game.prototype.setKing = function (king) {
  this.king = king;
};
Game.prototype.nextPlayerNickname = function (id) {
  for (var i = 0, ii = this.order.length; i < ii; i++) {
    if (this.order[i].id == id) {
      var next = (i+1)%ii;
      return this.order[next].nickname;
    }
  }
};
Game.prototype.characterSelection = {};
Game.prototype.selectCharacter = function (id, char) {
  for (var i = 0, ii = this.order.length; i < ii; i++) {
    if (this.order[i].id == id) {
      this.characterSelection[char.rank] = this.order[i].nickname;
    }
  }
};
Game.prototype.playerByCharacterRank = function (rank) {

};
exports.Game = Game;
