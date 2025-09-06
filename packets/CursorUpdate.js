class CursorUpdatePacket {
    packetId = 3

    Received(view) {
        let playerId = view.getInt32(0, false)
        let x = view.getInt32(4, false)
        let y = view.getInt32(8, false)

        let player = GetPlayerById(playerId)
        if (player == null) {
            console.warn("player null haha")
            return
        }

        player.position(x, y)
    }
}