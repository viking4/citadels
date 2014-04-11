/**************************************************
 ** GAME PLAYER CLASS
 **************************************************/
function Player(id, name) {
  this.id = "";
  this.name = "";
  if (id)
    this.id = id;
  if (name)
    this.nickname = name;
}

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;