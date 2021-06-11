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

// general utils

function findSubtringPairsBetweenChars(str, openChar, closeChar, maxPairs) {
    /// used for parsing PGN key-object pairs 
    var pairs = [];
    var pairOpen = -1;
    for (var i = 0; i < str.length; i++) {
        var char = str.charAt(i);
        if (char == openChar && pairOpen < 0) {
            pairOpen = i;
            continue;
        } else if (char == closeChar) {
            var pair = str.slice(pairOpen + 1, i);
            pairs.push(pair);
            pairOpen = -1;
            if (maxPairs != undefined && pairs.length >= maxPairs) {
                return pairs;
            }
        }
    }
    return pairs;
}

function removeComments(str, openChar, closeChar) {
    /// removes all substrs between an open and close char
    while (true) {
        var x = undefined;
        var x = findCharPair(str, openChar, closeChar);
        if (!x) {
            break;
        }
        str = str.slice(0, x[0]) + str.slice(x[1] + 1, str.length);
    }
    return str;
}

function findCharPair(str, openChar, closeChar) {
    /// finds the char pair for removeComments()
    var openPos;
    for (var i = 0; i < str.length; i++) {
        var char = str.charAt(i);
        if (char == openChar && openPos == undefined) {
            openPos = i;
        } else if (openPos != undefined && char == closeChar) {
            return [openPos, i];
        }
    }
    return false;
}

function copyObj(obj) {
    /// returns a copy of the object
    var out = {};
    for (var p in obj) {
        if (obj[p] != undefined) {
            out[p] = obj[p];
        }
    }
    return out;
}

function keys(obj) {
    /// returns a list of the keys of an object
    var out = [];
    for (var k in obj) {
        out.push(k);
    }
    return out;
}

function replaceNums(str) {
    /// replaces nuberical characters in a str with that number of dashes
    var nums = "12345678";
    for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (nums.includes(c)) {
            var n = Number(c);
            var empty = "-";
            empty = empty.repeat(n);
            str = [str.slice(0, i), empty, str.slice(i + 1, str.length)].join("");
        }
    }
    return str;
}

// chess related utils

function toChessNotation(pos) {
    /// converts IntPos to chess notation
    var x = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][pos.x];
    var y = String(pos.y + 1);
    return x + y;
}
function fromChessNotation(str) {
    /// converts chess notation to IntPos
    var a = str[0].toLowerCase();
    var x = a.charCodeAt(0);
    var y = Number(str[1]);
    return new IntPos(x - 97, y - 1);
}

function findKing(tiles, color) {
    /// returns position of king of certain color in tiles
    for (var piece in tiles) {
        var p = tiles[piece];
        if (p != undefined && p.type == Pieces.KING && p.color == color) {
            return piece;
        }
    }
    return false;
}

function pieceRange(from, to) {
    /// returns the range of chess tiles between two tiles
    var range = [];
    var dif = new IntPos(abs(from.x - to.x), abs(from.y - to.y));
    if (from.x == to.x) {
        // col
        for (var t = 1; t < abs(from.y - to.y); t++) {
            if (to.y - from.y > 0) {
                var y = from.y + t;
            } else if (to.y - from.y < 0) {
                var y = from.y - t;
            }
            range.push(new IntPos(from.x,  y));
        }
    } else if (from.y == to.y) {
        // row
        for (var t = 1; t < abs(from.x - to.x); t++) {
            if (to.x - from.x > 0) {
                var x = from.x + t;
            } else if (to.x - from.x < 0) {
                var x = from.x - t;
            }
            range.push( new IntPos(x, from.y));
        }
    } else if (abs(from.x - to.x) == abs(from.y - to.y)) {
        // diag
        for (var t = 1; t < abs(from.x - to.x); t++) {
            if (to.x - from.x > 0) {
                var x = from.x + t;
                if (to.y - from.y > 0) {
                    var y = from.y + t;
                } else if (to.y - from.y < 0) {
                    var y = from.y - t;
                }
            } else if (to.x - from.x < 0) {
                var x = from.x - t;
                if (to.y - from.y > 0) {
                    var y = from.y + t;
                } else if (to.y - from.y < 0) {
                    var y = from.y - t;
                }

            }
            range.push(new IntPos(x, y));
        }
    } else if ((dif.x == 1 && dif.y == 2) || (dif.x == 2 && dif.y == 1)) {
        // knight
        return [];

    } else {
        return;
    }
    return range;
}

