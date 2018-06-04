"use strict";

var Mixin = function () {};
Mixin.UNPAYABLE = function () {
   if (Blockchain.transaction.value.gt(0)) {
       return false;
   }
   return true;
};
Mixin.PAYABLE = function () {
   if (Blockchain.transaction.value.gt(0)) {
       return true;
   }
   return false;
};

Mixin.POSITIVE = function () {
   console.log("POSITIVE");
   return true;
};
Mixin.UNPOSITIVE = function () {
   console.log("UNPOSITIVE");
   return false;
};
Mixin.decorator = function () {
   var funcs = arguments;
   if (funcs.length < 1) {
       throw new Error("mixin decorator need parameters");
   }
   return function () {
       for (var i = 0; i < funcs.length - 1; i ++) {
           var func = funcs[i];
           if (typeof func !== "function" || !func()) {
               throw new Error("mixin decorator failure");
           }
       }
       var exeFunc = funcs[funcs.length - 1];
       if (typeof exeFunc === "function") {
           exeFunc.apply(this, arguments);
       } else {
           throw new Error("mixin decorator need an executable method");
       }
   };
};
var DrawHistory = function (drawHistory) {
	if (drawHistory) {
		var o = JSON.parse(drawHistory);
		this.drawNum = o.drawNum;
		this.blockNum = o.blockNum;
		this.phase = o.phase;
		this.totalBet = new BigNumber(o.totalBet);
	} else {
		this.drawNum = 0;
		this.blockNum = 0;
		this.totalBet = new BigNumber(0);
	}
};

DrawHistory.prototype = {
	toString: function() {
		return JSON.stringify(this);
	}
};

var BetInfo = function (betInfo) {
	if (betInfo) {
		var o = JSON.parse(betInfo);
		this.betAddress = o.betAddress;
		this.betValue = new BigNumber(o.betValue);
		this.bbnum = o.bbnum;
	} else {
		this.betAddress = "";
		this.betValue = new BigNumber(0);
		this.bbnum = 0;
	}
};

BetInfo.prototype = {
	toString: function() {
		return JSON.stringify(this);
	}
};

var GuessingGameInfo = function (gameInfo) {
	if (gameInfo) {
		var o = JSON.parse(gameInfo);
		this.gameBegin = o.gameBegin; 
		this.gameEnd = o.gameEnd; 
		this.betBegin = o.betBegin; 
		this.betEnd = o.betEnd; 
		this.drawBlock = o.drawBlock; 	
		this.distributeBlock = o.distributeBlock;
		this.drawNum = o.drawNum; 		
		this.totalBet = new BigNumber(o.totalBet); 
		this.number = new BigNumber(o.number);  	
		this.gamePhase = o.gamePhase;
		this.betInfos = o.betInfos;
		this.betPoolInfo = o.betPoolInfo;
	} else {
		this.gameBegin = 0;
		this.gameEnd = 0;		
		this.betBegin = 0;
		this.betEnd = 0;	
		this.drawBlock = 0;
		this.drawNum = 0;		
		this.totalBet = new BigNumber(0);
		this.number = new BigNumber(0);
		this.gamePhase = 0;
		this.distributeBlock = 0;
		this.betInfos = [];
		this.betPoolInfo = {};
	}
};

GuessingGameInfo.prototype = {
	toString: function () {
		return JSON.stringify(this);
	}
};

