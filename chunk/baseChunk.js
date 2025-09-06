const cellsPerChunk = 32
const cellsPerChunkScaled = cellsPerChunk * cellRenderSize

class BaseChunk {
    x = 0
    y = 0

    getRenderPosition() {
        let x = (this.x * cellsPerChunkScaled)
        let y = (this.y * cellsPerChunkScaled)
        return { x, y }
    }

    getRenderPositionPan() {
        let render = this.getRenderPosition()

        let x = render.x + panCanvas.viewportPosition.x
        let y = render.y + panCanvas.viewportPosition.y
        return { x, y }
    }
}