var districtDeckArray = [];

function addDistrictCard(quantity, name, type, cost) {
  for (var i = 0; i < quantity; i++) {
    districtDeckArray.push({
      name: name,
      type: type,
      cost: cost
    })
  }
}

addDistrictCard(5, 'Tavern', 'Trade', 1);
addDistrictCard(4, 'Market', 'Trade', 2);
addDistrictCard(3, 'Trading Post', 'Trade', 2);
addDistrictCard(3, 'Docks', 'Trade', 3);
addDistrictCard(3, 'Harbor', 'Trade', 4);
addDistrictCard(2, 'Town Hall', 'Trade', 5);
addDistrictCard(3, 'Temple', 'Religious', 1);
addDistrictCard(3, 'Church', 'Religious', 2);
addDistrictCard(3, 'Monastery', 'Religious', 3);
addDistrictCard(2, 'Cathedral', 'Religious', 5);
addDistrictCard(3, 'Watchtower', 'Military', 1);
addDistrictCard(3, 'Prison', 'Military', 2);
addDistrictCard(3, 'Battlefield', 'Military', 3);
addDistrictCard(2, 'Fortress', 'Military', 5);
addDistrictCard(5, 'Manor', 'Noble', 3);
addDistrictCard(4, 'Castle', 'Noble', 4);
addDistrictCard(3, 'Palace', 'Noble', 5);

var characterDeckArray = [];

function addCharacterCard(name, rank) {
  characterDeckArray.push({
      name: name,
      rank: rank
    })
}

addCharacterCard('Assassin', 1);
addCharacterCard('Thief', 2);
addCharacterCard('Magician', 3);
addCharacterCard('King', 4);
addCharacterCard('Bishop', 5);
addCharacterCard('Merchant', 6);
addCharacterCard('Architect', 7);
addCharacterCard('Warlord', 8);

function Deck() {
  this.deck = [];
}
Deck.prototype.shuffle = function () {
  var deck = [];
  var len = this.deck.length;
  for (var i = len; i--;) {
    var index = Math.floor(Math.random()*i);
    var card = this.deck.splice(index, 1)[0];
    deck.push(card);
  }
  this.deck = deck;
};

function DistrictDeck() {
  Deck.call(this);
  this.deck = districtDeckArray;
}

DistrictDeck.prototype = Object.create(Deck.prototype);
DistrictDeck.prototype.constructor = DistrictDeck;

function CharacterDeck() {
  Deck.call(this);
  this.deck = characterDeckArray;
}
CharacterDeck.prototype = Object.create(Deck.prototype);
CharacterDeck.prototype.constructor = CharacterDeck;

exports.DistrictDeck = DistrictDeck;
exports.CharacterDeck = CharacterDeck;