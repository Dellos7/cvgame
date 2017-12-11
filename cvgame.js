
const XPLAYER_DEFAULT = 200;
const PLAYER_WIDTH_DEFAULT = 30;
const PLAYER_HEIGHT_DEFAULT = 30;
const PLAYER_FILLCOLOR_DEFAULT = "red";
const X_PX_MOVE_LEFT_RIGHT = 30;
const JUMP_HEIGHT = 150;
const Y_PX_JUMP = 9;
const X_DEBUGLINE1 = 100;

var canvas;
var context;
var xPlayer, yPlayer;
var yPlayerDefault;
var doJump = false;
var x_debugline2;
var timelineX;

var setUpGame = function() {
    canvas = $('#cvGame')[0];
    context = canvas.getContext('2d');
    xPlayer = XPLAYER_DEFAULT;
    yPlayer = canvas.height - PLAYER_HEIGHT_DEFAULT - 5;;
    timelineX = 0;

    yPlayerDefault = yPlayer;
    x_debugline2 = canvas.width - X_DEBUGLINE1*3;
    keyboardEvents();
    runGame();
};

var runGame = function() { 
    requestAnimationFrame( runGame );
    resetCanvas();
    draw();
};

var draw = function() {
    drawDebugLines();
    drawPlayer();
    drawTestSquare();
    handlePlayerJump();
};

var drawDebugLines = function() {
    context.beginPath();
    context.moveTo(X_DEBUGLINE1, 0);
    context.lineTo(X_DEBUGLINE1, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(x_debugline2, 0);
    context.lineTo(x_debugline2, canvas.height);
    context.stroke();
};

var drawPlayer = function() {
    context.beginPath();
    context.fillStyle = PLAYER_FILLCOLOR_DEFAULT;
    context.fillRect( xPlayer, yPlayer, PLAYER_WIDTH_DEFAULT, PLAYER_HEIGHT_DEFAULT );
};

var handlePlayerJump = function() {
    if( doJump && ( yPlayer > yPlayerDefault - JUMP_HEIGHT ) ) {
        yPlayer -= Y_PX_JUMP;
    }
    if( doJump && ( yPlayer <= yPlayerDefault - JUMP_HEIGHT ) ) {
        yPlayer += Y_PX_JUMP;
        doJump = false;
    }
    if( !doJump && ( yPlayer < yPlayerDefault ) ) {
        yPlayer += Y_PX_JUMP;
    }
};

var jump = function() {
    if( yPlayer === yPlayerDefault ) {
        doJump = true;
    }
};

var moveForward = function() {
    if( xPlayer + X_PX_MOVE_LEFT_RIGHT < x_debugline2 ) {
        xPlayer += X_PX_MOVE_LEFT_RIGHT;
    }
    else {
        timelineX -= X_PX_MOVE_LEFT_RIGHT;
    }
};

var moveBackward = function() {
    if( xPlayer - X_PX_MOVE_LEFT_RIGHT > X_DEBUGLINE1 ) {
        xPlayer -= X_PX_MOVE_LEFT_RIGHT;
    }
    else {
        timelineX += X_PX_MOVE_LEFT_RIGHT;
    }
};

var resetCanvas = function() {
	context.beginPath();
	context.fillStyle = "#C9C9C9";
	context.fillRect( 0, 0, 700, 250 );
};

var drawTestSquare = function() {
    var testSquare_x = 500;
    var testSquare_y = 50;
    testSquare_x += timelineX;
    context.beginPath();
    context.fillStyle = "green";
    context.fillRect( testSquare_x, testSquare_y, 50, 50 );
};

var keyboardEvents = function() {
    document.onkeydown = function(e) { 
        e = e || window.event;
        if( e.keyCode === 38 || e.keyCode === 32 ) { //Up arrow or spacebar
            jump();
        }
        if( e.keyCode === 40 ) { //Down arrow

        }
        if( e.keyCode === 37 ) { //Left arrow
            moveBackward();
        }
        if( e.keyCode === 39 ) { //Right arrow
            moveForward();
        }
    };
};