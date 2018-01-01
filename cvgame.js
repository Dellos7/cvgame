
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
            'difficulty': 100,
            'achievements': [
                {
                    'name': 'Primaria',
                    'month': 2
                },
                {
                    'name': 'Primaria',
                    'month': 3
                },
                {
                    'name': 'Secundaria',
                    'month': 10
                }
            ]
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
//var pxPerMonth = pxPerYearWithSpeed / numberOfMonthsInYear;
var pxPerMonth;

var enemieRespawnFixedTimeout = 5000 / gameSpeed;
var enemieRespawnRandom = Math.random();

var currentEnemies;
var achievements;

//Set up variables for initialization of the game
var setUpGame = function() {
    canvas = $('#cvGame')[0];
    context = canvas.getContext('2d');
    xPlayer = XPLAYER_DEFAULT;
    yPlayer = canvas.height - PLAYER_HEIGHT_DEFAULT - 5;
    timelineX = 0;
    currentEnemies = [];
    achievements = [];

    pxPerMonth = canvas.width; //Each month fills the screen

    yPlayerDefault = yPlayer;
    x_debugline2 = canvas.width - X_DEBUGLINE1*3;
    keyboardEvents();
    runGame();
    tests();
};

var tests = function() {
    var enemie = {
        x: xPlayer,
        y: yPlayer - (ENEMIE_HEIGHT_DEFAULT+5)
    };
    console.log('YPLAYER: ' + yPlayer);
    console.log('XPLAYER: ' + xPlayer);
    console.log('YENEMIE:' + enemie.y);
    console.log('XENEMIE: ' + enemie.x);
    console.log('player height default: ' + PLAYER_HEIGHT_DEFAULT);
    console.log('player width default: ' + PLAYER_WIDTH_DEFAULT);
    console.log('enemie height default: ' + ENEMIE_HEIGHT_DEFAULT);
    console.log('enemie width default: ' + ENEMIE_WIDHT_DEFAULT);
    console.log(enemieTouchedPlayer(enemie));
    console.log('1x: ' + (xPlayer + PLAYER_WIDTH_DEFAULT/2) + ';>; ' + (enemie.x - ENEMIE_WIDHT_DEFAULT/2));
    console.log('2x: ' + (xPlayer - (PLAYER_WIDTH_DEFAULT/2-1)) + ';<; ' + (enemie.x + (ENEMIE_WIDHT_DEFAULT/2-1)) );
    console.log('3y: ' + (yPlayer - (PLAYER_HEIGHT_DEFAULT/2-1)) + ';<; ' + (enemie.y + (ENEMIE_HEIGHT_DEFAULT/2-1)));
    console.log('4y: ' + (yPlayer + (PLAYER_HEIGHT_DEFAULT/2-1)) + ';>; ' + (enemie.y - (ENEMIE_HEIGHT_DEFAULT/2-1)));
};

//Reset game variables to start again
var resetGame = function() {
    xPlayer = XPLAYER_DEFAULT;
    yPlayer = canvas.height - PLAYER_HEIGHT_DEFAULT - 5;
    timelineX = 0;
    currentEnemies = [];
    gameOver = false;
    currentYear = undefined;
    currentMonth = undefined;
};

//This function gets executed each frame with the 'requestAnimationFrame' call
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