function isClear(from, to, tiles) {
    /// returns true if the specified range is clear in tiles
    var r = pieceRange(from, to);
    if (r == undefined) {
        return false;
    }
    for (var i = 0; i < r.length; i++) {
        var t = toChessNotation(r[i]);
        if (tiles[t] != undefined) {
            return false;
        }
    }
    return true;
}

function tryCastle(from, to, color) {
    /// returns rook positions if castling is valid, otherwise returns false
    var rookPos;
    var Sides = { LEFT: 0, RIGHT: 1 };
    var side;
    var isValid = false;
    if (from.y - to.y == 0 && abs(from.x - to.x) == 2 && (from.y == 0 || from.y == 7)) {
        if (board.castle[color].left == true && from.x - to.x == 2) {
            // left
            side = Sides.LEFT;
            isValid = true;
            rookPos = 0;
        } else if (board.castle[color].right == true && to.x - from.x == 2) {
            // right
            side = Sides.RIGHT;
            isValid = true;
            rookPos = 7;
        }
    }
    if (!isValid || !isClear(from, new IntPos(rookPos, 7 * color), board.tiles)) {
        return false;
    }
    var r = pieceRange(from, to);
    r.push(from);
    r.push(to);
    for (var t = 0; t < r.length; t++) {
        var tile = r[t];
        var check = isCheck(color, Pieces.KING, toChessNotation(tile));
        if (check) {
            return false;
        }
    }
    //find rook positions
    var rookToPos;
    var rookFromPos;
    if (color == Colors.WHITE) {
        if (side == Sides.LEFT) {
            rookToPos = "d1";
            rookFromPos = "a1";
        } else {
            rookToPos = "f1";
            rookFromPos = "h1";
        }
    } else {
        if (side == Sides.LEFT) {
            rookToPos = "d8";
            rookFromPos = "a8";
        } else {
            rookToPos = "f8";
            rookFromPos = "h8";
        }
    }
    return { f: rookFromPos, t: rookToPos };
}

