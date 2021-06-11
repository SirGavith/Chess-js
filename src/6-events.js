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
            checkmate((move.color + 1) % 2);
        } else {
            draw();
        }
    }
}