var GuessingGameContract = function () {

	LocalContractStorage.defineProperty(this, "currentPhase"); 
	LocalContractStorage.defineProperty(this, "gameBeginInterval"); 
	LocalContractStorage.defineProperty(this, "betInterval"); 
	LocalContractStorage.defineProperty(this, "drawInterval");  
	LocalContractStorage.defineProperty(this, "gameEndInterval"); 
	LocalContractStorage.defineProperty(this, "guessingGameEnable"); 
	LocalContractStorage.defineProperty(this, "gameStatus"); 
	LocalContractStorage.defineProperty(this, "fee"); 
	LocalContractStorage.defineProperty(this, "feeAddress");
	LocalContractStorage.defineProperty(this, "totalPool", {
		stringify: function(obj) {
			return obj.toString();
		},
		parse: function(str) {
			return new BigNumber(str);
		}
	});

	LocalContractStorage.defineProperty(this, "drawHistory"); 

	LocalContractStorage.defineProperty(this, "gameHistory");

	LocalContractStorage.defineProperty(this, "currentGameInfo", {
		stringify: function (obj) {
			return obj.toString();
		}, 
		parse: function (str) {
			return new GuessingGameInfo (str);
		}
	});

	LocalContractStorage.defineProperty(this, "lastGameInfo", {
		stringify: function (obj) {
			return obj.toString();
		},
		parse: function (str) {
			return new GuessingGameInfo (str);
		}
	});

	LocalContractStorage.defineProperty(this, "ownerAddress");

};

