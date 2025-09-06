class MarkCellPacket {
    packetId = 5

    Received(view) {
        let cx = view.getInt32(0, false)
        let cy = view.getInt32(4, false)
        let tx = view.getUint8(8, false)
        let ty = view.getUint8(9, false)

        if (chunks[cx] == null)
            return
        let chunk = chunks[cx][cy]
        if (chunk == null)
            return

        let cell = chunk.cells[tx][ty]
        cell.cycleMarkedState()
    }
}