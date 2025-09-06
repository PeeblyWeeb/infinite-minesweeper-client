class BannedPacket {
    packetId = 6

    Received(view) {
        let duration = view.getFloat32(0)
        ServerDeath(duration)
    }
}