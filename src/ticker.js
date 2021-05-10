const DEFAULT_CANDLE_COUNT = 80;
const DEFAULT_CANDLE_INTERVAL = 300000;
const DEFAULT_PRODUCT = "LTC-USD";

const FEED_URL = "wss://ws-feed.gdax.com";
const HISTORY_API = "https://api.gdax.com/products/";

let _ws = null;
let _interval = null;

Vue.filter("price", function (value, product) {
  let unit = "usd";

  if (product) {
    unit = product.split("-")[1].toLowerCase();
  }

  if (unit === "usd") {
    return `$${parseFloat(Math.round(value * 100) / 100).toFixed(2)}`;
  } else {
    return `${value}`;
  }
});

async function getOldCandles(product, interval) {
  return new Promise((resolve, reject) => {
    $.getJSON(
      `${HISTORY_API}/${product}/candles?granularity=${interval / 1000}`,
      function (response) {
        response = response.sort((a, b) => a[0] - b[0]);
        for (var i = 1; i < response.length; i++) {
          response[i][3] = response[i - 1][4];
        }
        const candles = response.map((candle) => ({
          open: candle[3],
          close: candle[4],
          min: candle[1],
          max: candle[2]
        }));
        resolve(candles);
      }
    );
  });
}

const ticker = new Vue({
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
    displayCandles: function () {
      if (this.candles.length > this.candleCount) {
        return this.candles.slice(
          Math.max(this.candles.length - this.candleCount, 1)
        );
      } else {
        return this.candles;
      }
    },
    displayBoundsCandles: function () {
      if (this.candles.length > this.candleCount * 2) {
        return this.candles.slice(
          Math.max(this.candles.length - this.candleCount * 2, 1)
        );
      } else {
        return this.candles;
      }
    },
    displayMax: function () {
      return Math.max.apply(null, [
        ...this.displayBoundsCandles.map((v) => v.max),
        this.current.max
      ]);
    },
    displayMin: function () {
      return Math.min.apply(null, [
        ...this.displayBoundsCandles.map((v) => v.min),
        this.current.min
      ]);
    },
    labels: function () {
      const min = this.displayMin;
      const max = this.displayMax;
      const diff = max - min;

      if (diff === 0) {
        return [];
      }

      const step = diff / 5;

      var arr = [];

      for (var i = 0; i <= 5 + 1; i++) {
        let val = min + i * step;
        val = parseFloat(Math.round(val * 100) / 100).toFixed(2);
        arr.push(val);
      }

      arr = arr.filter((item, i) => arr.indexOf(item) === i);

      return arr;
    }
  },
  mounted: function () {
    this.init();
  },
  watch: {
    product: function () {
      this.init();
    },
    interval: function () {
      this.init();
    }
  },
  methods: {
    init: async function () {
      let product = this.product;

      this.candles.splice(0);
      this.current.open = 0;
      this.current.close = 0;
      this.current.min = Infinity;
      this.current.max = 0;

      let candles;

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
      _ws.onopen = () => {
        _ws.send(
          JSON.stringify({
            type: "subscribe",
            product_ids: [this.product],
            channels: [
              "ticker",
              {
                name: "ticker",
                product_ids: [this.product]
              }
            ]
          })
        );
      };

      _ws.onmessage = (evt) => {
        const response = JSON.parse(evt.data);
        const price = {
          // sequence: response.sequence,
          // time: new Date(response.time),
          value: parseFloat(response.price)
        };
        if (price.value) ticker.add(price, product);
      };

      if (_interval) {
        clearInterval(_interval);
      }

      _interval = setInterval(() => {
        const historicVal = {
          open: this.current.open,
          close: this.current.close,
          min: this.current.min,
          max: this.current.max
        };

        this.candles.push(historicVal);
        this.current.open = historicVal.close;
        this.current.close = historicVal.close;
        this.current.min = Infinity;
        this.current.max = 0;
      }, this.interval);
    },
    add: function (price, product) {
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
    getCandleHeight: function (open, close) {
      if (open === Infinity || close === Infinity) {
        return 0;
      }
      const diff = Math.abs(open - close);
      const window = this.displayMax - this.displayMin;
      const heightPerc = (diff / window) * 100;
      return `${heightPerc}%`;
    },
    getCandleOffset: function (open, close) {
      if (open === Infinity || close === Infinity) {
        return 0;
      }

      let top = Math.max(open, close);

      if (!close) {
        top = open;
      }

      const window = this.displayMax - this.displayMin;
      const positionPerc = 100 - ((top - this.displayMin) / window) * 100;
      return `${positionPerc}%`;
    }
  }
});
