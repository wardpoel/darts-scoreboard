/**
 * @typedef {101 | 170 | 301 | 501} Score
 * @typedef {'single' | 'double' | 'triple'} Checkout
 * @typedef {'win' | 'loss' | 'draw'} PlayerGameState
 */

/**
 * @typedef {Object} Game
 * @property {string} id
 * @property {Score} score
 * @property {Checkout} checkout
 * @property {number} createdAt
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {?string} statId
 */

/**
 * @typedef {Object} Leg
 * @property {string} id
 * @property {string} gameId
 * @property {?string} winnerId
 * @property {number} createdAt
 */

/**
 * @typedef {Object} Throw
 * @property {string} id
 * @property {string} legId
 * @property {string} playerId
 * @property {number} score
 * @property {number} darts
 * @property {number} createdAt
 */

/**
 * @typedef {Object} ScoreStat
 * @property {CheckoutStat} single
 * @property {CheckoutStat} double
 * @property {CheckoutStat} triple
 */

/**
 * @typedef {Object} StatDetails
 * @property {number} wins
 * @property {number} losses
 * @property {number} played
 */

/**
 * @typedef {Object} CheckoutStat
 * @property {number} total
 * @property {number} darts
 * @property {StatDetails} legs
 * @property {StatDetails} games
 */

/**
 * @typedef {Object} Stat
 * @property {string} id
 * @property {ScoreStat} _101_
 * @property {ScoreStat} _170_
 * @property {ScoreStat} _301_
 * @property {ScoreStat} _501_
 */
