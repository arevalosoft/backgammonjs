/**
 * Current version supports only two colours of checkers and two players as
 * the author is not yet aware of rules with three or more types of checkers
 * and/or players.
 * @readonly
 * @enum {number}
 */
var PieceType = {
  /** White piece */
  WHITE : 0,
  /** Black piece */
  BLACK : 1
};

/**
 * Denotes direction of piece movement relative to initial position.
 * @readonly
 * @enum {number}
 */
var Direction = {
  /** LEFT: from initial position to left (then to right on opposite side of board) */
  LEFT : 0,
  /** RIGHT: from initial position to right (then to left on opposite side of board) */
  RIGHT : 1
};

/**
 * Random generator.
 * @constructor
 */
function Random() {

}

/**
 * Get random number
 * @param {number} [max=6] - Random number is generated from 1 to max
 * @returns {number} - Random value from 1 to max
 */
Random.get = function(max) {
  max = max || 6;
  // TODO: replace with quality random generator
  return Math.floor(Math.random() * max) + 1;
};

/**
 * Pieces are round checkers that are being moved around the board.
 * @constructor
 * @param {PieceType} type - Type of piece
 * @param {number} id - ID of piece
 */
function Piece(type, id) {
  /**
   * Type of piece (white/black)
   * @type {PieceType}
   */
  this.type = type;

  /**
   * ID of piece
   * @type {number}
   */
  this.id = id;
}

/**
 * Dice with basic functionality to roll using good random generator.
 * @constructor
 */
function Dice() {
  /**
   * Values of the two dice
   * @type {Array}
   */
  this.values = [0, 0];

  /**
   * List of moves the player can make. Usually moves are equal to values,
   * but in most rules doubles (eg. 6:6) are played four times, instead of
   * two, in which case moves array will contain four values in stead of
   * only two (eg. [6, 6, 6, 6]).
   * @type {Array}
   */
  this.moves = [];

  /**
   * After dice is rolled, movesLeft contains the same values as moves.
   * When the player makes a move, the corresponding value is removed from
   * movesLeft array. If the player wants to undo the moves made, movesLeft is
   * replaced with moves.
   * @type {Array}
   */
  this.movesLeft = [];
}

/**
 * Roll dice and return result as a new Dice object
 * @returns {Dice} - New dice with random values
 */
Dice.roll = function() {
  var dice = new Dice();
  dice.values[0] = Random.get();
  dice.values[1] = Random.get();
  dice.values.sort(function (a, b) { return b - a; });
  return dice;
};

/**
 * Roll dice and return result as a new Dice object
 * @param {Dice} dice - New dice with random values
 * @param {number} move - New dice with random values
 */
Dice.markAsPlayed = function (dice, move) {
  for (var i = 0; i < dice.movesLeft.length; i++) {
    if (dice.movesLeft[i] === move) {
      dice.movesLeft.splice(i, 1);
      return;
    }
  }
  throw new Error("No such move!");
}

/**
 * State contains points and pieces and very basic methods to move pieces
 * around without enforcing any rules. Those methods are responsible for
 * required changes to internal state only, the UI layer should handle
 * graphical movement of pieces itself.
 * @constructor
 */
function State() {
  /**
   * All popular variants of the game have a total of 24 positions on the board
   * and two positions outside - the place on the bar where pieces go when
   * hit and the place next to board where pieces go when beared off.
   * Number of positions is not strictly defined here to allow more options
   * when creating new rules.
   * The points, bar, outside and pieces properties should be initialized by the
   * Rule object. Each element in those properties should contain a stack
   * (last in, first out).
   * @type {Array}
   */
  this.points = [];

  /**
   * Players have separate bar places and so separate list.
   * First element of array is for white pieces and second one for black.
   * @type {Array[]}
   */
  this.bar = [[],[]];
  this.whiteBar = this.bar[PieceType.WHITE];
  this.blackBar = this.bar[PieceType.BLACK];

  /**
   * Players have separate outside places and so separate list.
   * First element of array is for white pieces and second one for black.
   * @type {Array[]}
   */
  this.outside = [[],[]];
  this.whiteOutside = this.outside[PieceType.WHITE];
  this.blackOutside = this.outside[PieceType.BLACK];

  /**
   * A two dimensional array is also used to store references to all white and
   * black pieces independent of their position - just for convenience.
   */
  this.pieces = [[],[]];
  this.whitePieces = this.pieces[PieceType.WHITE];
  this.blackPieces = this.pieces[PieceType.BLACK];

  /**
   * Counter for generating unique IDs for pieces within this state
   * @type {number}
   */
  this.nextPieceID = 1;
}

