define(["angular"], function (angular) {
  "use strict";

  return angular.module("utils.directives", [])
    .directive('scrollGlue', function(){
      return function (scope, elms, attrs) {
        elms.bind("change", function () {
          elms[0].scrollTo = elms[0].scrollHeight;
        })
      }
    });
});