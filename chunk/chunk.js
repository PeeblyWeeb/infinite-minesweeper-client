let chunks = []
let flatchunks = []

let debugDrawBorders = false

class Chunk extends BaseChunk {
    cells = [];
    culled = true

    offscreen = document.createElement("canvas");
    rerender = true

    disposed = false

    constructor(chunkX, chunkY) {
        super()

        this.offscreen.width = cellsPerChunkScaled;
        this.offscreen.height = cellsPerChunkScaled;

        this.offCtx = this.offscreen.getContext("2d");
        this.offCtx.imageSmoothingEnabled = false;

        this.x = chunkX;
        this.y = chunkY;

        this.sinceCulled = (Date.now() / 1000)

        if (chunks[chunkX] == null)
            chunks[chunkX] = []
        chunks[chunkX][chunkY] = this
        flatchunks.push(this)

        let pendingChunk = GetPendingChunkByXY(this.x, this.y)
        if (pendingChunk != null)
            pendingChunk.dispose()

        //let emptyCells = []

        /*for (let cellX = 0; cellX < cellsPerChunk; cellX++) {
            for (let cellY = 0; cellY < cellsPerChunk; cellY++) {
                if (!this.cells[cellX]) {
                    this.cells[cellX] = []
                }

                let cell = new Cell(cellX, cellY, this);
                emptyCells.push(cell)
                this.cells[cellX][cellY] = cell
            }
        }*/

        /*for (let i = 0; i < 250; i++) {
            if (emptyCells.length <= 0)
                break;

            let index = Math.round(Math.random() * (emptyCells.length - 1))

            let cell = emptyCells[index]
            cell.bomb = true
            emptyCells.pop(index)
        }*/
    }

    findCell(mx, my) {
        //this.rerender = true

        let render = this.getRenderPosition();

        for (let x = 0; x < cellsPerChunk; x++) {
            for (let y = 0; y < cellsPerChunk; y++) {
                let cell = this.cells[x][y]

                let cellRenderOffset = cell.getRenderOffset()

                let renderX = render.x + cellRenderOffset.x
                let renderY = render.y + cellRenderOffset.y

                let rightRenderX = renderX + cellRenderSize
                let bottomRenderY = renderY + cellRenderSize

                if (mx >= renderX && my >= renderY && mx <= rightRenderX && my <= bottomRenderY) {
                    return cell
                }
            }
        }
    }

    drawTexture() {
        if (!readyToRender)
            return;

        if (!this.rerender)
            return;

        this.rerender = false

        this.cells.forEach(yArray => {
            yArray.forEach(cellObject => {
                cellObject.forceRender();
            })
        });
    }

    dispose() {
        if (this.disposed)
            return;
        this.disposed = true

        for (let i = 0; i < flatchunks.length; i++) {
            let flatchunk = flatchunks[i]
            if (flatchunk.x == this.x && flatchunk.y == this.y) {
                //flatchunks.pop(i)
                flatchunks.splice(i, 1);
                break
            }
        }

        chunks[this.x][this.y] = null

        // holy shit this bug is crazy
        // if the chunk unloads, the other chunks adjacent tiles still have a reference to this chunks tiles at the-
        // edge of chunks, we need to remove those references
        for (let x = 0; x < 32; x++) {
            for (let y = 0; y < 32; y++) {
                let cell = this.cells[x][y]

                let arr = Array.from(cell.adjacentCells)
                for (let i = 0; i < arr.length; i++) {
                    let adjacentCell = arr[i]
                    if (adjacentCell.chunk == cell.chunk)
                        continue

                    let index = adjacentCell.adjacentCells.indexOf(this)
                    if (!index) {
                        console.warn("could not find self in adjacent")
                        continue // failsafe just in case
                    }
                    adjacentCell.adjacentCells.splice(index, 1)
                }
            }
        }

        console.log(`disposed of chunk ${this.x}, ${this.y}`)
    }

    dynamicCull() {
        let render = this.getRenderPosition()

        let rightX = render.x + cellsPerChunkScaled
        let leftX = render.x

        let topY = render.y
        let bottomY = render.y + cellsPerChunkScaled

        let leftCanvasX = -panCanvas.viewportPosition.x //+ window.innerWidth
        let rightCanvasX = -panCanvas.viewportPosition.x + panCanvas.canvas.width

        let topCanvasY = -panCanvas.viewportPosition.y //+ window.innerWidth
        let bottomCanvasY = -panCanvas.viewportPosition.y + panCanvas.canvas.height

        if (leftX > rightCanvasX || rightX < leftCanvasX || bottomY < topCanvasY || topY > bottomCanvasY) {
            if (this.culled == false) {
                this.sinceCulled = (Date.now() / 1000)
                console.log(`started culling ${this.x}, ${this.y}`)
            }

            this.culled = true

            let culledFor = (Date.now() / 1000) - this.sinceCulled
            if (culledFor > 10) {
                this.dispose()
            }
        } else {
            if (this.culled == false) {
                return;
            }
            this.culled = false
        }
    }

    render(context) {
        this.drawTexture();

        /*if (this.clicked) {
            let render = this.getRenderPositionPan();
 
            context.fillStyle = "grey"
            context.fillRect(render.x, render.y, 16 * 32, 16 * 32)
            return
        }*/

        let render = this.getRenderPositionPan();

        if (this.culled) {
            return
        }

        context.drawImage(this.offscreen, render.x, render.y, cellsPerChunkScaled, cellsPerChunkScaled); // single draw call

        if (!debugDrawBorders)
            return
        context.fillStyle = "red"
        context.fillRect(render.x, render.y, 1, cellsPerChunkScaled)
        context.fillRect(render.x, render.y, cellsPerChunkScaled, 1)
    }
}