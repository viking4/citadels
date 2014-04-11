var DistrictDeck = require("./deck").DistrictDeck,
  CharacterDeck = require("./deck").CharacterDeck;

function Game(order) {
  this.districtDeck = new DistrictDeck();
  this.characterDeck = new CharacterDeck();
  this.characterSelection = new Array();
  for (var i = 0, ii = this.characterDeck.length; i <= ii; i++) {
    this.characterSelection.push(null);
  }
  this.order = order;
}
Game.prototype.players = [];
Game.prototype.nextPlayerNickname = function (id) {
  for (var i = 0, ii = this.order.length; i < ii; i++) {
    if (this.order[i].id == id) {
      var next = (i+1)%ii;
      return this.order[next].nickname;
    }
  }
};
Game.prototype.resetCharacterSelection = function () {
  for (var i = 0, ii = this.characterSelection.length; i <= ii; i++) {
    this.characterSelection[i] = null;
  }
};
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
