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