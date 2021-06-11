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