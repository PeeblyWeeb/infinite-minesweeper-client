let readyToRender = false
let loadedAssets = 0

const cellRenderSize = 16

const cardinalDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
]

const directions = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
    [1, -1]
]

let assets = [
    "/static/tile.webp",
    "/static/tile0.webp",
    "/static/tile1.webp",
    "/static/tile2.webp",
    "/static/tile3.webp",
    "/static/tile4.webp",
    "/static/tile5.webp",
    "/static/tile6.webp",
    "/static/tile7.webp",
    "/static/tile8.webp",
    "/static/tilebomba.webp",
    "/static/tilebombaclicked.webp",
    "/static/tilemarked.webp",
]

function loadAsset(path) {
    const img = new Image(cellRenderSize, cellRenderSize)
    img.src = path
    img.onload = () => {
        loadedAssets++
        if (loadedAssets >= assets.length)
            readyToRender = true
    };
    return img
}

const tileImages = {
    default: loadAsset(assets[0]),
    bomb: loadAsset(assets[10]),
    bomb_clicked: loadAsset(assets[11]),
    marked: loadAsset(assets[12]),
    revealed: {
        0: loadAsset(assets[1]),
        1: loadAsset(assets[2]),
        2: loadAsset(assets[3]),
        3: loadAsset(assets[4]),
        4: loadAsset(assets[5]),
        5: loadAsset(assets[6]),
        6: loadAsset(assets[7]),
        7: loadAsset(assets[8]),
        8: loadAsset(assets[9]),
    }
}

class Cell {
    chunk = null

    x = 0
    y = 0

    revealed = false

    marked = false
    bomb = false

    chordhover = false

    adjacentBombs = 0
    adjacentCellsCardinal = []
    adjacentCells = []

    adjacentDebugRender = false

    constructor(x, y, chunk) {
        this.x = x
        this.y = y
        this.chunk = chunk
    }

    /*unrenderAdjacents() {
        for (let i = 0; i < this.adjacentCells.length; i++) {
            let cell = this.adjacentCells[i]
            cell.adjacentDebugRender = false
            cell.chunk.rerender = true
        }
    }

    renderAdjacents() {
        for (let i = 0; i < this.adjacentCells.length; i++) {
            let cell = this.adjacentCells[i]
            cell.adjacentDebugRender = true
            cell.chunk.rerender = true
        }
    }*/

    getMarkedAdjacentCount() {
        let count = 0
        for (let i = 0; i < this.adjacentCells.length; i++) {
            let cell = this.adjacentCells[i]
            if (cell.marked || (cell.bomb && cell.revealed)) {
                count += 1
            }
        }
        return count
    }

    cycleMarkedState() {
        this.marked = !this.marked
        this.forceRender()
    }

    calculateAdjacentBombs() {
        this.adjacentBombs = 0
        for (let i = 0; i < this.adjacentCells.length; i++) {
            let cell = this.adjacentCells[i]
            if (cell.bomb) {
                this.adjacentBombs++
            }
        }
    }

    calculateAdjacentCells() {
        for (let i = 0; i < directions.length; i++) {
            let direction = directions[i]

            let revealX = this.x + direction[0]
            let revealY = this.y + direction[1]

            let chunkX = this.chunk.x
            let chunkY = this.chunk.y

            //let isCardinal = i <= 3

            if (revealX < 0) {
                chunkX -= 1
                revealX = cellsPerChunk - 1
            }
            if (revealX >= cellsPerChunk) {
                chunkX += 1
                revealX = 0
            }
            if (revealY < 0) {
                chunkY -= 1
                revealY = cellsPerChunk - 1
            }
            if (revealY >= cellsPerChunk) {
                chunkY += 1
                revealY = 0
            }

            if (!chunks[chunkX] || !chunks[chunkX][chunkY])
                continue

            let refchunk = chunks[chunkX][chunkY]
            let cell = refchunk.cells[revealX][revealY]

            if (!this.adjacentCells.includes(cell)) {
                this.adjacentCells.push(cell)

                this.calculateAdjacentBombs()

                this.forceRender()
            }

            if (!cell.adjacentCells.includes(this)) {
                cell.adjacentCells.push(this)

                cell.calculateAdjacentCells()
                cell.calculateAdjacentBombs()

                cell.forceRender()
            }

            /*if (isCardinal && !cell.adjacentCellsCardinal.includes(this)) {
                cell.adjacentCellsCardinal.push(this)
                inserted = true
            }*/
        }
    }

    reveal() {
        this.revealed = true
        this.forceRender()

        if (this.bomb || this.adjacentBombs > 0)
            return;

        for (let i = 0; i < this.adjacentCells.length; i++) {
            let cell = this.adjacentCells[i]
            if (cell.revealed)
                continue
            if (cell.bomb)
                continue
            cell.reveal()
        }
    }

    getRenderOffset() {
        let x = (this.x * cellRenderSize)
        let y = (this.y * cellRenderSize)
        return { x, y }
    }

    getTexture() {
        /*if (this.bomb) {
            return tileImages.bomb
        }*/
        if (!this.revealed && !this.marked && this.chordhover) {
            return tileImages.revealed[0]
        }
        if (this.revealed) {
            if (this.bomb) {
                return tileImages.bomb_clicked
            }
            return tileImages.revealed[this.adjacentBombs]
        }
        if (this.marked) {
            return tileImages.marked
        }
        return tileImages.default
    }

    forceRender() {
        this.render(this.chunk.offCtx)
    }

    render(context) {
        //

        //let render = this.chunk.getRenderPosition()

        let render = this.getRenderOffset()
        if (this.adjacentDebugRender) {
            context.fillStyle = "cyan"
            context.fillRect(render.x, render.y, cellRenderSize, cellRenderSize)
            return
        }

        context.drawImage(this.getTexture(), render.x, render.y, cellRenderSize, cellRenderSize)
    }
}