function isMoveValid(f, t, piece, color, tiles, ignoreTurn, ignoreClear, enPassant) {
    /// returns bool whether move is valid, and extra info in specific situations:
    /// en passant, castling
    if (tiles == undefined && board.turn != color && ignoreTurn != true) {
        return { valid: false, why: "not turn" };
    }
    var isValid = false;
    if (tiles == undefined) {
        var toPiece = board.tiles[t];
    } else {
        var toPiece = tiles[t];
    }
    var from = fromChessNotation(f);
    var to = fromChessNotation(t);

    var enpassantCapture;

    if (from.x == to.x && from.y == to.y) {
        return { valid: false, why: "no move" };
    } else if (toPiece != undefined && color == toPiece.color) {
        return { valid: false, why: "to same color" };
    }
    if (!isClear(from, to, tiles) && !ignoreClear) {
        return { valid: false, why: "not clear" };
    }

    if (piece == Pieces.KING) {
        var x = tryCastle(from, to, color);
        if (abs(from.x - to.x) <= 1 && abs(from.y - to.y) <= 1) {
            isValid = true;
        } else if (x != false) {
            return { valid: true, castle: x};
        }
    } else if (piece == Pieces.QUEEN) {
        if ((abs(from.x - to.x) == abs(from.y - to.y) || (from.x == to.x || from.y == to.y))) {
            isValid = true;
        }
    } else if (piece == Pieces.ROOK) {
        if ((from.x == to.x || from.y == to.y)) {
            isValid = true;
        }
    } else if (piece == Pieces.BISHOP) {
        if (abs(from.x - to.x) == abs(from.y - to.y)) {
            isValid = true;
        }
    } else if (piece == Pieces.KNIGHT) {
        var dif = new IntPos(abs(from.x - to.x), abs(from.y - to.y));
        if ((dif.x == 1 && dif.y == 2) || (dif.x == 2 && dif.y == 1)) {
            isValid = true;
        }
    } else if (piece == Pieces.PAWN) {
        if (from.x == to.x && toPiece == undefined) {
            // same file

            if ((to.y - from.y == 1 && color == Colors.WHITE) || (from.y - to.y == 1 && color == Colors.BLACK)) {
                // forward one
                isValid = true;
            } else if (to.y - from.y == 2 && from.y == 1 && color == Colors.WHITE) {
                // white forward two 
                isValid = true;

            } else if (from.y - to.y == 2 && from.y == 6 && color == Colors.BLACK) {
                // black forward two 
                isValid = true;
            }
        } else if (abs(from.x - to.x) == 1 && ((color == Colors.WHITE && to.y == from.y + 1) || (color == Colors.BLACK && to.y == from.y - 1))) {
            // pawn can capture
            if (toPiece != undefined) {
                isValid = true;
            } else if ((enPassant != true && t == board.enpassant) || enPassant == true) {
                // try en passant
                isValid = true;
                if (color == Colors.WHITE) {
                    enpassantCapture = toChessNotation(new IntPos(to.x, to.y - 1));
                } else {
                    enpassantCapture = toChessNotation(new IntPos(to.x, to.y + 1));
                }
            }
        }
    }
    if (!isValid) {
        return { valid: false, why: "invalid" };
    }
    var notCheck = !isCheck(color, piece, t, f, tiles);
    return { valid: notCheck, why: "check", enpassantCapture: enpassantCapture};
}

function isCheck(color, type, to, from, t) {
    /// returns true if move is a check
    if (t == undefined) {
        var tiles = copyObj(board.tiles);
    } else {
        var tiles = copyObj(t);
    }
    if (to != undefined) {
        tiles[to] = new Piece(type, color);
    }
    if (from != undefined) {
        tiles[from] = undefined;
    }
    // find king
    var king = findKing(tiles, color);
    if (king == false) {
        return true;
    }
    // find checks
    for (var piece in tiles) {
        var p = tiles[piece];
        if (p != undefined && p.color != color) {
            if (isMoveValid(piece, king, p.type, p.color, tiles, false, false).valid) {
                return true;
            }
        }
    }
    return false;
}

function tryInvalidateCastle(from, type, color) {
    /// tries to invalidate castling, called on move
    if (type == Pieces.ROOK) {
        if (from == 'a1') {
            board.castle[color].left = false;
        } else if (from == 'h1') {
            board.castle[color].right = false;
        } else if (from == 'a8') {
            board.castle[color].left = false;
        } else if (from == 'h8') {
            board.castle[color].right = false;
        }
    } else if (type == Pieces.KING) {
        board.castle[color].right = false;
        board.castle[color].left = false;
    }
}

function movePiece(from, to, type, color) {
    /// moves a piece on board.tiles
    board.tiles[from] = undefined;
    board.tiles[to] = new Piece(type, color);
}

