'use strict';

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
		this.totalBet = 0;
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
		this.betAddress = '';
		this.betValue = 0;
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
		this.gameBegin = o.gameBegin; //游戏开始区块
		this.gameEnd = o.gameEnd; //游戏结束区块
		this.betBegin = o.betBegin; //投注开始区块
		this.betEnd = o.betEnd; //投注结束区块
		this.drawBlock = o.drawBlock; //开奖区块
		this.drawNum = o.drawNum; // 开奖号码
		this.totalBet = new BigNumber(o.totalBet); //奖池
		this.number = new BigNumber(o.number);  //中奖注数
		this.gamePhase = o.gamePhase; //开奖期数
		this.betInfos = o.betInfos;  // 投注信息
		this.betPoolInfo = o.betPoolInfo; //投注情况
	} else {
		this.gameBegin = 0;
		this.gameEnd = 0;		
		this.betBegin = 0;
		this.betEnd = 0;	
		this.drawBlock = 0;
		this.drawNum = 0;		
		this.totalBet = 0;
		this.number = 0;
		this.gamePhase = 0;
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

	LocalContractStorage.defineProperty(this, 'currentPhase'); //当前期数
	LocalContractStorage.defineProperty(this, 'gameBeginInterval'); //游戏初始化 -> 投注开始 间隔块
	LocalContractStorage.defineProperty(this, 'betInterval'); //投注时间块间隔
	LocalContractStorage.defineProperty(this, 'drawInterval');  //开奖时间块间隔
	LocalContractStorage.defineProperty(this, 'gameEndInterval'); //游戏开完奖到正式结束块间隔
	LocalContractStorage.defineProperty(this, 'guessingGameEnable'); //游戏是否有效
	LocalContractStorage.defineProperty(this, 'gameStatus'); //游戏状态
	LocalContractStorage.defineProperty(this, 'fee'); //手续费
	LocalContractStorage.defineProperty(this, 'feeAddress'); //手续费地址

	LocalContractStorage.defineProperty(this, 'drawSize');
	LocalContractStorage.defineMapProperty(this, 'drawHistory', {
		stringify: function (obj) {
			return obj.toString();
		},
		parse: function (str) {
			return new DrawHistory(str);
		}
	});  //历史开奖记录

	LocalContractStorage.defineProperty(this, 'gameSize');
	LocalContractStorage.defineMapProperty(this, 'gameHistory', {
		stringify: function (obj) {
			return obj.toString();
		},
		parse: function (str) {
			return new GuessingGameInfo(str);
		}
	}); //历史游戏记录

	LocalContractStorage.defineProperty(this, 'currentGameInfo', {
		stringify: function (obj) {
			return obj.toString;
		}, 
		parse: function (str) {
			return new GuessingGameInfo (str);
		}
	}); //当前游戏信息

	LocalContractStorage.defineProperty(this, 'lastGameInfo', {
		stringify: function (obj) {
			return obj.toString();
		},
		parse: function (str) {
			return new GuessingGameInfo (str);
		}
	});

};

