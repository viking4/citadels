/*
 * GET home page.
 */

exports.index = function(req, res){
  res.sendfile('views/index.html');
};

exports.game = function (req, res) {
  var name = req.params.name;
  res.sendfile('views/game/' + name);
};

exports.main = function (req, res) {
  var name = req.params.name;
  res.sendfile('views/main/' + name);
};