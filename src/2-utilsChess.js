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