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