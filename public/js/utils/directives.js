define(["angular"], function (angular) {
  "use strict";

  return angular.module("utils.directives", [])
    .directive('scrollGlue', function(){
      return function (scope, elms, attrs) {
        elms.bind("change", function () {
          elms[0].scrollTo = elms[0].scrollHeight;
        })
      }
    })
    .directive('autofocus', function () {
      return function (scope, element) {
        element[0].focus();
      };
    })
    .directive('autoscrollbottom', function () {
      return function (scope, element) {
        scope.$watch(function () {
          return element[0].value;
        }, function () {
          element[0].scrollTop = element[0].scrollHeight;
        });
      };
    });
});