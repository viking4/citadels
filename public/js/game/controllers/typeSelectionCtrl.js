define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.typeSelectionCtrl", [])
    .controller("TypeSelectionCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.socket.on("haunted city", function (data) {
          if (game.nickname == data.nickname) {
            $scope.HauntedCity = true;
            game.log("You own Haunted City, it's your turn to choose its color.");
          } else {
            game.log(data.nickname + " who owns Haunted City is choosing its color.")
          }
        });
        $scope.chooseHauntedCity = function (type) {
          game.setHauntedCityAttr("type", type.type);
          $scope.socket.emit("haunted city", {roomName: game.roomName, type: type});
          $scope.HauntedCity = false;
          game.log("Your haunted city's type is " + type.type + " with color " + type.color);
        };
        $scope.socket.on("haunted city done", function (data) {
          game.log("The haunted city's type is " + data.type.type + " with color " + data.type.color);
        });

        $scope.chooseSchoolOfMagic = function (type) {
          var earnDistrictType;
          switch (game.currentCharacter.rank) {
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
          var gold = 0;

          if (type.type == earnDistrictType) {
            gold = 1;
            game.gold++;
            game.log("You gain one gold from \"School of Magic\" as " + type.type + " district");
          } else {
            game.log("School of Magic is now a " + type.type + " district");
          }
          $scope.socket.emit("school of magic", {roomName: game.roomName, type: type.type, gold: gold});
          $scope.SchoolOfMagic = false;
        };
        $scope.socket.on("school of magic", function (data) {
          game.players[data.nickname].gold += data.gold;
          game.log(data.nickname + " turns his School of Magic to " + data.type + " district, and gains " + data.gold + " gold");
        });
      }])
});