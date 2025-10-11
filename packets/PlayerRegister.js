let clientPlayerId = null

class PlayerRegisterPacket {
    packetId = 1

    Received(view) {
        let playerId = view.getInt32(0, false)
        let local = view.getUint8(4) == 1

        if (local) {
            clientPlayerId = playerId
            console.log(`Set client player ID to ${playerId}`)
        }

        new Player(playerId, local)
        console.log(`registered player with id ${playerId}`)
    }
}