GuessingGameContract.prototype = {

	init: function () {
		this.betInterval = 450;
		this.gameBeginInterval = 10;
		this.drawInterval = 10;
		this.gameEndInterval = 10;
		// this.betInterval = 20;
		// this.gameBeginInterval = 2;
		// this.drawInterval = 2;
		// this.gameEndInterval = 2;
		this.guessingGameEnable = true;
		this.fee = 100;
		this.feeAddress = "n1XUJ57bgsHQwqgjcktP1uqkN33q1XM8id1";

		this.ownerAddress = Blockchain.transaction.from;
		this.totalPool = new BigNumber(0);
		this.gameHistory = [];

		this.drawSize = 0;
		this.gameSize = 0;
		this.currentPhase = 1;
		this.gameStatus = 0;
		var gameInfo = new GuessingGameInfo();
		gameInfo.gameBegin = Blockchain.block.height;
		gameInfo.betBegin = gameInfo.gameBegin + this.gameBeginInterval;
		gameInfo.betEnd = gameInfo.betBegin + this.betInterval;
		gameInfo.drawBlock = gameInfo.betEnd + this.drawInterval;
		gameInfo.number = new BigNumber(0);
		gameInfo.totalBet = new BigNumber(0);
		gameInfo.gamePhase = this.currentPhase;
		this.currentGameInfo = gameInfo;
	},

	accept: function() {
		var totalPool = this.totalPool || new BigNumber(0);
		totalPool = totalPool.plus(Blockchain.transaction.value);
		this.totalPool = totalPool;
	},

	drawing: Mixin.decorator(Mixin.UNPAYABLE, function() {
		if (this.gameStatus !=0 ) {
			throw new Error("game not start cant draw");
		}

		if (Blockchain.block.height < this.currentGameInfo.drawBlock) {
			throw new Error("betting cant draw");
		}

		var draw = new DrawHistory();
		var drawNum = parseInt(Math.random()*7) + 1;

		var gameInfo = this.currentGameInfo;
		var betPool = new BigNumber(0);

		if (gameInfo.betPoolInfo[drawNum]) {
			betPool = new BigNumber(gameInfo.betPoolInfo[drawNum]);
		}

		gameInfo.number = betPool;
		var pool = gameInfo.totalBet.div(2);
		var fee = new BigNumber(0);
		if (betPool.gt(new BigNumber(0))) {
			var betInfos = gameInfo.betInfos || [];
			for (var i = 0; i < betInfos.length; i ++) {
				var betInfo = betInfos[i];
				if (betInfo.bbnum == drawNum) {
					var betGet = pool.times(betInfo.betValue);
					betGet = betGet.div(betPool);
					var betFee = betGet.times(100)
					betFee = betFee.dividedBy(10000);
					fee = fee.plus(betFee);
					betGet = betGet.sub(betFee);
					var result = Blockchain.transfer(betInfo.betAddress, betGet);
					if (!result) {
						throw new Error("transfer failed");
					}
				}
			}
			var totalPool = this.totalPool || new BigNumber(0);
			totalPool = totalPool.sub(pool);
			this.totalPool = totalPool;
		}

		var result = Blockchain.transfer(this.feeAddress, fee);
		if (!result) {
			throw new Error("transfer failed");
		}

		
		draw.drawNum = drawNum;
		draw.blockNum = Blockchain.block.height;
		draw.phase = this.currentPhase;
		draw.totalBet = gameInfo.totalBet;

		gameInfo.drawNum = drawNum;
		var drawHistorys = this.drawHistory || [];
		drawHistorys.push(draw);
		this.drawHistory = drawHistorys;
		gameInfo.distributeBlock = Blockchain.block.height;
		gameInfo.gameEnd = gameInfo.distributeBlock + this.gameEndInterval;
		this.currentGameInfo = gameInfo;
		this.gameStatus = 3;
	}),

	betting: Mixin.decorator(Mixin.PAYABLE, function(num) {

		if (Blockchain.transaction.value.lt(100000000000000000)) {
			throw new Error("Betting nas value must grant than 0.1NAS");
		};

		if (!this._canBet()) {
			throw new Error("Cant betting");
		}

		if (!this._validateBetNum(num)) {
			throw new Error("Invalidate bet number");
		}

		var betAddress = Blockchain.transaction.from;
		var betValue = Blockchain.transaction.value;

		var betInfo = new BetInfo();
		betInfo.betAddress = betAddress;
		betInfo.betValue = betValue;
		betInfo.bbnum = num;
		var gameInfo = this.currentGameInfo;
		gameInfo.betInfos.push(betInfo);

		var numPool = betValue;
		if (gameInfo.betPoolInfo[num]) {
			numPool = numPool.plus(new BigNumber(gameInfo.betPoolInfo[num]));
		}
		gameInfo.betPoolInfo[num] = numPool;
		gameInfo.totalBet = gameInfo.totalBet.plus(betValue);

		var totalPool = this.totalPool || new BigNumber(0);
		totalPool = totalPool.plus(betValue);
		this.totalPool = totalPool;

		this.currentGameInfo = gameInfo;

	}),

	getDrawHistory: function (pageSize, page) {
		var draws = this.drawHistory || [];
		var list = [];
		if (!draws) {
			return [];
		}

		var start = draws.length - parseInt(page) * pageSize;
		if (!start) {
			return [];
		}

		for (var i = start - 1; i >= (start - parseInt(pageSize)) && i >= 0; i--) {
			var draw = draws[i];
			list.push(draw);
		}
		return list;

	},

	getGameBetInfo: function () {
		return this.currentGameInfo.betPoolInfo || {};
	},

	getBetByAddress: function (_address) {

		var list = [];
		var gameHistorys = this.gameHistory || [];
		var length = gameHistorys.length;

		for (var i = length - 1; i >= 0 && i >= length - 100; i--) {
			var game = gameHistorys[i];
			var hasRecord = false;
			var bet = {};
			var bets = [];
			for (var j = 0; j < game.betInfos.length; j++) {
				var betInfo = game.betInfos[j];
				
				if (betInfo.betAddress == _address) {
					hasRecord = true;
					if (!bets[betInfo.bbnum]) {
						bets[betInfo.bbnum] = new BigNumber(0);
					}
					bets[betInfo.bbnum] = bets[betInfo.bbnum].plus(betInfo.betValue);
				}
			}
			if (hasRecord) {
				bet["drawBlock"] = game.drawBlock;
				bet["drawNum"] = game.drawNum;
				bet["number"] = game.number;
				bet["totalBet"] = game.totalBet;
				bet["phase"] = game.gamePhase;
				bet["betData"] = bets;
				list.push(bet);
			}
		}

		var hasRecord = false;
		var bet = {};
		var bets = [];
		for (var i = 0; i < this.currentGameInfo.betInfos.length; i++) {
			var betInfo = this.currentGameInfo.betInfos[i];
			if (betInfo.betAddress == _address) {
				hasRecord = true;
				if (!bets[betInfo.bbnum]) {
					bets[betInfo.bbnum] = new BigNumber(0);
				}
				bets[betInfo.bbnum] = bets[betInfo.bbnum].plus(betInfo.betValue);
			}
		}

		if (hasRecord) {
			bet["drawBlock"] = this.currentGameInfo.drawBlock;
			bet["drawNum"] = this.currentGameInfo.drawNum;
			bet["number"] = this.currentGameInfo.number;
			bet["totalBet"] = this.currentGameInfo.totalBet;
			bet["phase"] = this.currentGameInfo.gamePhase;
			bet["betData"] = bets;
			list.push(bet);
		}
		return list;
	},

	getGameHistory: function () {
		return this.gameHistory || [];
	},

	getGameInfo: function () {
		return this.currentGameInfo || {};
	},

	getGameStatus: function () {
		return this.gameStatus;
	},

	getFee: function () {
		return this.fee;
	},

	setFee: Mixin.decorator(Mixin.UNPAYABLE, function (_fee) {
		this._requireOwner();
		if (_fee > this.fee) {
			throw new Error("New fee must lessthan last fee");
		};
		this.fee = _fee;
	}),

	getFeeAddress: function () {
		return this.feeAddress;
	},

	setFeeAddress: Mixin.decorator(Mixin.UNPAYABLE, function (_feeAddress) {
		this._requireOwner();
		this.feeAddress = _feeAddress;
	}),

	initGame: Mixin.decorator(Mixin.UNPAYABLE, function () {

		if (this.gameStatus != 3 || this.currentGameInfo.gameEnd > Blockchain.block.height) {
			throw new Error("Game is start, cant new a game");
		}

		var gameHistorys = this.gameHistory || [];
		gameHistorys.push(this.currentGameInfo);
		this.gameHistory = gameHistorys;
		this.lastGameInfo = new GuessingGameInfo(this.currentGameInfo.toString());
		this.gameStatus = 0;
		this.currentPhase += 1;

		var gameInfo = new GuessingGameInfo();
		gameInfo.gameBegin = Blockchain.block.height;
		gameInfo.betBegin = gameInfo.gameBegin + this.gameBeginInterval;
		gameInfo.betEnd = gameInfo.betBegin + this.betInterval;
		gameInfo.drawBlock = gameInfo.betEnd + this.drawInterval;
		gameInfo.number = new BigNumber(0);
		gameInfo.totalBet = gameInfo.totalBet.plus(this.totalPool);
		gameInfo.gamePhase = this.currentPhase;
		this.currentGameInfo = gameInfo;
		
	}),

	setGameParame: Mixin.decorator(Mixin.UNPAYABLE, function (_gameBeginInterval, _betInterval, _drawInterval, _gameEndInterval, _guessingGameEnable) {
		this._requireOwner();
		this.gameBeginInterval = _gameBeginInterval;
		this.betInterval = _betInterval;
		this.drawInterval = _drawInterval;
		this.gameEndInterval = _gameEndInterval;
		this.guessingGameEnable = _guessingGameEnable;
	}),

	_canBet: function () {
		if (this.guessingGameEnable && Blockchain.block.height >= this.currentGameInfo.betBegin && Blockchain.block.height <= this.currentGameInfo.betEnd) {
			return true;
		}
		return false;
	},

	_validateBetNum: function (betNum) {
		if (betNum >= 1 && betNum <= 7) {
			return true;
		}
		return false;
	},

	_requireOwner: function () {
		if (Blockchain.transaction.from != this.ownerAddress) {
			throw new Error("Without permission");
		};
	}

};

module.exports = GuessingGameContract;