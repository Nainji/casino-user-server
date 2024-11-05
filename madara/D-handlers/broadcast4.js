// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

// required models
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Room = mongoose.model('Room');
var Score = mongoose.model('Score');
var Othermarket = mongoose.model('Othermarket');
var Wheel = mongoose.model('Wheel');
var WheelStatus = mongoose.model('WheelStatus');
var Wheelpermission = mongoose.model('Wheelpermission');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Login = mongoose.model('Login');

var Log = mongoose.model('Log');
var MarketteenPati = mongoose.model('Marketteenpati');
var TeenpatiResult = mongoose.model('TeenpatiResult');
// var Config = mongoose.model('Config');
// var Log = mongoose.model('Log');

module.exports.updateMarketSpiner = function (io) {

  Othermarket.findOne({}).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (err) logger.debug(err);
           if(!market) return;
            if(market.timers==null) return;

    var timer = market.timers - 1; 
      if (timer == 0 || timer < 0) {

        if (timer > -45) {
          market.timer = 0;
          Othermarket.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "SUSPENDED"
            }
          }, function (err, raw) {console.log(err);});
         
        } else {

          market.timer = 0;
         
          Othermarket.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "CLOSED"
            }
          }, function (err, raw) {
            console.log(err);
            Othermarket.findOne({
              marketId: market.marketId
            }).exec(function (err, closedmarkets) {
             
                if(!closedmarkets.winner)
                {
                      closedMarket(market.marketId);
                }
               
               
            });
          });
         
        }

      } else {

        if (market.marketBook.status == "OPEN" || market.marketBook.status == "SUSPENDED") {

          market.timer = timer;
      Othermarket.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer
            }
          }, function (err, raw) {

             console.log(err);
          });
        }

      }

    });
    
  }

module.exports.createMarketSpiner = function (io) {
    createMarket();
  }

module.exports.wheelMarketPulse = function (io, type,user) {
  if (!io) return;
  if (type == 'user') {
    Othermarket.findOne({}).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (err) logger.debug(err);
           if(!market) return;
            if(market.timers==null) return;
             
               var timer = market.timers;
             
      if (timer == 0 || timer < 0) {

        if (timer > -45) {
          market.timer = 0;
          Othermarket.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "SUSPENDED"
            }
          }, function (err, raw) {console.log(err);});
          io.self.emit('get-wheel-markets-success', market);
        } else {

          market.timer = 0;
         
          Othermarket.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "CLOSED"
            }
          }, function (err, raw) {
            console.log(err);
            Othermarket.findOne({
              marketId: market.marketId
            }).exec(function (err, closedmarkets) {  
            });
          });
          io.self.emit('get-wheel-markets-success', market);
        }

      } else {

        if (market.marketBook.status == "OPEN" || market.marketBook.status == "SUSPENDED") {
          io.self.emit('get-wheel-markets-success', market);
        }

      }

    });

  } else if (type == 'admin') {
    Othermarket.findOne({}).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (!market) return;
      if (err) logger.debug(err);
      var timer = market.timers;
      if (timer > 0) {

        market.timer = timer;
      } else {
        market.timer = 0;
      }
      io.self.emit('get-wheel-markets-success', market);
     
    });
  }
  if (type == 'manager') {
    Othermarket.findOne({}).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (!market) return;
      if (err) logger.debug(err);
      var timer = market.timers;
      if (timer > 0) {
        market.timer = timer;
      } else {
        market.timer = 0;
      }

      io.self.emit('get-wheel-markets-success', market);
    
    });
  }


};

