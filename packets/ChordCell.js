class ChordCellPacket {
    packetId = 8

    Received(view) {
        let cellCount = view.getUint16()

        let dataIndex = 2
        for (let i = 0; i < cellCount; i++) {
            let cx = view.getInt32(dataIndex)
            let cy = view.getInt32(dataIndex + 4)
            let tx = view.getUint8(dataIndex + 8)
            let ty = view.getUint8(dataIndex + 9)

            dataIndex += 10

            console.log(cx, cy, tx, ty)

            if (chunks[cx] == null)
                continue
            let chunk = chunks[cx][cy]
            if (chunk == null)
                continue
            let cell = chunk.cells[tx][ty]
            cell.reveal()
        }
    }
}