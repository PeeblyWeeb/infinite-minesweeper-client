class PlayerRegisterPacket {
    packetId = 1

    Received(view) {
        let playerId = view.getInt32(0, false)
        let local = view.getUint8(4) == 1

        new Player(playerId, local);

        console.log(`registered player with id ${playerId}`)
    }
}