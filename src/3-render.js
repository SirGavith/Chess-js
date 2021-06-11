//rendering functions

function calculateRenderingInfo() {
    /// calculates rendering info like tileSize and the top left corner
    var h = canvas.height - graphics.boardPos.y;
    var w = canvas.width - graphics.boardPos.x;
    if (w > h) {
        var maxBSize = h;
    } else {
        var maxBSize = w;
    }
    var corner = {
        x: (canvas.width - maxBSize),
        y: (canvas.height - maxBSize)
    };
    return { tileSize: maxBSize * game.scale / game.size, corner: corner };
}

function renderPos(pos) {
    /// calculates the pixel position of a certain tile
    if (graphics.view == 1) {
        pos.x = game.size - pos.x - 1;
        pos.y = game.size - pos.y - 1;
    }
    var x = cache.rInfo.corner.x + pos.x * cache.rInfo.tileSize;
    var y = cache.rInfo.corner.y + (game.size - pos.y - 1) * cache.rInfo.tileSize;
    return new IntPos(x, y);
}

function drawPiece(pos, tile) {
    /// draws a tile at pos
    graphics.pieces.x = pos.x;
    graphics.pieces.y = pos.y;
    graphics.pieces.draw(tile.type + 6 * abs(tile.color - 1));
}

function drawSquare(rPos, color) {
    /// draws a square of a certain color at rPos
    var s = new Rectangle(rPos.x, rPos.y, cache.rInfo.tileSize, cache.rInfo.tileSize, color);
    s.draw();
}

function highlightsquares(squares, color) {
    /// highlights a list of squares in a specific color
    for (var i = 0; i < squares.length; i++) {
        var move = fromChessNotation(squares[i]);
        var rPos = renderPos(move);
        drawSquare(rPos, color);
    }
}

function updateCanvasSize() {
    /// called on on canvas resize; resets cache
    background(graphics.colorBackground);
    cache.ccanvas = { width: canvas.width, height: canvas.height };
    cache.rInfo = calculateRenderingInfo();
    var tSize = cache.rInfo.tileSize;
    graphics.pieces.width = tSize;
    graphics.pieces.height = tSize;
    graphics.buttonIcons.width = tSize;
    graphics.buttonIcons.height = tSize;
    graphics.board.x = cache.rInfo.corner.x;
    graphics.board.y = cache.rInfo.corner.y;
    graphics.board.scale = tSize * game.size / 512;
}

function drawBoard() {
    /// draws the board
    background(graphics.colorBackground);

    var cor = cache.rInfo.corner;
    var tSize = cache.rInfo.tileSize;

    // draw buttons
    for (var button = 0; button < graphics.buttons.length; button++) {
        var b = graphics.buttons[button];
        graphics.buttonIcons.x = cor.x + button * tSize;
        graphics.buttonIcons.y = cor.y - tSize;
        graphics.buttonIcons.draw(b.img);
    }

    // draw board
    graphics.board.draw();
    // highlight last move
    var lastMove = game.moves[game.currentFrame - 1];
    if (lastMove != undefined) {
        highlightsquares([lastMove.move.from, lastMove.move.to], graphics.colorPrev);
    }
    // draw pieces 
    for (var p in board.tiles) {
        var tile = board.tiles[p];
        if (tile != undefined) {
            var rPos = renderPos(fromChessNotation(p));
            drawPiece(rPos, tile);
        }
    }
    // draw valid moves 
    for (var p in game.validMoves) {
        var rPos = renderPos(fromChessNotation(p));
        var tSize = cache.rInfo.tileSize;
        var hint = new Circle(rPos.x + tSize / 2, rPos.y + tSize / 2);
        if (board.tiles[p] != undefined) {
            hint.radius = tSize / 2 - tSize / 20;
            hint.fill = graphics.colorTransparent;
            hint.borderColor = graphics.colorHint;
            hint.borderWidth = tSize / 10;
        } else {
            hint.radius = tSize / 6;
            hint.fill = graphics.colorHint;
        }
        hint.draw();
    }
    // draw hand
    var tile = hand.piece;
    if (tile != undefined) {
        var rPos = {
            x: mouse.x - tSize / 2,
            y: mouse.y - tSize / 2
        };
        drawPiece(rPos, tile);
    }
}