function findPieceMoves(tiles, tile, maxMoves) {
    /// returns list of all valid moves that a piece has
    var foundMoves = {};
    var foundMovesInt = 0;
    // these are all the 'rays'
    var tilesToCheck = {
        left: [[-1, 0], [-2, 0], [-3, 0], [-4, 0], [-5, 0], [-6, 0], [-7, 0]],
        right: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],

        down: [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5], [0, -6], [0, -7]],
        up: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],

        downLeft: [[-1, -1], [-2, -2], [-3, -3], [-4, -4], [-5, -5], [-6, -6], [-7, -7]],
        upLeft: [[-1, 1], [-2, 2], [-3, 3], [-4, 4], [-5, 5], [-6, 6], [-7, 7]],
        downRight: [[1, -1], [2, -2], [3, -3], [4, -4], [5, -5], [6, -6], [7, -7]],
        upRight: [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]],

        knight1: [[-2, -1]],
        knight2: [[-1, -2]],
        knight3: [[1, -2]],
        knight4: [[2, -1]],
        knight5: [[2, 1]],
        knight6: [[1, 2]],
        knight7: [[-1, 2]],
        knight8: [[-2, 1]],
    };
    // this connects the piece type to which rays it can move on
    var pieceMovement = {
        piece0: ["left", "right", "up", "down", "downLeft", "upLeft", "downRight", "upRight"],
        piece1: ["left", "right", "up", "down", "downLeft", "upLeft", "downRight", "upRight"],
        piece2: ["left", "right", "up", "down"],
        piece3: ["downLeft", "upLeft", "downRight", "upRight"],
        piece4: ["knight1", "knight2", "knight3", "knight4", "knight5", "knight6", "knight7", "knight8"],
        piece5: ["up", "down", "downLeft", "upLeft", "downRight", "upRight"],
    };
    var tPos = fromChessNotation(tile);
    var piece = tiles[tile];
    var cPieceType = String(piece.type);
    var cPieceMovement = pieceMovement["piece" + cPieceType];
    // loop through all the different rays
    for (var r = 0; r < cPieceMovement.length; r++) {
        var ray = cPieceMovement[r];
        var offsets = tilesToCheck[ray];
        // loop through the offsets
        for (var o = 0; o < offsets.length; o++) {
            var offset = offsets[o];
            var toPos = new IntPos(tPos.x + offset[0], tPos.y + offset[1]);
            if (toPos.x < 0 || toPos.x > 7 || toPos.y < 0 || toPos.y > 7) {
                // off board; go to next ray
                break;
            }
            var to = toChessNotation(toPos);
            if (!isClear(tPos, toPos, tiles)) {
                // not clear, no point in going further this direction
                break;
            }
            var v = isMoveValid(tile, to, piece.type, piece.color, board.tiles, true, true);
            if (v.valid == true) {
                // move is valid
                var isCapture = false;
                if ((keys(tiles).includes(to) && tiles[to] != undefined) || v.enpassantCapture != undefined) {
                    isCapture = true;
                }
                // add to list
                foundMoves[to] = new Move(tile, to, tPos, toPos, piece.type, piece.color, v.castle, v.enpassantCapture, tiles[v.enpassantCapture], isCapture, tiles[to]);
                foundMovesInt++;
                if (maxMoves != undefined && foundMovesInt >= maxMoves) {
                    return foundMoves;
                }
            }
        }
    }
    return foundMoves;
}

function evaluateGameStatus(tiles, color) {
    /// checks if the game is over
    color = (color + 1) % 2;
    var tKeys = keys(tiles);
    for (var t = 0; t < tKeys.length; t++) {
        var tile = tiles[tKeys[t]];
        if (tile != undefined && tile.color == color) {
            if (keys(findPieceMoves(tiles, tKeys[t], 1)).length > 0) {
                return { hasMoves: true };
            }
        }
    }
    return { hasMoves: false, check: isCheck(color) };
}

function checkmate(color) {
    /// called on checkmate
    var c = ["White", "Black"][color];
    var PGN = outPGN();
    if (confirm("Oh no! " + c + " lost. Here's the game's PGN: " + PGN + " Would you like to reset the board and start a new game?")) {
        resetBoard();
    }
}

function draw() {
    /// called on draw
    var PGN = outPGN();
    if (confirm("Looks like it's a draw. Here's the game's PGN: " + PGN + " Would you like to reset the board and start a new game?")) {
        resetBoard();
    }
}

