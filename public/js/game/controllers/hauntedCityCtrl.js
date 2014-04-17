define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.hauntedCityCtrl", [])
    .controller("HauntedCityCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.hauntedCityTypes = [
          {type: 'Noble', color: 'Yellow'},
          {type: 'Religious', color: 'Blue'},
          {type: 'Trade', color: 'Green'},
          {type: 'Military', color: 'Red'},
          {type: 'Special', color: 'Purple'},
        ];
        $scope.socket.on("haunted city", function (data) {
          if (game.nickname == data.nickname) {
            $scope.HauntedCity = true;
            game.log("You own Haunted City, it's your turn to choose its color.")
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
      }])
});