/**
 * Clear state
 * @param {State} state - Board state
 */
State.clear = function(state) {
  state.nextPieceID = 1;
  for (var i = 0; i < state.points.length; i++) {
    state.points[i].length = 0;
  }
  state.whiteBar.length = 0;
  state.blackBar.length = 0;
  state.whiteOutside.length = 0;
  state.blackOutside.length = 0;
  state.whitePieces.length = 0;
  state.blackPieces.length = 0;
};

/**
 * Count number of pieces of specified type at selected position
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @param {PieceType} type - Piece type
 * @returns {number} - Number of pieces of specified type
 */
State.countAtPos = function(state, position, type) {
  var cnt = 0;

  for (var i = 0; i < state.points[position].length; i++) {
    if (state.points[position][i].type == type) {
      cnt++;
    }
  }

  return cnt;
};

/**
 * Check if there are no pieces at the specified point
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @returns {boolean} - Returns true if there are no pieces at that point
 */
State.isPosFree = function(state, position) {
  return state.points[position].length <= 0;
};

/**
 * Get top piece, checking type in the process
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @param {PieceType} type - Piece type
 * @returns {boolean} - Returns true if top piece at position is of the specified type. Returns false if there are no pieces at that point.
 */
State.checkTopPieceType = function(state, position, type) {
  if (state.points[position].length > 0) {
    var numPieces = state.points[position].length;
    var piece = state.points[position][numPieces - 1];
    if (piece.type === type) {
      return true;
    }
  }

  return false;
};

/**
 * Get type of top piece at specified position
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @returns {PieceType} - Returns type of top piece or null if there are no pieces at that position
 */
State.getTopPieceType = function(state, position) {
  var point = state.points[position];
  console.log(state, position);
  if (point.length == 0) {
    return null;
  }
  return point[point.length - 1].type;
};

/**
 * Player's statistics
 * @constructor
 */
function PlayerStats() {
  /**
   * Total number of wins
   * @type {number}
   */
  this.wins = 0;

  /**
   * Total number of loses
   * @type {number}
   */
  this.loses = 0;

  /**
   * Percent of doubles rolled relative to total number of dice rolled
   * @type {number}
   */
  this.doubles = 0;
}

/**
 * Player
 * @constructor
 */
function Player() {
  /**
   * Unique ID
   * @type {number}
   */
  this.id = 0;

  /**
   * Username
   * @type {string}
   */
  this.name = '';

  /**
   * Reference to current game
   * @type {Game}
   */
  this.currentGame = null;

  /**
   * Reference to rule for current game
   * @type {Rule}
   */
  this.currentRule = null;

  /**
   * Player's piece type for current game
   * @type {PieceType}
   */
  this.currentPieceType = null;

  /**
   * Player's statistics
   * @type {PlayerStats}
   */
  this.stats = new PlayerStats();

  // TODO: Remove socketID from this class
  /**
   * ID of player's socket
   * @type {string}
   */
  this.socketID = null;
}

/**
 * Create new player object with unique ID.
 * Player object is not saved to database.
 * @returns {Player} - New player object
 */
Player.createNew = function() {
  var player = new Player();
  player.id = Utils.generateID();
  return player;
};

/**
 * Game
 * @constructor
 */
