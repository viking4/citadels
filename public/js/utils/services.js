define(["angular", "btford.socket-io"], function (angular) {
  "use strict";

  return angular.module("utils.services", ["btford.socket-io"])
    .factory("socket", ["socketFactory", function (socketFactory) {
      return socketFactory({
        ioSocket: io.connect("http://localhost", {port: 5000, transports: ["websocket"]})
      });
    }])
    .factory("appFactory", function () {
      return  {
        socketConnected: false,
        player: {
          nickname: ""
        },
        remotePlayers: {},
        remoteRooms: {}
      };
    })
    .factory("gameFactory", ["$filter", function ($filter) {
      return {
        init: function (nickname, roomName, roomCap) {
          angular.extend(this, {
            gameLog: "This is the game log.\n",
            roomName: roomName,
            nickname: nickname,
            characters: {},
            currentCharacter: {},
            gold: 0,
            income: 0,
            districtHand: [],
            ownedDistricts: {},
            onTurn: false,
            buildCap: 1,
            buildTurn: false,
            murderVictim: {},
            bishopHolder: "",
            players: {},
            order: [],
            roomCap: roomCap
          })
        },
        log: function log(str) {
          this.gameLog += $filter('date')(new Date(), 'h:mm:ss') + ": " + str + "\n";
        },
        gainGold: function (gold) {
          this.gold += gold;
        },
        gainDistrictHand: function (cards) {
          this.districtHand = this.districtHand.concat(cards);
        },
        buildDistrict: function (card) {
          this.ownedDistricts[card.name] = card;
          this.districtHand.splice(this.districtHand.indexOf(card), 1);
          this.gold -= card.cost;
          this.buildCap--;
        },
        isOwned: function (name) {
          return this.ownedDistricts[name];
        },
        calculateIncome: function () {
          if (this.currentCharacter) {
            var earnDistrictType;
            this.income = 0;
            switch (this.currentCharacter.rank) {
              case 4:
                earnDistrictType = "Noble";
                break;
              case 5:
                earnDistrictType = "Religious";
                break;
              case 6:
                earnDistrictType = "Trade";
                break;
              case 8:
                earnDistrictType = "Military";
                break;
            }
            if (earnDistrictType) {
              var districtKeys = Object.keys(this.ownedDistricts);
              for (var i = 0, ii = districtKeys.length; i < ii; i++) {
                if (this.ownedDistricts[districtKeys[i]].type == earnDistrictType)
                  this.income++;
              }
            }
          }
        },
        charsToString: function  (chars) {
          for (var i = 0, ii = chars.length, str = ""; i < ii; i++) {
            str += chars[i].name + ", ";
          }
          return str.slice(0, -2);
        },
        cardsToString: function (cards) {
          for (var i = 0, ii = cards.length, str = ""; i < ii; i++) {
            str += cards[i].name + ", ";
          }
          return str.slice(0, -2);
        }
      };
    }])
});