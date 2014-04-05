var Card = {
  name: 'none'
};

var District = Card.spawn({
  type: 'none',
  cost: 0
});

var Character = Card.spawn({
  rank: 0
});

var Deck = {
  deck: [],
  shuffle: function () {}
};

var districtDeckArray = [];

function addDistrictCard(quantity, name, type, cost) {
  for (var i = 0; i < quantity; i++) {
    districtDeckArray.push(
      District.spawn({
        name: name,
        type: type,
        cost: cost
      })
    )
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

var DistrictDeck = Deck.spawn({
  deck: districtDeckArray
});


var characterDeckArray = [];

function addCharacterCard(name, rank) {
  characterDeckArray.push(
    Character.spawn({
      name: name,
      rank: rank
    })
  )
}

addCharacterCard('Assassin', 1);
addCharacterCard('Thief', 2);
addCharacterCard('Magician', 3);
addCharacterCard('King', 4);
addCharacterCard('Bishop', 5);
addCharacterCard('Merchant', 6);
addCharacterCard('Architect', 7);
addCharacterCard('Warlord', 8);


var CharacterDeck = Deck.spawn({
  deck: characterDeckArray
});

exports.DistrictDeck = DistrictDeck;
exports.CharacterDeck = CharacterDeck;