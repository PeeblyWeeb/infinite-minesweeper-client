class PlayerUnregisterPacket {
    packetId = 2

    Received(view) {
        let playerId = view.getInt32(0, false)

        let player = GetPlayerById(playerId)
        if (player == null) {
            console.warn(`no player was found with the id of ${playerId}`)
            return
        }
        player.dispose()
        console.log(`disposed player with id ${playerId}`)
    }
}