function Game() {
  /**
   * Unique ID of game
   * @type {number}
   */
  this.id = 0;

  /**
   * Host player - the player that created the game
   * @type {Player}
   */
  this.host = null;

  /**
   * Guest player - the player that joined the game
   * @type {Player}
   */
  this.guest = null;

  /**
   * List of all players participating in the game
   * @type {Array}
   */
  this.players = [];

  /**
   * Name of rule - equal to class name of the rule (eg. 'RuleBgCasual')
   * @type {string}
   */
  this.ruleName = '';

  /**
   * Board state
   * @type {State}
   */
  this.state = null;

  /**
   * Flag that shows if game has started
   * @type {boolean}
   */
  this.hasStarted = false;

  /**
   * Flag that shows if game is over/has finished
   * @type {boolean}
   */
  this.isOver = false;

  /**
   * Show which player's turn it is
   * @type {Player}
   */
  this.turnPlayer = null;

  /**
   * Dice for current turn. Should be null if dice haven't been rolled yet.
   * @type {Dice}
   */
  this.turnDice = null;

  /**
   * Flag that shows if the moves made in current turn have been confirmed by the player.
   * @type {boolean}
   */
  this.turnConfirmed = false;
}

// TODO: Replace Game#hasStarted and Game#isOver with one common variable for status or remove this enum
/**
 * Internal status of game.
 * @readonly
 * @enum {number}
 */
var GameStatus = {
  /** New game, that has been created, but has not been started yet */
  NEW : 0,
  /** Game has started */
  STARTED : 1,
  /** Game is over/finished */
  FINISHED : 2
};

/**
 * Create new game object with unique ID and initialize it.
 * Game object is not saved in database.
 * @param {Rule} rule - Rule object to use
 * @returns {Game} - A new game object with unique ID
 */
Game.createNew = function(rule) {
  var game = new Game();
  game.id = Utils.generateID();
  game.ruleName = rule.name;
  Game.init(game, rule);
  return game;
};

/**
 * Add host player to game
 * @param {Game} game - Game to add player to
 * @param {Player} player - Player to add
 * @throws Throws error if the game already has a host player
 */
Game.addHostPlayer = function (game, player) {
  if (game.host != null)
  {
    throw new Error("Game already has a host player!");
  }

  game.host = player;
  game.players.push(player);
};

/**
 * Add guest player
 * @param {Game} game - Game to add player to
 * @param {Player} player - Player to add
 * @throws Throws error if the game already has a guest player
 */
Game.addGuestPlayer = function (game, player) {
  if (game.guest != null)
  {
    throw new Error("Game already has a guest player!");
  }

  game.guest = player;
  game.players.push(player);
};

/**
 * Initialize game object
 * @param {Game} game - Game to initialize
 * @param {Rule} rule - Rule to use
 */
Game.init = function (game, rule) {
  game.state = new State();
  rule.initialize(game.state);
  rule.resetState(game.state);
};

/**
 * Check if specified player is the host of the game
 * @param {Game} game - Game
 * @param {Player} player - Specified player
 * @returns {boolean} - True if there is a host player and their ID matches that of the player parameter
 */
Game.isHost = function (game, player) {
  return (game.host != null)
    && (player != null)
    && (game.host.id == player.id);
};

/**
 * Check if another player has joined the game
 * @param {Game} game - Game
 * @returns {boolean} - True if a another player has joined the game
 */
Game.hasGuestJoined = function (game) {
  return (game.guest != null);
};

/**
 * Check if it is specified player's turn
 * @param {Game} game - Game
 * @param {Player} player - Specified player
 * @returns {boolean} - True if it is specified player's turn
 */
Game.isPlayerTurn = function (game, player) {
  return (game.turnPlayer != null)
    && (player != null)
    && (game.turnPlayer.id == player.id);
};

/**
 * Check if it is specified player's turn, but check by their piece type, and not player object
 * @param {Game} game - Game
 * @param {PieceType} type - Player's piece type
 * @returns {boolean} - True if it is specified player's turn
 */