function createMarket() {
  var marketDb = [{
      "runnerName": "Lion",
      "rate": 3.5,
    },
    {
      "runnerName": "Tiger",
      "rate": 3.5,
    },
    {
      "runnerName": "Dragon",
      "rate": 3.5,
    },
    {
      "runnerName": "Eagle",
      "rate": 3.5,
    }
  ];

  var marketId = 1. + '-' + Math.floor(Math.random() * 100000000);
  var runners = [];
  for (var m = 0; m < marketDb.length; m++) {
    var selectionidAll = Math.floor(Math.random() * 1000000);
    var selection = {
      "selectionId": selectionidAll,
      "runnerName": marketDb[m].runnerName,
      "status": "OPEN",
      "availableToBack": {
        "price": marketDb[m].rate,
        "size": "0"
      },
    };
    runners.push(selection);
  }

  var m2 = {
    eventTypeId: "4321",
    eventName: "wheelSpiner",
    openDate: new Date(),
    marketId: marketId,
    marketType: "wheelSpiner",
    marketBook: {
      marketId: marketId,
      status: "OPEN",

      runners: runners,
    },
    runners: runners,
    managers: [],
    usersPermission: [],
    managerStatus: {},
    createdBy: new Date(),
    shared: true,
    auto: true,
    timers: 90,
    visible: true,
    deleted: false,
  }
   
  
    Wheelpermission.find({
      deleted: false,
      status: true,
    }, {
      username: 1
    }, function (err, dbPermissions) {

      User.find({
        deleted: false,
        status: 'active',
        availableEventTypes: m2.eventTypeId
      }, {
        username: 1
      }, function (err, dbManagers) {
        if (err) logger.error(err);
        if (dbManagers) {
          for (var i = 0; i < dbManagers.length; i++) {
            m2.managers.unshift(dbManagers[i].username);
            m2.managerStatus[dbManagers[i].username] = true;
          }
          if (dbPermissions) {
            for (var j = 0; j < dbPermissions.length; j++) {
              m2.usersPermission.unshift(dbPermissions[j].username);
            }
          }

        }
        console.log(m2);
        var market = new Othermarket(m2);
        market.save(function (err) {

          console.log('save new market');
          if (err) logger.debug(err);


        });
      });

    });

}


function closedMarket(marketId) {
 
  Othermarket.findOne({
    "marketBook.status": "CLOSED",
    "marketId": marketId,

  }, function (err, market) {
    //console.log(market);
    if (!market) return;
    var marketId = market.marketId;
       if(!market.Result)
       {
         var arr = Math.floor((Math.random() * 4) + 1);
       }
       else
       {
        if(market.Result=='Lion')
        {
        var arr=1;
        }
        if(market.Result=='Tiger')
        {
         var arr=2;
        }
       if(market.Result=='Dragon')
        {
         var arr=3; 
        }
        if(market.Result=='Eagle')
        {
         var arr=4; 
        }

       }

      if(!arr) return;
    
    if (arr) {

      if (arr == 1) {
        var status = "Lion";
        var winA = "WINNER";
        var winB = "LOST";
        var winC = "LOST";
        var winD = "LOST";
      }
      if (arr == 2) {
        var status = "Tiger";
        var winA = "LOST";
        var winB = "WINNER";
        var winC = "LOST";
        var winD = "LOST";
      }
      if (arr == 3) {
        var status = "Dragon";
        var winA = "LOST";
        var winB = "LOST";
        var winC = "WINNER";
        var winD = "LOST";
      }
      if (arr == 4) {
        var status = "Eagle";
        var winA = "LOST";
        var winB = "LOST";
        var winC = "LOST";
        var winD = "WINNER";
      }
      market.marketBook.status = "CLOSED";
      runners = market.runners;

      var newRunners = [];
      var winnerId=0;
      for (var l = 0; l < runners.length; l++) {

        newRunners[l] = {};
        if (l == 0) {
          newRunners[l].status = winA;
          if(winA=="WINNER")
          {
            winnerId=newRunners[l].selectionId;
          }
        }
        if (l == 1) {
          newRunners[l].status = winB;
           if(winB=="WINNER")
          {
            winnerId=newRunners[l].selectionId;
          }
        }
        if (l == 2) {
          newRunners[l].status = winC;
           if(winC=="WINNER")
          {
            winnerId=newRunners[l].selectionId;
          }
        }
        if (l == 3) {
          newRunners[l].status = winD;
           if(winD=="WINNER")
          {
            winnerId=newRunners[l].selectionId;
          }
        }
        newRunners[l].runnerName = runners[l].runnerName;
        newRunners[l].selectionId = runners[l].selectionId;
        newRunners[l].availableToBack = runners[l].availableToBack;
      }
      market.winner=winnerId;
      market.marketBook.runners = newRunners;
      market.Result = status;
      Othermarket.update({
        marketId: marketId
      }, market, function (err, raw) {
        //console.log(raw);
        if (err) logger.error(err);
        closeMarket(market);
      });
    } else {


    }

  });


}

