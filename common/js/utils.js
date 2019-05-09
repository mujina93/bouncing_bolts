/// TODO refactor using findInGroupGivenId(phaserGroup, id,
/// or use just that function
export function findClientsPlayer(playersGO, socketId) {
    var targetPlayer = null;
    playersGO.getChildren().some(function (player) {
      console.log(player.playerId)
      console.log(socketId);
      // console.log("TYPES: " + typeof(player.playerId) + " " + typeof(socketId));
      console.log("SAME? ");
      console.log(player.playerId === socketId);
      // console.log(player.playerId.length + ' ' + socketId.length);
      if (player.playerId === socketId) {
        targetPlayer = player;
        return true; // returning true to some() breaks the loop
      }
    });
    if (targetPlayer === null){
      console.log(`PROBLEM! player not found with id: ${socketId}`);
    }
    // playersGO.getChildren().forEach(function (player) {
    //   console.log(player.playerId);
    // });
    return targetPlayer;
 }