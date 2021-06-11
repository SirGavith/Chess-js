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