//Game handling
var game = function() {
    if( !gameOver ) {
        handlePlayerJump();
        handlePlayerDuck();
        readGameData();
        looseEnemies();
        looseAchievements();
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

//This function will handle the pass of the time simulation
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

//Calculates current year and month from the timelineX variable
//Depends on the pixels that we've set up per month of year
var calcCurrentYearAndMonth = function() {
    //The timelineX variable is usually negative, as the player moves in the time
    //Starts in 0 -> -10, -20, -30... so we can know how much the player has proceeded
    var positiveTimelineX = (timelineX < 0 ? timelineX * (-1) : timelineX);
    if( positiveTimelineX > 0 ) {
        //Ex. starting point it's 1994, and we are in Feb. 1995 --> would be the month 14
        var numberOfMonthWithoutYear = Math.ceil( positiveTimelineX / pxPerMonth );
        var numberOfYear = Math.ceil( numberOfMonthWithoutYear / numberOfMonthsInYear );
        //Number of the month in the year
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

var getCurrentMonthNumber = function() {
    return months.indexOf(currentMonth);
};

//Draws the current year and month in the canvas UI
var setYearAndMonthInUI = function(year, month) {
    context.beginPath();
	context.font = 'bold 10pt Arial'
    context.fillStyle = '#000';
    context.fillText( month + ', ' + year , 10, 15);
};

//Loose the enemies in the game
var looseEnemies = function() {
    if( shouldLooseNewEnemie() ) {
        looseNewEnemie();
    }
    moveCurrentEnemies();
};

//It decides if an enemie should be loosed each frame of the game
//Depends on the difficulty of the current year
var shouldLooseNewEnemie = function() {
    var mRandom = Math.random();
    var looseNewEnemieRandom = Math.random();
    //currentDifficulty = 10; //REMOVE
    //Generating a range that depends on the difficulty of the year
    //var range = 1/(100*((10-currentDifficulty)+1));
    var range = 1/(10*((100-currentDifficulty)+1));
    return looseNewEnemieRandom >= (mRandom-range) && (mRandom+range) >= looseNewEnemieRandom;
};

//Looses a new enemie
var looseNewEnemie = function() {
    var lNewEnemie = true;
    //Do not allow to loose enemies too close
    if( currentEnemies.length > 0 && currentEnemies[currentEnemies.length-1] ) {
        var lastEnemieX = currentEnemies[currentEnemies.length-1].x;
        if( lastEnemieX && (canvas.width - PLAYER_WIDTH_DEFAULT - 50) <= lastEnemieX ) {
            lNewEnemie = false;
        }
    }

    //Draws a new enemie and pushes it to the enemies array
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

//Calculates if the enemie touched the player
/*var enemieTouchedPlayer = function(theEnemie) {
    var eTouchedP = 
    //Enemie is at the right
    (xPlayer + PLAYER_WIDTH_DEFAULT/2) > (theEnemie.x - ENEMIE_WIDHT_DEFAULT/2)
    &&
    //Enemie is at the left
    (xPlayer - (PLAYER_WIDTH_DEFAULT/2-1)) < (theEnemie.x + (ENEMIE_WIDHT_DEFAULT/2-1)) 
    &&
    //Enemie is at the top 
    (yPlayer - (PLAYER_HEIGHT_DEFAULT/2-1)) < (theEnemie.y + (ENEMIE_HEIGHT_DEFAULT/2-1))
    &&
    //Enemie is at the bottom
    (yPlayer + (PLAYER_HEIGHT_DEFAULT/2-1)) > (theEnemie.y - (ENEMIE_HEIGHT_DEFAULT/2-1));
    return eTouchedP;
};*/
var enemieTouchedPlayer = function(theEnemie) {
    var eTouchedP = 
    //Enemie is at the right
    (xPlayer + PLAYER_WIDTH_DEFAULT) > (theEnemie.x)
    &&
    //Enemie is at the left
    (xPlayer) < (theEnemie.x + (ENEMIE_WIDHT_DEFAULT)) 
    &&
    //Enemie is at the top 
    (yPlayer) < (theEnemie.y + (ENEMIE_HEIGHT_DEFAULT))
    &&
    //Enemie is at the bottom
    (yPlayer + (PLAYER_HEIGHT_DEFAULT)) > (theEnemie.y);
    return eTouchedP;
};

//Moves all the enemies in the screen in each frame of the game
//If an enemie arrives to the end, removes it from the array of enemies
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
            console.log('YPLAYER: ' + yPlayer);
            console.log('XPLAYER: ' + xPlayer);
            console.log('YENEMIE:' + enemie.y);
            console.log('XENEMIE: ' + enemie.x);
            console.log('player height default: ' + PLAYER_HEIGHT_DEFAULT);
            console.log('player width default: ' + PLAYER_WIDTH_DEFAULT);
            console.log('enemie height default: ' + ENEMIE_HEIGHT_DEFAULT);
            console.log('enemie width default: ' + ENEMIE_WIDHT_DEFAULT);
            console.log('1x: ' + (xPlayer + PLAYER_WIDTH_DEFAULT/2) + ';>; ' + (enemie.x - ENEMIE_WIDHT_DEFAULT/2));
            console.log('2x: ' + (xPlayer - (PLAYER_WIDTH_DEFAULT/2-1)) + ';<; ' + (enemie.x + (ENEMIE_WIDHT_DEFAULT/2-1)) );
            console.log('3y: ' + (yPlayer - (PLAYER_HEIGHT_DEFAULT/2-1)) + ';<; ' + (enemie.y + (ENEMIE_HEIGHT_DEFAULT/2-1)));
            console.log('4y: ' + (yPlayer + (PLAYER_HEIGHT_DEFAULT/2-1)) + ';>; ' + (enemie.y - (ENEMIE_HEIGHT_DEFAULT/2-1)));
            gameOver = true;
        }
    });
    //Remove enemies that have disappeared
    for(var i = 0; i < toRemove.length; i++) {
        currentEnemies.splice(toRemove[i], 1);
    }
};

var looseAchievements = function() {
    if( currentYear && currentMonth ) {
        var currentYearAchievements = currentYear.achievements;
        var currentMonthNumber = getCurrentMonthNumber();
        var thisMonthAchievements = [];
        if( currentYearAchievements ) {
            $.each( currentYearAchievements, function(index, achievement) {
                if( achievement && achievement.month === currentMonthNumber && !achievement.loosed ) {
                    thisMonthAchievements.push(achievement);
                    achievement.loosed = true;
                    achievement.x = canvas.width;
                    achievement.y = yPlayerDefault;
                    achievement.defaultTimelineX = timelineX;
                }
            });
            achievements = achievements.concat(thisMonthAchievements);
        }
    }

    moveAchievements();
};

var moveAchievements = function() {
    $.each( achievements, function(index, achievement) { //X_PX_MOVE_LEFT_RIGHT
        var xMove = timelineX - achievement.defaultTimelineX;
        context.beginPath();
        context.fillStyle = "orange";
        context.fillRect( achievement.x + xMove, 50, 50, 50 );
    });
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

    /*context.beginPath();
    context.moveTo(0, yPlayer);
    context.lineTo(canvas.width, yPlayer);
    context.stroke();

    context.beginPath();
    context.moveTo(xPlayer, canvas.height);
    context.lineTo(xPlayer, 0);
    context.stroke();

    context.beginPath();
    context.fillStyle = "green";
    context.fillRect( xPlayer, yPlayer - (ENEMIE_HEIGHT_DEFAULT+5), ENEMIE_WIDHT_DEFAULT, ENEMIE_HEIGHT_DEFAULT );

    context.beginPath();
    context.moveTo(0, yPlayer - (ENEMIE_HEIGHT_DEFAULT+5));
    context.lineTo(canvas.width, yPlayer - (ENEMIE_HEIGHT_DEFAULT+5));
    context.stroke();*/
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