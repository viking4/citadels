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
          game.calculateIncome();
          game.log("School of Magic is now a " + type.type + " district");
          game.setOwnedDistrictType("School of Magic", type.type);
          $scope.socket.emit("school of magic", {roomName: game.roomName, type: type.type, gold: gold});
          $scope.SchoolOfMagic = false;
        };
        $scope.socket.on("school of magic", function (data) {
          game.players[data.nickname].gold += data.gold;
          game.log(data.nickname + " turns his School of Magic to " + data.type + " district, and gains " + data.gold + " gold");
        });
      }])
});