function resetHand() {
    /// resets hand
    hand = { piece: undefined, from: undefined };
}

function resetBoard() {
    /// resets board to default FEN
    loadFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    game.moves = [];
    game.currentFrame = 0;
    resetHand();
}

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

// io functions

function loadPGN(PGN) {
    /// loads a PGN

    //parse tag pairs
    var tagPairs = findSubtringPairsBetweenChars(PGN, "[", "]");
    var tags = {};
    for (var i = 0; i < tagPairs.length; i++) {
        var pair = tagPairs[i];
        var key = pair.slice(0, pair.indexOf("\"")).trim();
        var value = findSubtringPairsBetweenChars(pair, "\"", "\"", 1)[0];
        tags[key] = value;
    }
    PGN = PGN.slice(PGN.lastIndexOf("]") + 1, PGN.length);

    //parse moves
    var parsedMoves = [];

    PGN = removeComments(PGN, "{", "}");

    var splitMoves = PGN.split(" ");
    if (tags["FEN"] == undefined) {
        tags["FEN"] = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
    if (splitMoves[splitMoves.length - 1] == tags["Result"]) {
        splitMoves = splitMoves.slice(0, splitMoves.length - 1);
    }
    var newBoard = parseFEN(tags["FEN"]);
    var piecesList = ["K", "Q", "R", "B", "N"];

    var color = 1;
    for (var i = 0; i < splitMoves.length; i++) {
        var m = splitMoves[i];
        if (m.length == 0 || m.includes(".")) {
            continue;
        }
        color++;
        color %= 2;
        var moveType = Moves.STD;
        var move = new Move();
        var isEnPassant = false;
        move.color = color;
        var state = { hasMoves: true, check: false };
        if (m.endsWith("+")) {
            state.check = true;
            m = m.slice(0, m.length - 1);
        } else if (m.endsWith("#")) {
            state.check = true;
            state.hasMoves = false;
            m = m.slice(0, m.length - 1);
        } else if (m.includes("O-O")) {
            //castle
            var kingOffset;
            var rOffset;
            var rPos;
            moveType = Moves.CASTLE;
            if (m == "O-O") {
                //castle short
                kingOffset = 2;
                rPos = 7;
                rOffset = -2;
            } else if (m == "O-O-O") {
                //castle long
                kingOffset = -2;
                rPos = 0;
                rOffset = 3;
            } 
            move.from = findKing(newBoard.tiles, color);
            move.intFrom = fromChessNotation(move.from);
            move.intTo = new IntPos(move.intFrom.x + kingOffset, move.intFrom.y);
            move.to = toChessNotation(move.intTo);
            move.castle = { 
                f: toChessNotation(new IntPos(rPos, move.intFrom.y)), 
                t: toChessNotation(new IntPos(rPos + rOffset, move.intFrom.y))
            };
            move.type = Pieces.KING;
            parsedMoves.push({ type: moveType, move: move, state: state });
            newBoard.tiles[move.from] = undefined;
            newBoard.tiles[move.castle.f] = undefined;
            newBoard.tiles[move.to] = new Piece(Pieces.KING, color);
            newBoard.tiles[move.castle.t] = new Piece(Pieces.ROOK, color);
            continue;
        }
        if (m.includes("=")) {
            //promotion
            var prom = m.split("=");
            move.promotion = piecesList.indexOf(prom[1]);
            m = prom[0];
        }
        move.to = m.slice(m.length - 2, m.length);
        move.intTo = fromChessNotation(move.to);
        m = m.replace(move.to, "");
        if (m.endsWith("x")) {
            //capture
            move.isCapture = true;
            if (newBoard.tiles[move.to] == undefined) {
                //en passant 
                var capture;
                if (color == 0) {
                    capture = toChessNotation(new IntPos(move.intTo.x, move.intTo.y - 1));
                } else {
                    capture = toChessNotation(new IntPos(move.intTo.x, move.intTo.y + 1));
                }
                isEnPassant = true;
                move.enpassantCapture = capture;
                move.enpassantCapturePiece = copyObj(newBoard.tiles[capture]);
            } else {
                move.capturedPiece = copyObj(newBoard.tiles[move.to]);
            }
            m = m.slice(0, m.length - 1);
        }
        for (var p in piecesList) {
            if (m.includes(piecesList[p])) {
                move.type = Number(p);
                m = m.replace(piecesList[p], "");
            }
        }
        if (move.type == undefined) {
            move.type = Pieces.PAWN;
        }
        //from
        var tlz = keys(newBoard.tiles);
        for (var j = 0; j < tlz.length; j++) {
            if (move.from != undefined) {
                continue;
            }
            var t = tlz[j];
            var tile = newBoard.tiles[t];
            var pos = fromChessNotation(t);
            if (tile == undefined || tile.color != color || tile.type != move.type) {
                continue;
            }
            if (m.length == 1 && pos.x != ["a", "b", "c", "d", "e", "f", "g", "h"].indexOf(m)) {
                continue;
            }
            var valid = isMoveValid(t, move.to, tile.type, tile.color, newBoard.tiles, true, false, isEnPassant);
            if (valid.valid) {
                move.from = t;
                move.intFrom = pos;
                break;
            }
        }
        if (move.promotion != undefined) {
            var temp = move.type;
            move.type = move.promotion;
            move.promotion = temp;
        }
        newBoard.tiles[move.from] = undefined;
        newBoard.tiles[move.to] = new Piece(move.type, color);
        parsedMoves.push({ type: moveType, move: move, state: state });
    }
    resetBoard();
    game.moves = parsedMoves;
}

function outPGN() {
    /// returns the game's PGN
    var parsedMoves = [];
    for (var i in game.moves) {
        var intI = Number(i);
        if (intI % 2 == 0) {
            var moveNumberStr = String(intI / 2 + 1);
            parsedMoves.push(moveNumberStr + ".");
        }
        var m = game.moves[i];
        var move = m.move;
        if (m.type == Moves.CASTLE) {
            var side = fromChessNotation(move.castle.f).x;
            if (side == 0) {
                //queenside
                parsedMoves.push("O-O-O");
            } else {
                //kingside
                parsedMoves.push("O-O");
            }
        } else {
            var parsedMove = [];
            if (move.promotion != undefined) {
                move.type = Pieces.PAWN;
            }
            parsedMove.push(["K", "Q", "R", "B", "N", ""][move.type]);
            if ([Pieces.ROOK, Pieces.KNIGHT].includes(move.type) || (move.type == Pieces.PAWN && move.isCapture)) {
                parsedMove.push(move.from[0]);
            }
            if (move.isCapture) {
                //capture
                parsedMove.push("x");
            }
            parsedMove.push(move.to);
            if (move.promotion != undefined) {
                parsedMove.push("=");
                parsedMove.push(["K", "Q", "R", "B", "N", ""][move.promotion]);
            }
            if (m.state.check) {
                if (!m.state.hasMoves) {
                    //checkmate
                    parsedMove.push("#");
                } else {
                    //check
                    parsedMove.push("+");
                }
            }
            var moveStr = parsedMove.join("");
            parsedMoves.push(moveStr);
        }
    }


    var out = parsedMoves.join(" ");
    return out;
}

function parseFEN(FEN) {
    /// parses a FEN
    var splitfen = FEN.split(" ");
    splitfen[0] = replaceNums(splitfen[0]);
    var newBoard = {tiles:{}};
    var tiles = splitfen[0].split("/");

    for (var row = 0; row < tiles.length; row++) {
        var c = tiles[row];
        for (var col = 0; col < c.length; col++) {
            var t = c.charAt(col);
            if (t != "-") {
                var color = floor((t.charCodeAt(0) - 65) / 32);
                var type = { k: Pieces.KING, q: Pieces.QUEEN, r: Pieces.ROOK, b: Pieces.BISHOP, n: Pieces.KNIGHT, p: Pieces.PAWN }[t.toLowerCase()];
                var xy = toChessNotation(new IntPos(col, game.size - row - 1));
                newBoard.tiles[xy] = new Piece(type, color);
            }
        }
    }
    if (splitfen[1] == "w") {
        newBoard.turn = Colors.WHITE;
    } else {
        newBoard.turn = Colors.BLACK;
    }
    newBoard.castle = [{ left: true, right: true }, { left: true, right: true }];
    newBoard.enpassant = splitfen[3];
    return newBoard;
}

function loadFEN(FEN) {
    /// loads a FEN
    board = parseFEN(FEN);
}

function outFEN() {
    /// returns the current FEN
    var FEN = [];
    var FENboard = [];
    for (var col = game.size - 1; col >= 0; col--) {
        var FENrow = "";
        var empty = 0;
        for (var row = 0; row < game.size; row++) {
            var pos = toChessNotation(new IntPos(row, col));
            var tile = board.tiles[pos];
            if (tile != undefined) {
                var t = ["k", "q", "r", "b", "n", "p"][tile.type];
                if (tile.color == 0) {
                    t = t.toUpperCase();
                }
                if (empty > 0) {
                    FENrow += String(empty);
                    empty = 0;
                }
                FENrow += t;
            } else {
                empty++;
            }
        }
        if (empty > 0) {
            FENrow += String(empty);
            empty = 0;
        }
        FENboard.push(FENrow);
    }
    var fboard = FENboard.join("/");
    FEN.push(fboard);

    FEN.push(["w", "b"][board.turn]);

    var fcastling = "";
    if (board.castle[0].left) {
        fcastling += "K";
    }
    if (board.castle[0].right) {
        fcastling += "Q";
    }
    if (board.castle[1].left) {
        fcastling += "k";
    }
    if (board.castle[1].right) {
        fcastling += "q";
    }
    FEN.push(fcastling);

    FEN.push(board.enpassant);

    var halfmoves = "0";
    FEN.push(halfmoves);

    var fullmoves = String(1 + floor(game.moves.length / 2));
    FEN.push(fullmoves);

    var out = FEN.join(" ");
    return out;
}

//button functions

function loadPGNButton() {
    /// loads user prompted PGN
    var PGN = prompt("Enter a PGN to load");
    if (PGN != false) {
        loadPGN(PGN);
    }
}

function outPGNButton() {
    /// alerts current PGN
    alert(outPGN());
}

function loadFENButton() {
    /// loads user prompted FEN
    var FEN = prompt("Enter a FEN to load");
    if (FEN != false) {
        loadFEN(FEN);
    }
}

function outFENButton() {
    /// alerts current FEN
    alert(outFEN());
}

function swapView() {
    /// swaps view from black to white or vice versa
    graphics.view++;
    graphics.view %= 2;
}

function forward() {
    /// increments the view forward
    if (game.currentFrame < game.moves.length) {
        var m = game.moves[game.currentFrame];
        var move = m.move;
        movePiece(move.from, move.to, move.type, move.color);
        if (move.enpassantCapture != undefined) {
            board.tiles[move.enpassantCapture] = undefined;
        }
        if (m.type == Moves.CASTLE) {
            movePiece(move.castle.f, move.castle.t, Pieces.ROOK, move.color);
        }
        game.currentFrame++;
    }
}

function back() {
    /// decrements the view backward
    if (game.currentFrame > 0) {
        var m = game.moves[game.currentFrame - 1];
        var move = m.move;
        movePiece(move.to, move.from, move.type, move.color);
        if (move.isCapture) {
            board.tiles[move.to] = move.capturedPiece;
        }
        if (move.enpassantCapture != undefined) {
            board.tiles[move.enpassantCapture] = move.enpassantCapturePiece;
        }
        if (move.promotion != undefined) {
            board.tiles[move.from].type = move.promotion;
        }
        if (m.type == Moves.CASTLE) {
            movePiece(move.castle.t, move.castle.f, Pieces.ROOK, move.color);
        }
        game.currentFrame--;
    }
}

function reset() {
    /// resets the board on user confirm
    var confirmed = confirm("Are you sure you want to reset board?");
    if (confirmed) {
        resetBoard();
    }
}

//events

function onMouseDown(e) {
    /// onMouseDown, calls mouseToggle
    mouseToggle(e, MouseState.DOWN);
}

function onMouseUp(e) {
    /// onMouseUp, calls mouseToggle
    mouseToggle(e, MouseState.UP);
}

function onKeyDown(e) {
    /// binds keys to button functions
    switch (e.key) {
        case "ArrowLeft":
            back();
            break;
        case "ArrowRight":
            forward();
            break;
    }
}

function onPieceMove(move) {
    /// called when a piece moves, swaps turn, invalidates castle, adds to moves list, ends game, etc
    if (move.type == Pieces.PAWN && abs(move.intTo.y - move.intFrom.y) == 2) {
        board.enpassant = toChessNotation(pieceRange(move.intFrom, move.intTo)[0]);
    } else {
        board.enpassant = undefined;
    }
    tryInvalidateCastle(move.from, move.type, move.color);
    if (board.turn == Colors.WHITE) {
        board.turn = Colors.BLACK;
    } else {
        board.turn = Colors.WHITE;
    }
    game.validMoves = {};
    game.currentFrame++;
    resetHand();
    drawBoard();
    var state = evaluateGameStatus(board.tiles, move.color);

    
    if (move.castle != undefined) {
        movePiece(move.castle.f, move.castle.t, Pieces.ROOK, move.color);
        game.moves.push({ type: Moves.CASTLE, move: move, state: state });
    } else {
        game.moves.push({ type: Moves.STD, move: move, state: state });
    }

    if (!state.hasMoves) {
        if (state.check) {
            checkmate((color + 1) % 2);
        } else {
            draw();
        }
    }
}

// enums

var Pieces = { KING: 0, QUEEN: 1, ROOK: 2, BISHOP: 3, KNIGHT: 4, PAWN: 5 };
var Colors = { WHITE: 0, BLACK: 1 };
var MouseState = { UP: 0, DOWN: 1 };
var Moves = { STD: 0, CASTLE: 1, RESULT: 2 };

// constructors

function Piece(type, color) {
    /// a piece is what is stored in the board.tiles object
    this.type = type;
    this.color = color;
}

function Button(func, img) {
    /// a button is an object that when clicked calls the func
    this.func = func;
    this.img = img;
}

function Move(from, to, intFrom, intTo, type, color, castle, enpassantCapture, enpassantCapturePiece, isCapture, capturedPiece) {
    /// a move is stored in the moves list, and allows PGN outout, going backwards and going forwards
    this.from = from;
    this.to = to;
    this.intFrom = intFrom;
    this.intTo = intTo;
    this.type = type;
    this.color = color;
    this.castle = castle;
    this.enpassantCapture = enpassantCapture;
    this.enpassantCapturePiece = enpassantCapturePiece;
    this.promotion = undefined;
    this.isCapture = isCapture;
    this.capturedPiece = capturedPiece;
}

function IntPos(x, y) {
    /// x y object
    this.x = x;
    this.y = y;
}

// starts game

resetBoard();
background(graphics.colorBackground);
var f = 0;
function animate() {
    // poll if size has changed
    if (f % 10 == 0 && canvas.width != cache.ccanvas.width || canvas.height != cache.ccanvas.height) {
        updateCanvasSize();
    }
    // draw board
    drawBoard();
    f++;
}