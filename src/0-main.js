'use advanced';
'render invisible';

// globals
var board = {};
var hand;
var graphics = {
    colorBackground: { red: 30, green: 30, blue: 35 },
    colorPrev: { red: 255, green: 255, blue: 0, opacity: 0.5 },
    colorHighlight: { red: 235, green: 97, blue: 80, opacity: 0.8 },
    colorHint: { red: 0, green: 0, blue: 0, opacity: 0.1 },
    colorTransparent: { red: 0, green: 0, blue: 0, opacity: 0.000001 },
    pieces: new Sprite(1, 1, 'chesspieces', 6, 2),
    buttonIcons: new Sprite(1, 1, 'chessbuttonicons', 5, 2),
    board: new Image(0, 0, 'chessboard'),
    promotionGui: {
        visible: false,
        tile: undefined,
    },
    view: 0,
    boardPos: new IntPos(40, 40),
    buttons: [new Button(loadPGNButton, 0), new Button(outPGNButton, 1), new Button(loadFENButton, 2), new Button(outFENButton, 3), new Button(swapView, 5), new Button(back, 6), new Button(forward, 7), new Button(reset, 8)]
};
var game = {
    scale: 1,
    size: 8,
    moves: [],
    currentFrame: 0,
    validMoves: {},
};
var cache = {
    rInfo: calculateRenderingInfo(),
    ccanvas: { width: undefined, height: undefined },
};


function mouseToggle(e, dir) {
    /// main click event
    var tile = {
        x: floor((e.x - cache.rInfo.corner.x) / cache.rInfo.tileSize),
        y: floor(game.size - (e.y - cache.rInfo.corner.y) / cache.rInfo.tileSize)
    };
    if (graphics.view == 1) {
        var rtile = {
            x: game.size - tile.x - 1,
            y: game.size - tile.y - 1
        };
        var cTile = toChessNotation(rtile);
    } else {
        var cTile = toChessNotation(tile);
    }
    var currentTile = board.tiles[cTile];
    if (e.button == 'Left') {
        if (currentTile != undefined && dir == MouseState.DOWN && currentTile.color == board.turn && game.currentFrame == game.moves.length) {
            // pick up piece
            game.validMoves = findPieceMoves(board.tiles, cTile);
            hand.piece = new Piece(currentTile.type, currentTile.color);
            hand.from = cTile;
            board.tiles[cTile] = undefined;
        } else if (dir == MouseState.UP && hand.piece != undefined) {
            // set down piece
            var color = hand.piece.color;
            if (game.validMoves[cTile] != undefined && color == board.turn) {
                if (hand.piece.type == Pieces.PAWN) {
                    if ((color == Colors.WHITE && tile.y == 7) || (color == Colors.BLACK && tile.y == 0)) {
                        // pawn promotes
                        // goes straight to queen
                        var newPiece = Pieces.QUEEN;
                        game.validMoves[cTile].promotion = newPiece;
                        hand.piece.type = newPiece;
                    } else if (game.validMoves[cTile].enpassantCapture != undefined) {
                        board.tiles[game.validMoves[cTile].enpassantCapture] = undefined;
                    }
                }
                movePiece(hand.from, cTile, hand.piece.type, hand.piece.color);
                onPieceMove(game.validMoves[cTile]);
            } else if (hand.piece != undefined) {
                // return piece
                board.tiles[hand.from] = new Piece(hand.piece.type, hand.piece.color);
                resetHand();
            }
        } else if (tile.y == 8 && tile.x < graphics.buttons.length && dir == MouseState.DOWN) {
            // button pressed
            var b = graphics.buttons[tile.x];
            b.func();
        } else if (currentTile == undefined) {
            // no piece clicked; reset hints
            game.validMoves = {};
        }
    }
}