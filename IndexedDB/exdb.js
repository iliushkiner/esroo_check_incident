(function (window, undefined) {
    "use strict";

    //Queue Class
    var Queue = function () {
        var self = this;
        this.list = new Array();
        this.busy = false;
        this.interval = 10;

        self.add = function (fn) {
            self.list.push(fn);
            return self;
        };
        self.done = function () {
            self.busy = false;
        };
        self.run = function () {
            if (!self.busy) {
                self.busy = true;
                var fn = self.list.shift();
                fn();
            } else {
                setTimeout(self.run, self.interval);
            }
            return self;
        };

    };

    //Bridge Class
    var exDB = function () {
        var self = this;
        //this.extensionId = arguments[0] || "ckmokkioicjdcecfdjjioldiobemmhih";
        this.filterList = new Array();
        this.queue = new Queue();
        this._table;
        this._query;
        self.sendMessage = function sendMessage(data, callback) {
            var fn = function () {
                chrome.runtime.sendMessage(/*self.extensionId,*/ data, function (result) {
                    if (result && result.RUNTIME_ERROR) {
                        console.error(result.RUNTIME_ERROR.message);
                        result = null;
                    }
                    callback(result);
                    self.queue.done();
                });
            };
            self.queue.add(fn);
            self.queue.run();
        };

        self.open = function (params, callback) {
            self.sendMessage({"cmd": "open", "params": params}, function (r) {
                var tn;
                if(typeof(r) != "undefined"){
                  for (var i = 0; i < r.length; i++)
                    tn = r[i];
                }
                self.__defineGetter__(tn, function () {
                    self._table = tn;
                    return this;
                });
                callback();
            });
            //self._table = params
            return self;
        };

        self.close = function (callback) {
            self.sendMessage({"cmd": "close", "params": {}}, callback);
            return self;
        }

        self.table = function (name) {
            self._table = name;
            return self;
        };

        self.query = function () {
            self._query = arguments;
            return self;
        };

        self.execute = function (callback) {
            self.sendMessage({"cmd": "execute", "table": self._table, "query": self._query, "filters": self.filterList}, callback);
            self._query = null;
            self.filterList = [];
        };

        self.getUsageAndQuota = function (callback) {
            self.sendMessage({"cmd": "getUsageAndQuota"}, callback);
        }

        "add update remove get".split(" ").forEach(function (fn) {
            self[fn] = function (item, callback) {
                self.sendMessage({"cmd": fn, "table": self._table, "params": item}, callback);
                return self;
            }
        });

        "all only lowerBound upperBound bound filter desc distinct keys count".split(" ").forEach(function (fn) {
            self[fn] = function () {
                self.filterList.push({type: fn, args: arguments});
                return self;
            }
        });

    }

    window.exDB = exDB;
})(window, undefined);