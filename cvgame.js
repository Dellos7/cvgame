
const XPLAYER_DEFAULT = 200;
const PLAYER_WIDTH_DEFAULT = 30;
const PLAYER_HEIGHT_DEFAULT = 30;
const PLAYER_FILLCOLOR_DEFAULT = "red";
const X_PX_MOVE_LEFT_RIGHT = 30;
const JUMP_HEIGHT = 150;
const Y_PX_JUMP = 9;
const Y_PX_DUCK = 15;

const X_DEBUGLINE1 = 150;
const ENABLE_FREEMOVE_ZONE = false;

const ENEMIE_WIDHT_DEFAULT = 15;
const ENEMIE_HEIGHT_DEFAULT = 15;

var canvas;
var context;
var xPlayer, yPlayer;
var yPlayerDefault;
var doJump = false;
var doDuck = false;
var x_debugline2;
var timelineX;
var gameOver = false;

var cvGameData = {
    'startYear': '1994',
    'endYear': '1997',
    'years': [
        {
            'year': '1994',
            'difficulty': 0
        },
        {
            'year': '1995',
            'difficulty': 0
        },
        {
            'year': '1996',
            'difficulty': 0
        },
        {
            'year': '1997',
            'difficulty': 3
        }
    ]
};

var currentYear;
var currentMonth;
var startYear;
var endYear;
var currentDifficulty;

const SLOW = 1;
const NORMAL = 2;
const FAST = 3;
var gameSpeed = SLOW;
var pxPerYear = 1000;
var pxPerYearWithSpeed = pxPerYear / gameSpeed;
var months = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 
'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ];
var numberOfMonthsInYear = months.length;
var pxPerMonth = pxPerYearWithSpeed / numberOfMonthsInYear;

var enemieRespawnFixedTimeout = 5000 / gameSpeed;
var enemieRespawnRandom = Math.random();

var currentEnemies;

var setUpGame = function() {
    canvas = $('#cvGame')[0];
    context = canvas.getContext('2d');
    xPlayer = XPLAYER_DEFAULT;
    yPlayer = canvas.height - PLAYER_HEIGHT_DEFAULT - 5;
    timelineX = 0;
    currentEnemies = [];

    yPlayerDefault = yPlayer;
    x_debugline2 = canvas.width - X_DEBUGLINE1*3;
    keyboardEvents();
    runGame();
    //looseEnemies();
};

var resetGame = function() {
    xPlayer = XPLAYER_DEFAULT;
    yPlayer = canvas.height - PLAYER_HEIGHT_DEFAULT - 5;
    timelineX = 0;
    currentEnemies = [];
    gameOver = false;
    currentYear = undefined;
    currentMonth = undefined;
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
    game();
};

var game = function() {
    if( !gameOver ) {
        handlePlayerJump();
        handlePlayerDuck();
        readGameData();
        looseEnemies();
    }
};

var readGameData = function() {
    initializeGameDataVariables();
    passOfTheTime();
    setUpCurrentDifficulty();
};

var initializeGameDataVariables = function() {
    if( !currentYear ) {
        currentYear = cvGameData.startYear;
    }
    if( !startYear ) {
        startYear = cvGameData.years[0];
    }
    if( !endYear ) {
        endYear = cvGameData.years[cvGameData.years.length - 1];
    }
};

var passOfTheTime = function() {
    var currentYearAndMonth = calcCurrentYearAndMonth();
    currentYearNumber = currentYearAndMonth.year;
    currentMonthNumber = currentYearAndMonth.month;
    setUpCurrentYear(currentYearNumber);
    setUpCurrentMonth(currentMonthNumber);
    setYearAndMonthInUI(currentYear.year, currentMonth);
};

var setUpCurrentDifficulty = function() {
    currentDifficulty = currentYear.difficulty;
};

var calcCurrentYearAndMonth = function() {
    var positiveTimelineX = (timelineX < 0 ? timelineX * (-1) : timelineX);
    if( positiveTimelineX > 0 ) {
        var numberOfMonthWithoutYear = Math.ceil( positiveTimelineX / pxPerMonth );
        var numberOfYear = Math.ceil( numberOfMonthWithoutYear / numberOfMonthsInYear );
        var numberOfMonth = (numberOfMonthWithoutYear % numberOfMonthsInYear != 0 ? numberOfMonthWithoutYear % numberOfMonthsInYear : 12);
    }
    else {
        var numberOfYear = 1;
        var numberOfMonth = 1;
    }
    return {
        'year': numberOfYear,
        'month': numberOfMonth
    };
};

var setUpCurrentYear = function(yearNumber) {
    currentYear = cvGameData.years[yearNumber - 1];
};

var setUpCurrentMonth = function(monthNumber) {
    currentMonth = months[monthNumber - 1];
};

var setYearAndMonthInUI = function(year, month) {
    context.beginPath();
	context.font = 'bold 10pt Arial'
    context.fillStyle = '#000';
    context.fillText( month + ', ' + year , 10, 15);
};

var looseEnemies = function() {
    if( shouldLooseNewEnemie() ) {
        looseNewEnemie();
    }
    moveCurrentEnemies();
};

