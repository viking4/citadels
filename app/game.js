var DistrictDeck = require("./deck").DistrictDeck,
  CharacterDeck = require("./deck").CharacterDeck;

function Game(order) {
  this.districtDeck = new DistrictDeck();
  this.characterDeck = new CharacterDeck();
  this.players = [];
  this.characterSelection = {};
  this.ender = "";
  this.order = order;
  this.king = order[0].nickname;
}

Game.prototype.setKing = function (king) {
  this.king = king;
};
Game.prototype.playerAfter = function (id) {
  for (var i = 0, ii = this.order.length; i < ii; i++) {
    if (this.order[i].id == id) {
      var next = (i+1)%ii;
      return this.order[next].nickname;
    }
  }
};
Game.prototype.selectCharacter = function (id, char) {
  for (var i = 0, ii = this.order.length; i < ii; i++) {
    if (this.order[i].id == id) {
      this.characterSelection[char.rank] = this.order[i].nickname;
    }
  }
};
Game.prototype.getNextPlayer = function () {
  var rank = 1, nickname = this.characterSelection[rank];
  while (!nickname && rank <= 8) {
    nickname = this.characterSelection[++rank];
  }
  var char = this.characterDeck.characterByRank(rank);
  delete this.characterSelection[rank];
  return {
    nickname: nickname,
    character: char
  };
};
Game.prototype.isEnded = function () {
  return (this.ender != "");
};

exports.Game = Game;
