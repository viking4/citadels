var districtDeckArray = [];

function addDistrictCard(quantity, name, type, cost, description) {
  for (var i = 0; i < quantity; i++) {
    if (description) {
      districtDeckArray.push({
        name: name,
        type: type,
        cost: cost,
        description: description
      })
    } else {
      districtDeckArray.push({
        name: name,
        type: type,
        cost: cost
      })
    }
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

addDistrictCard(1, 'Haunted City', 'Special', 2, 'For purposes of victory points, the Haunted City is considered to be of the color of your choice. You cannot use this ability if you built it during the last round of the game.');
addDistrictCard(1, 'University', 'Special', 6, 'This district costs six gld to build, but is worth eight points at the end of the game.');
addDistrictCard(1, 'Dragon Gate', 'Special', 6, 'This district costs six gld to build, but is worth eight points at the end of the game.');
addDistrictCard(1, 'School of Magic', 'Special', 6, 'For the purposes of income, the School Of Magic is considered to be the color of your choice. If you are the King this round, for example, the School is considered to be a noble (yellow) district.');
addDistrictCard(1, 'Observatory', 'Special', 5, 'If you choose to draw cards when you take an action, you draw three cards, keep one of your choice, and put the other two on the bottom of the deck.');
addDistrictCard(1, 'Library', 'Special', 6, 'If you choose to draw cards you you take an action, you keep both of the cards you have drawn.');

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
    var index = Math.floor(Math.random()*(i+1));
    var card = this.deck.splice(index, 1)[0];
    deck.push(card);
  }
  this.deck = deck;
};

Deck.prototype.draw = function (n) {
  var cards = [];
  cards.push(this.deck.pop());
  if (n) {
    for (var i = 1; i < n; i++) {
      cards.push(this.deck.pop());
    }
  }
  return cards;
};

function DistrictDeck() {
  Deck.call(this);
  this.deck = Object.create(districtDeckArray);
}

DistrictDeck.prototype = Object.create(Deck.prototype);
DistrictDeck.prototype.constructor = DistrictDeck;

function CharacterDeck() {
  Deck.call(this);
  this.deck = Object.create(characterDeckArray);
}
CharacterDeck.prototype = Object.create(Deck.prototype);
CharacterDeck.prototype.constructor = CharacterDeck;
CharacterDeck.prototype.characterByRank = function (rank) {
  for (var i = 0, ii = this.deck.length; i < ii; i++) {
    if (this.deck[i].rank == rank) {
      return this.deck[i];
    }
  }
  return false;
};

exports.DistrictDeck = DistrictDeck;
exports.CharacterDeck = CharacterDeck;