function closeMarket(request) {
  if (!request) return;
  if (!request.marketId) return;
  logger.debug("closeMarket: " + JSON.stringify(request));

  var marketId = request.marketId;
  // Delete unmatched bets
  Bet.update({
    marketId: marketId,
    status: 'UNMATCHED'
  }, {
    $set: {
      deleted: true
    }
  }, {
    multi: true
  }, function (err, raw) {
    if (err) logger.error(err);
    // No need to wait for this operation to complete
  });

  Othermarket.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    User.find({
      deleted: false,
      role: 'user'
    }, function (err, users) {
      if (!users) return;
      for (var i = 0; i < users.length; i++) {
        //console.log('user level1');
        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            username: user.username,
            status: 'MATCHED',
            result: "ACTIVE",
            deleted: false
          }, function (err, bets) {
            if(!bets) return;
            if (bets) {
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              // for (var i = 0; i < market.marketBook.runners.length; i++) {
              // if(i==1 && i==3) continue;
              runnerProfit[market.marketBook.runners[0].selectionId] = 0;
              winners[market.marketBook.runners[0].selectionId] = market.marketBook.runners[0].status;

              runnerProfit[market.marketBook.runners[1].selectionId] = 0;
              winners[market.marketBook.runners[1].selectionId] = market.marketBook.runners[1].status;

              runnerProfit[market.marketBook.runners[2].selectionId] = 0;
              winners[market.marketBook.runners[2].selectionId] = market.marketBook.runners[2].status;

              runnerProfit[market.marketBook.runners[3].selectionId] = 0;
              winners[market.marketBook.runners[3].selectionId] = market.marketBook.runners[3].status;
              //}
              var exposure = 0;
              bets.forEach(function (val, index) {
                if (val.type == 'Back') {
                  for (var k in runnerProfit) {

                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));

                    } else {
                      runnerProfit[k] -= Math.round(val.stake);


                    }
                  }
                }


                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'WON';

                  } else {
                    val.result = 'LOST';


                  }
                }
                //console.log(val.result);
                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) {});
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0;
                  var j = 0;
                  for (var key in runnerProfit) {


                    if (winners[key] == 'WINNER') {


                      if (j == 0) {

                        profit = runnerProfit[key];
                        j++;
                      } else {

                        if (profit > runnerProfit[key]) {
                          profit = runnerProfit[key];
                        }
                      }
                    }
                    if (i == 0) {
                      //console.log('12');

                      maxLoss = runnerProfit[key];
                      i++;
                    } else {
                      //console.log('121');
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }


                  logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
 User.findOne({deleted:false, role:'user',username:user.username}, function(err, userone){
                  userone.exposure = userone.exposure - maxLoss;
                  userone.balance = userone.balance - maxLoss;
                  userone.balance = userone.balance + profit;
                  var oldLimit = userone.limit;
                  userone.limit = userone.limit + profit;
                  (function (userone, market, profit, oldLimit) {
                    User.update({
                      username: userone.username
                    }, userone, function (err, raw) {
                      if (err) return;

                      var log = new Log();
                      log.username = userone.username;
                      log.action = 'AMOUNT';
                      log.subAction = 'AMOUNT_WON';
                      log.amount = profit;
                      if (profit < 0) log.subAction = 'AMOUNT_LOST';
                      log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                      log.marketId = market.marketId;
                      log.marketName = 'wheelSpiner';
                      log.eventId = market.marketId;
                      log.eventName = 'wheelSpiner';
                      log.eventTypeId = 50;
                      log.eventTypeName = 'wheelSpiner';
                      log.manager = userone.manager;
                      log.time = new Date();
                      log.deleted = false;
                      log.save(function (err) {
                        if (err) {
                          logger.error('close-market: Log entry failed for ' + userone.username);
                        }
                      });
                      //log end
                    });
                    //wheelspinner auto settlement log
                    getRunnerWheelProfit(market);


                  })(userone, market, profit, oldLimit);
                });
                }
              });
            }
          });
        })(users[i], market);
      }
    });
  });
}