Game.isTypeTurn = function (game, type) {
  return (game.turnPlayer != null)
    && (game.turnPlayer.currentPieceType === type);
};

/**
 * Check if dice has been rolled
 * @param {Game} game - Game
 * @returns {boolean} - True if dice has been rolled (turnDice is not null)
 */
Game.diceWasRolled = function (game) {
  return (game.turnDice != null);
};

/**
 * Check if there are more moves to make
 * @param {Game} game - Game
 * @returns {boolean} - True if there are any moves left to make
 */
Game.hasMoreMoves = function (game) {
  return (game.turnDice != null)
    && (game.turnDice.movesLeft.length > 0);
};

/**
 * Check if a specific move value is available in movesLeft
 * @param {Game} game - Game
 * @param {number} value - Move value to check for
 * @returns {boolean} - True if specified move value is available
 */
Game.hasMove = function (game, value) {
  return (game.turnDice != null)
    && (game.turnDice.movesLeft.indexOf(value) > -1);
};

/**
 * Match
 * @constructor
 */
function Match() {
  /**
   * Unique ID of match object
   * @type {number}
   */
  this.id = 0;

  /**
   * Player that created the match
   * @type {Player}
   */
  this.host = null;

  /**
   * Player that joined the match
   * @type {Player}
   */
  this.guest = null;

  /**
   * List of all players participating in the match
   * @type {Array}
   */
  this.players = [];

  /**
   * Name of the rule used for current match.
   * Equals the class name of the rule (eg. 'RuleBgCasual').
   * @type {string}
   */
  this.ruleName = '';
}

/**
 * Move action types are determined by rules. This is only a default list
 * of actions that are shared by most rules.
 * @readonly
 * @enum {string}
 */
var MoveActionType = {
  /** MOVE: Move piece from one point to another */
  MOVE: 'move',
  /** RECOVER: Recover piece from bar and place it on board */
  RECOVER: 'recover',
  /** HIT: Hit opponent's piece and sent it to bar */
  HIT: 'hit',
  /** BEAR: Bear piece - move it outside the board */
  BEAR: 'bear'
};

/**
 * Actions that can result from making a piece move.
 * Rules can assign additional properties to those, depending on the action
 * type
 * @constructor
 */
function MoveAction() {
  /**
   * Action type, depends on rule (eg. move, bear, hit)
   * @type {MoveActionType|string}
   */
  this.type = '';
}

/**
 * Common utilities
 * @constructor
 */
function Utils() {

}

/**
 * Generate unique ID for an object in model
 * @returns {number}
 */
Utils.generateID = function () {
  // TODO: Use a better approach - eg. a mongoDB ObjectID?
  return Random.get(99999999);
};

/**
 * Sanitize rule's name so that it is safe to use as a filename
 * @param {string} name - Rule's name to sanitize (eg. 'RuleBgCasual')
 * @returns {string}
 */
Utils.sanitizeName = function (name) {
  return name.replace(/[^-_A-Za-z0-9]/gi, "");
};

/**
 * Load rule object by path and class name
 * @param {string} path - Path where rule files are stored ('../../lib/rules/' in browser sample)
 * @param {string} ruleName - Name of rule - equal to rule's class name (eg. 'RuleBgCasual')
 * @returns {Rule} - Rule object
 */
Utils.loadRule = function (path, ruleName) {
  var fileName = Utils.sanitizeName(ruleName);
  var file = path + fileName + '.js';
  console.log('Loading rule in file ' + file);
  var rule = require(file);
  rule.name = fileName;
  console.log(rule);
  return rule;
};

module.exports = {
  'PieceType': PieceType,
  'Direction': Direction,
  'Random': Random,
  'Piece': Piece,
  'Dice': Dice,
  'State': State,
  'PlayerStats': PlayerStats,
  'Player': Player,
  'GameStatus': GameStatus,
  'Game': Game,
  'Match': Match,
  'MoveActionType': MoveActionType,
  'MoveAction': MoveAction,
  'Utils': Utils
};
