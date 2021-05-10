"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var DEFAULT_CANDLE_COUNT = 80;
var DEFAULT_CANDLE_INTERVAL = 300000;
var DEFAULT_PRODUCT = "LTC-USD";

var FEED_URL = "wss://ws-feed.gdax.com";
var HISTORY_API = "https://api.gdax.com/products/";

var _ws = null;
var _interval = null;

Vue.filter("price", function (value, product) {
  var unit = "usd";

  if (product) {
    unit = product.split("-")[1].toLowerCase();
  }

  if (unit === "usd") {
    return "$" + parseFloat(Math.round(value * 100) / 100).toFixed(2);
  } else {
    return "" + value;
  }
});

async function getOldCandles(product, interval) {
  return new Promise(function (resolve, reject) {
    $.getJSON(HISTORY_API + "/" + product + "/candles?granularity=" + interval / 1000, function (response) {
      response = response.sort(function (a, b) {
        return a[0] - b[0];
      });
      for (var i = 1; i < response.length; i++) {
        response[i][3] = response[i - 1][4];
      }
      var candles = response.map(function (candle) {
        return {
          open: candle[3],
          close: candle[4],
          min: candle[1],
          max: candle[2]
        };
      });
      resolve(candles);
    });
  });
}

var ticker = new Vue({
  el: "#ticker",
  data: {
    product: DEFAULT_PRODUCT,
    candles: [],
    candleCount: DEFAULT_CANDLE_COUNT,
    current: {
      open: 0,
      close: 0,
      min: Infinity,
      max: 0
    },
    interval: DEFAULT_CANDLE_INTERVAL
  },
  computed: {
    displayCandles: function displayCandles() {
      if (this.candles.length > this.candleCount) {
        return this.candles.slice(Math.max(this.candles.length - this.candleCount, 1));
      } else {
        return this.candles;
      }
    },
    displayBoundsCandles: function displayBoundsCandles() {
      if (this.candles.length > this.candleCount * 2) {
        return this.candles.slice(Math.max(this.candles.length - this.candleCount * 2, 1));
      } else {
        return this.candles;
      }
    },
    displayMax: function displayMax() {
      return Math.max.apply(null, [].concat(_toConsumableArray(this.displayBoundsCandles.map(function (v) {
        return v.max;
      })), [this.current.max]));
    },
    displayMin: function displayMin() {
      return Math.min.apply(null, [].concat(_toConsumableArray(this.displayBoundsCandles.map(function (v) {
        return v.min;
      })), [this.current.min]));
    },
    labels: function labels() {
      var min = this.displayMin;
      var max = this.displayMax;
      var diff = max - min;

      if (diff === 0) {
        return [];
      }

      var step = diff / 5;

      var arr = [];

      for (var i = 0; i <= 5 + 1; i++) {
        var val = min + i * step;
        val = parseFloat(Math.round(val * 100) / 100).toFixed(2);
        arr.push(val);
      }

      arr = arr.filter(function (item, i) {
        return arr.indexOf(item) === i;
      });

      return arr;
    }
  },
  mounted: function mounted() {
    this.init();
  },
  watch: {
    product: function product() {
      this.init();
    },
    interval: function interval() {
      this.init();
    }
  },
  methods: {
    init: async function init() {
      var _this = this;

      var product = this.product;

      this.candles.splice(0);
      this.current.open = 0;
      this.current.close = 0;
      this.current.min = Infinity;
      this.current.max = 0;

      var candles = void 0;

      if (this.interval >= 10000) {
        candles = await getOldCandles(this.product, this.interval);
        this.current.open = candles[candles.length - 1].close;
        this.current.close = candles[candles.length - 1].close;
      } else {
        candles = [];
      }

      this.candles = candles;

      if (_ws) {
        _ws.close();
      }

      _ws = new WebSocket(FEED_URL);
      _ws.onopen = function () {
        _ws.send(JSON.stringify({
          type: "subscribe",
          product_ids: [_this.product],
          channels: ["ticker", {
            name: "ticker",
            product_ids: [_this.product]
          }]
        }));
      };

      _ws.onmessage = function (evt) {
        var response = JSON.parse(evt.data);
        var price = {
          // sequence: response.sequence,
          // time: new Date(response.time),
          value: parseFloat(response.price)
        };
        if (price.value) ticker.add(price, product);
      };

      if (_interval) {
        clearInterval(_interval);
      }

      _interval = setInterval(function () {
        var historicVal = {
          open: _this.current.open,
          close: _this.current.close,
          min: _this.current.min,
          max: _this.current.max
        };

        _this.candles.push(historicVal);
        _this.current.open = historicVal.close;
        _this.current.close = historicVal.close;
        _this.current.min = Infinity;
        _this.current.max = 0;
      }, this.interval);
    },
    add: function add(price, product) {
      if (product !== this.product) {
        return;
      }

      this.current.close = price.value;
      this.current.open = this.current.open || price.value;
      if (price.value > this.current.max) {
        this.current.max = price.value;
      }
      if (price.value < this.current.min) {
        this.current.min = price.value;
      }
    },
    getCandleHeight: function getCandleHeight(open, close) {
      if (open === Infinity || close === Infinity) {
        return 0;
      }
      var diff = Math.abs(open - close);
      var window = this.displayMax - this.displayMin;
      var heightPerc = diff / window * 100;
      return heightPerc + "%";
    },
    getCandleOffset: function getCandleOffset(open, close) {
      if (open === Infinity || close === Infinity) {
        return 0;
      }

      var top = Math.max(open, close);

      if (!close) {
        top = open;
      }

      var window = this.displayMax - this.displayMin;
      var positionPerc = 100 - (top - this.displayMin) / window * 100;
      return positionPerc + "%";
    }
  }
});