function getRunnerWheelProfit(market) {
  Othermarket.findOne({
    marketId: market.marketId
  }, function (err, market) {
    if (err) logger.error(err);
    Login.find({
      role: 'manager',
      deleted: false
    }, {
      username: 1
    }, function (err, managers) {
      for (var i = 0; i < managers.length; i++) {
        calculateRunnerWheelProfit(market, managers[i].username);
      }
    });


  });

}


function calculateRunnerWheelProfit(market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Othermarket.update({
        marketId: market.marketId,
        deleted: false,
        'marketBook.status': 'CLOSED'
      }, {
        $set: {
          winner: w
        }
      }, function (err, raw) {});
    }
    runnerProfit[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({
        marketId: market.marketId,
        manager: manager,
        status: 'MATCHED',
        deleted: false
      }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            } else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Othermarket.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) {});
          }
        }
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
              } else {
                runnerProfit[k] -= Math.round(val.stake);
              }
            }
          }

          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }
            if (market.managerProfit) {
              market.managerProfit[manager] = runnerProfit[w];
            } else {
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Othermarket.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) {});


          }
        });
      });
    }
  });
}


module.exports.addToRoom = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.marketId && !request.eventId) return;
  logger.info("addToRoom: " + JSON.stringify(request));

  if (request.marketId) {
    socket.join(request.marketId);
    Room.findOne({
      roomId: request.marketId,
      type: 'market'
    }, function (err, room) {
      if (err) logger.error(err);
      if (!room) {
        var roomEntry = new Room();
        roomEntry.socket = null;
        roomEntry.type = 'market';
        roomEntry.roomId = request.marketId;
        roomEntry.username = request.user.details.username;
        roomEntry.save(function (err, newRoomEntry) {
          if (err) logger.error("Error in saving room entry" + err);
        });
      }
    });
  }


  if (request.eventId) {
    if (request.type) {
      if (request.type == 'score') {
        socket.join(request.eventId + '-score');
        Room.findOne({
          roomId: request.eventId,
          type: 'score'
        }, function (err, room) {
          if (err) logger.error(err);
          if (!room) {
            var roomEntry = new Room();
            roomEntry.socket = null;
            roomEntry.type = 'score';
            roomEntry.roomId = request.eventId;
            roomEntry.username = request.user.details.username;
            roomEntry.save(function (err, newRoomEntry) {
              if (err) logger.error("Error in saving room entry" + err);
            });
          }
        });
      }
    } else {
      socket.join(request.eventId);
      Room.findOne({
        roomId: request.eventId,
        type: 'event'
      }, function (err, room) {
        if (err) logger.error(err);
        if (!room) {
          var roomEntry = new Room();
          roomEntry.socket = null;
          roomEntry.type = 'event';
          roomEntry.roomId = request.eventId;
          roomEntry.username = request.user.details.username;
          roomEntry.save(function (err, newRoomEntry) {
            if (err) logger.error("Error in saving room entry" + err);
          });
        }
      });
    }
  }
};