var shouldLooseNewEnemie = function() {
    var mRandom = Math.random();
    var looseNewEnemieRandom = Math.random();
    currentDifficulty = 10; //REMOVE
    //Generating a range that depends on the difficulty of the year
    var range = 1/(100*((10-currentDifficulty)+1));
    return looseNewEnemieRandom >= (mRandom-range) && (mRandom+range) >= looseNewEnemieRandom;
};

var looseNewEnemie = function() {
    var lNewEnemie = true;
    //Do not allow to loose enemies too close
    if( currentEnemies.length > 0 && currentEnemies[currentEnemies.length-1] ) {
        var lastEnemieX = currentEnemies[currentEnemies.length-1].x;
        if( lastEnemieX && (canvas.width - PLAYER_WIDTH_DEFAULT - 50) <= lastEnemieX ) {
            lNewEnemie = false;
        }
    }

    if( lNewEnemie ) {
        context.beginPath();
        context.fillStyle = "blue";
        var defaultX = canvas.width - 10;
        var defaultY = getRandomArbitrary(canvas.height - ENEMIE_HEIGHT_DEFAULT, canvas.height - JUMP_HEIGHT);
        context.fillRect( canvas.width - 10, defaultY, ENEMIE_WIDHT_DEFAULT, ENEMIE_HEIGHT_DEFAULT );
        currentEnemies.push({
            'x': defaultX,
            'y': defaultY
        });
    }
};

var enemieTouchedPlayer = function(theEnemie) {
    var eTouchedP = (xPlayer + PLAYER_WIDTH_DEFAULT/2) > (theEnemie.x - ENEMIE_WIDHT_DEFAULT/2)
    &&
    (xPlayer - (PLAYER_WIDTH_DEFAULT/2-1)) < (theEnemie.x + (ENEMIE_WIDHT_DEFAULT/2-1)) 
    && 
    (yPlayer - (PLAYER_HEIGHT_DEFAULT/2-1)) < (theEnemie.y + (ENEMIE_HEIGHT_DEFAULT/2-1))
    &&
    (yPlayer + (PLAYER_HEIGHT_DEFAULT/2-1)) > (theEnemie.y - (ENEMIE_HEIGHT_DEFAULT/2-1));
    return eTouchedP;
};

var moveCurrentEnemies = function() {
    var toRemove = [];
    $.each( currentEnemies, function(index, enemie) {
        context.beginPath();
        context.fillStyle = "blue";
        var enemieSpeed = getEnemieSpeed(); //Should be kind of random
        context.fillRect( enemie.x - enemieSpeed, enemie.y, ENEMIE_WIDHT_DEFAULT, ENEMIE_HEIGHT_DEFAULT );
        enemie.x -= enemieSpeed;
        if( enemie.x <= 0 ) {
            toRemove.push(index);
        }
        if( enemieTouchedPlayer(enemie) ) {
            gameOver = true;
        }
    });
    //Remove enemies that have disappeared
    for(var i = 0; i < toRemove.length; i++) {
        currentEnemies.splice(toRemove[i], 1);
    }
};

//Should be kind of random
var getEnemieSpeed = function() {
    return 5;
};

var getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
};

var drawDebugLines = function() {
    if( ENABLE_FREEMOVE_ZONE ) {
        context.beginPath();
        context.moveTo(X_DEBUGLINE1, 0);
        context.lineTo(X_DEBUGLINE1, canvas.height);
        context.stroke();
    
        context.beginPath();
        context.moveTo(x_debugline2, 0);
        context.lineTo(x_debugline2, canvas.height);
        context.stroke();
    }
};

var drawPlayer = function() {
    context.beginPath();
    context.fillStyle = PLAYER_FILLCOLOR_DEFAULT;
    context.fillRect( xPlayer, yPlayer, PLAYER_WIDTH_DEFAULT, PLAYER_HEIGHT_DEFAULT );
};

var handlePlayerJump = function() {
    if( !doDuck ) {
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
    }
};

var handlePlayerDuck = function() {
    if( doDuck ) {
        yPlayer += Y_PX_DUCK;
        if( yPlayer > yPlayerDefault ) {
            doDuck = false;
            doJump = false;
            yPlayer = yPlayerDefault;
        }
    }
};

var jump = function() {
    if( yPlayer === yPlayerDefault ) {
        doJump = true;
    }
};

var duck = function() {
    doDuck = true;
};

var moveForward = function() {
    if( ENABLE_FREEMOVE_ZONE && xPlayer + X_PX_MOVE_LEFT_RIGHT < x_debugline2 ) {
        xPlayer += X_PX_MOVE_LEFT_RIGHT;
    }
    else {
        timelineX -= X_PX_MOVE_LEFT_RIGHT;
    }
};

var moveBackward = function() {
    if( ENABLE_FREEMOVE_ZONE && xPlayer - X_PX_MOVE_LEFT_RIGHT > X_DEBUGLINE1 ) {
        xPlayer -= X_PX_MOVE_LEFT_RIGHT;
    }
    else if( timelineX <= 0 ) { //Do not allow to move backwards the start
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
            if( e.keyCode === 32 && gameOver ) {
                resetGame();
            }
            else {
                jump();
            }
        }
        if( e.keyCode === 40 ) { //Down arrow
            duck();
        }
        if( e.keyCode === 37 ) { //Left arrow
            moveBackward();
        }
        if( e.keyCode === 39 ) { //Right arrow
            moveForward();
        }
    };
};