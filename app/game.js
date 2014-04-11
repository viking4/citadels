var DistrictDeck = require("./deck").DistrictDeck,
  CharacterDeck = require("./deck").CharacterDeck;

function Game(players) {
  this.districtDeck = new DistrictDeck();
  this.characterDeck = new CharacterDeck();

  this.players = [];
  if (players)
    this.players = players;
}

exports.Game = Game;