GuessingGameContract.prototype = {

	init: function (_feeAddress) {
		this.betInterval = 100;
		this.gameBeginInterval = 10;
		this.drawInterval = 10;
		this.gameEndInterval = 10;
		this.guessingGameEnable = true;
		this.fee = 100;
		this.feeAddress = _feeAddress;

		this.drawSize = 0;
		this.gameSize = 0;
		this.currentPhase = 1;

		this.currentGameInfo = new GuessingGameInfo();
		this.currentGameInfo.gameBegin = Blockchain.block.height;
		this.currentGameInfo.betBegin = this.currentGameInfo.gameBegin + this.gameBeginInterval;
		this.currentGameInfo.betEnd = this.currentGameInfo.betBegin + this.betInterval;
		this.currentGameInfo.drawBlock = this.currentGameInfo.betEnd + this.drawInterval;
		this.currentGameInfo.number = new BigNumber(0);
		this.currentGameInfo.totalBet += this.ba;
		this.currentGameInfo.gamePhase = this.currentPhase;
		this.gameStatus = 0;

	},

	drawing: function() {
		if (this.gameStatus !=0 ) {
			throw new Error("game not start cant draw");
		}

		if (Blockchain.block.height < this.currentGameInfo.drawBlock) {
			throw new Error("betting cant draw");
		}

		var draw = new DrawHistory();
		var drawNum = random() % 7 + 1;
		draw.drawNum = drawNum;
		draw.blockNum = Blockchain.block.height;
		draw.phase = this.currentPhase;
		draw.totalBet = this.currentGameInfo.totalBet;
		this.currentGameInfo.drawNum = drawNum;
		this.drawHistory.set(this.gameSize, draw);

		var betPool = this.currentGameInfo.betPoolInfo[drawNum] || new BigNumber(0);
		this.currentGameInfo.number = betPool;
		var pool = this.currentGameInfo.totalBet.dividedBy(2);
		if (betPoolInfo.gt(new BigNumber(0))) {

			for (var i = 0; i < this.currentGameInfo.betInfos.length; i ++) {
				var betInfo = this.currentGameInfo.betInfos[i];
				if (betInfo.betNum == drawNum) {
					//恭喜中奖了
					var betGet = pool.multipliedBy(betInfo.betValue).dividedBy(betPoolInfo);
					var betFee = betGet.multipliedBy(new BigNumber(100/10000));
					betGet = betGet.
				}
			}
		}
		this.currentGameInfo.totalBet
		this.drawSize += 1;
		this.gameStatus = 3;
	},

	getDrawHistory: function () {

	},

	betting: function(num) {
		if (!this._canBet()) {
			throw new Error("cant betting");
		}

		if (!this._validateBetNum(num)) {
			throw new Error("invalidate bet number");
		}

		var betAddress = Blockchain.transaction.from;
		var betValue = Blockchain.transaction.value;
		var betInfo = new BetInfo();
		betInfo.betAddress = betAddress;
		betInfo.betValue = betValue;
		betInfo.bbnum = num;
		this.currentGameInfo.betInfos.push(betInfo);
		var numPool = this.currentGameInfo.betPoolInfo[num] || new BigNumber(0);
		numPool.plus(betValue);
		this.currentGameInfo.betPoolInfo[num] = numPool;
		this.currentGameInfo.totalBet += betValue;

	},

	getGameBetInfo: function() {
		return this.currentGameInfo.betPoolInfo || {};
	},

	getFee: function() {
		return this._fee;
	},

	setFee: function(_fee) {
		this.fee = _fee;
	},

	getFeeAddress: function() {
		return this._feeAddress;
	},

	setFeeAddress: function(_feeAddress) {
		this._feeAddress = _feeAddress;
	},

	initGame: function() {

		this.lastGameInfo = new GuessingGameInfo(this.currentGameInfo.toString());

		this.gameSize += 1;
		this.gameStatus = 0;
		this.currentPhase += 1;

		this.currentGameInfo = new GuessingGameInfo();
		this.currentGameInfo.gameBegin = Blockchain.block.height;
		this.currentGameInfo.betBegin = this.currentGameInfo.gameBegin + this.gameBeginInterval;
		this.currentGameInfo.betEnd = this.currentGameInfo.betBegin + this.betInterval;
		this.currentGameInfo.drawBlock = this.currentGameInfo.betEnd + this.drawInterval;
		this.currentGameInfo.number = new BigNumber(0);
		this.currentGameInfo.totalBet += this.ba;
		this.currentGameInfo.gamePhase = this.currentPhase;
		
	},

	setGameParame: function(_gameBeginInterval, _betInterval, _drawInterval, _gameEndInterval, _guessingGameEnable) {
		this.gameBeginInterval = _gameBeginInterval;
		this.betInterval = _betInterval;
		this.drawInterval = _drawInterval;
		this.gameEndInterval = _gameEndInterval;
		this.guessingGameEnable = _guessingGameEnable;
	},

	_canBet: function() {
		if (this.guessingGameEnable && Blockchain.block.height >= this.currentGameInfo.betBegin && Blockchain.block.height <= this.currentGameInfo.betEnd) {
			return true;
		}
		return false;
	}

	_validateBetNum: function(betNum) {
		if (betNum >= 1 && betNum <= 7) {
			return true;
		}
		return false;
	}

};

module.exports = GuessingGameContract;