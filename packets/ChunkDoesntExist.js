class ChunkDoesntExistPacket {
    packetId = 7

    Received(view) {
        let chunkX = view.getInt32(0)
        let chunkY = view.getInt32(4)

        MarkPendingChunkAsNonExistant(chunkX, chunkY)
    }
}