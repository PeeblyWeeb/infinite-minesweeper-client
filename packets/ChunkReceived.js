class ChunkReceivedPacket {
    packetId = 0

    Received(view) {
        let chunkX = view.getInt32(0)
        let chunkY = view.getInt32(4)

        let chunk = new Chunk(chunkX, chunkY)

        let length = view.getInt16(8)
        for (let i = 0; i < length; i++) {
            let state = view.getUint8(10 + i)

            let bomb = (state & 1) !== 0
            let marked = (state & 2) !== 0
            let revealed = (state & 4) !== 0

            let x = Math.floor(i / cellsPerChunk);
            let y = i % cellsPerChunk;

            let cell = new Cell(x, y, chunk)
            cell.bomb = bomb
            cell.marked = marked
            cell.revealed = revealed

            if (chunk.cells[x] == null)
                chunk.cells[x] = []
            chunk.cells[x][y] = cell
        }

        console.log(`received chunk with ${length} cells`)

        chunk.cells[31][31].calculateAdjacentCells()
    }
}