module.exports.removeFromRoom = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.marketId && !request.eventId) return;
  logger.info("removeFromRoom: " + JSON.stringify(request));

  if (request.marketId) {
    socket.leave(request.marketId);
    Room.remove({
      roomId: request.marketId,
      type: 'market',
      username: request.user.details.username
    }, function (err, raw) {
      if (err) logger.error(err);
    });
  }
  if (request.eventId) {
    if (request.type) {
      if (request.type == 'score') {
        socket.leave(request.eventId + '-score');
        Room.remove({
          roomId: request.eventId,
          type: 'score',
          username: request.user.details.username
        }, function (err, raw) {
          if (err) logger.error(err);
        });
      }
    } else {
      socket.leave(request.eventId);
      Room.remove({
        roomId: request.eventId,
        type: 'event',
        username: request.user.details.username
      }, function (err, raw) {
        if (err) logger.error(err);
      });
    }
  }
};

// @description
module.exports.marketPulse = function (io) {
  if (!io) return;
  Room.distinct('roomId', {
    type: 'market'
  }, function (err, dbRoomIds) {
    if (err) logger.debug(err);
    if (dbRoomIds.length > 0) {
      Market.find({
        marketId: {
          $in: dbRoomIds
        }
      }, function (err, dbMarkets) {
        if (err) logger.debug(err);
        if (dbMarkets) {
          dbMarkets.forEach(function (market, index) {
            io.self.to(market.marketId).emit('market-pulse-' + market.marketId, market);
          });
        }
      });
    }
  });
};

module.exports.marketteenpatPulse = function (io) {
  //console.log('teenpati');
  if (!io) return;

  Market.find({
    eventName: "Teenpati20",
  }).limit(1).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {

      dbMarkets.forEach(function (market, index) {
        io.self.emit('market-pulse-teenpati', market);
        // console.log(market.marketId);

      });
    }
  });


};

module.exports.marketOneDayPulse = function (io) {
  //console.log('teenpati');
  if (!io) return;

  Market.find({
    eventName: "TeenpatiOneDay",
  }).limit(1).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {

      dbMarkets.forEach(function (market, index) {
        io.self.emit('market-pulse-teenpatione', market);
        // console.log(market.marketId);

      });
    }
  });


};

module.exports.resultteenpatPulse = function (io) {
  //console.log('teenpati');
  if (!io) return;

  TeenpatiResult.find({}).limit(8).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {

     teenpatiAll(io);
      io.self.emit('result-pulse-teenpati', dbMarkets);


    }
  });


};


function teenpatiAll (io) {
  //console.log('teenpati');
  if (!io) return;

  TeenpatiResult.find({}).limit(8).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {


      io.self.emit('result-pulse-teenpatione', dbMarkets);


    }
  });


};

module.exports.eventPulse = function (io) {
  if (!io) return;
  Room.distinct('roomId', {
    type: 'event'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Market.find({
        eventId: {
          $in: dbRoomIds
        },
        visible: true,
        deleted: false,
        "marketBook.status": {
          $ne: 'CLOSED'
        }
      }, function (err, dbMarkets) {
        if (err) logger.error(err);
        dbRoomIds.forEach(function (roomId, index) {
          outputDbMarkets = [];
          for (var i = 0; i < dbMarkets.length; i++) {
            if (dbMarkets[i].eventId == roomId) {
              outputDbMarkets.unshift(dbMarkets[i]);
            }
          }
          if (outputDbMarkets.length != 0) {
            io.self.to(roomId).emit('event-pulse-' + roomId, outputDbMarkets);
          }
        });
      });
    }
  });
};

module.exports.scorePulse = function (io) {
  if (!io) return;
  Room.distinct('roomId', {
    type: 'score'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Score.find({
        eventId: {
          $in: dbRoomIds
        },
        visible: true,
        deleted: false
      }, function (err, dbScores) {
        if (err) logger.error(err);
        dbRoomIds.forEach(function (roomId, index) {
          for (var i = 0; i < dbScores.length; i++) {
            if (dbScores[i].eventId == roomId) {
              io.self.to(roomId + '-score').emit('score-pulse-' + roomId, dbScores[i]);
            }
          }
        });
      });
    }
  });
};