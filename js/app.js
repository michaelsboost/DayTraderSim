/*
  Version: 0.0.1
  Crypto Paper Trader, copyright (c) by Michael Schwartz
  Distributed under the MIT license: https://github.com/michaelsboost/Crypto-Paper-Trader/blob/gh-pages/LICENSE
  This is Crypto Paper Trader (https://michaelsboost.github.io/Crypto-Paper-Trader), Day trade crypto with out risking any money!
*/

// variables
var timer, timer1, timer2, shorting;
var now, month, currentDate, year, activeDate;
var balanceTxt, cashIn, closedPrice, currentBalance, gainorLoss, priceTimes, finalPrice, leveraged;
var priceOrder  = document.getElementById("priceorder")
var buyBtn      = document.getElementById("buy")
var sellBtn     = document.getElementById("sell")
var cash        = document.getElementById("cash")
var leverageElm = document.getElementById("leverage")
var activeOrder = false

// balance button
cash.onclick = function() {
  Swal.fire({
    title: "Warning! Clears your history!!",
    input: 'number',
    inputValue: '1000.00',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!'
      } else {
        cash.textContent = '$' + parseFloat(value).toLocaleString() + '.00'
        $('[data-output=orderhistory], [data-output=position]').html('')
      }
    }
  })
}

// buy button
buy.onclick = function() {
  now = new Date()
  month = now.getMonth() + 1
  currentDate = now.getDate()
  year = now.getFullYear()
  activeDate = month + '/' + currentDate + '/' + year + ' '
  
  // start order
  if (this.disabled === false) {
    // no active orders
    if (sell.disabled === false) {
      shorting = false
      console.log("shorting false")
  
      // grab current balance
      balanceTxt = cash.textContent;
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // does the user have enough funds to execute this order?
      if (parseFloat(priceOrder.value) > parseFloat(balanceTxt)) {
        alert('insufficient funds')
        return false
      } else {
        cashIn = parseFloat(priceOrder.value).toFixed(2)
        currentBalance = parseFloat(balanceTxt).toFixed(2);
        watchPL()
      }
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin').text() +'</td><td>'+ priceOrder.value +'</td><td>Buy</td></tr>')
      this.disabled = true
    } else {
      // grab current balance
      balanceTxt = cash.textContent;
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // closing active short selling position
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin').text() +'</td><td>'+ priceOrder.value +'</td><td>Buy</td></tr>')
      this.disabled = false
      sell.disabled = false
      shorting = false
      console.log("shorting false")
      
      // finally add to balance
      gainorLoss = parseFloat(parseFloat(parseFloat(cashIn) - parseFloat(priceOrder.value)) * parseFloat($("#leverage option:selected").val())).toFixed(2)
      stopPL()
    }
  } else {
    this.disabled = false
  }
}

// sell button
sell.onclick = function() {
  now = new Date()
  month = now.getMonth() + 1
  currentDate = now.getDate()
  year = now.getFullYear()
  activeDate = month + '/' + currentDate + '/' + year + ' '
  
  // start order
  if (this.disabled === false) {
    // yes active orders
    if (buy.disabled === true) {
      // grab current balance
      balanceTxt = cash.textContent;
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // closing active long position
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin').text() +'</td><td>'+ priceOrder.value +'</td><td>Sell</td></tr>')
      buy.disabled = false
      this.disabled = false
      shorting = false
      console.log("shorting false")
      
      // finally add to balance
      gainorLoss = parseFloat(parseFloat(parseFloat(priceOrder.value) - parseFloat(cashIn)) * parseFloat($("#leverage option:selected").val())).toFixed(2)
      stopPL()
    } else {
      // grab current balance
      balanceTxt = cash.textContent;
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // does the user have enough funds to execute this order?
      if (parseFloat(priceOrder.value) > parseFloat(balanceTxt)) {
        alert('insufficient funds')
        return false;
      }
      
      // no active order (short sell)
      shorting = true
      console.log("shorting true")
      cashIn = parseFloat(priceOrder.value).toFixed(2)
      currentBalance = parseFloat(balanceTxt).toFixed(2)
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin').text() +'</td><td>'+ priceOrder.value +'</td><td>Sell</td></tr>')
      this.disabled = true
      watchPL()
      leverageElm.disabled = true
      console.log("start watching")
    }
  } else {
    this.disabled = false
  }
}

// ticker chart
new TradingView.widget({
  "width": "100%",
  "height": window.innerHeight,
  "symbol": "BINANCE:" + $('#coin').text(),
  "interval": "1",
  "timezone": "Etc/UTC",
  "theme": "dark",
  "style": "1",
  "locale": "en",
  "toolbar_bg": "#f1f3f6",
  "enable_publishing": false,
  "hide_side_toolbar": false,
  "allow_symbol_change": false,
  "hotlist": true,
  "calendar": true,
  "details": true,
  "studies": [
    "BB@tv-basicstudies",
    "Volume@tv-basicstudies",
    "VWAP@tv-basicstudies"
  ],
  "news": [
    "headlines"
  ],
  "container_id": "tradingview_0b60e"
})
watchTicker()

// watch the ticker price
function buildTicker() {
  var burl = 'https://api.binance.com/api/v3/ticker/price?symbol='
  var symbol = $('#coin').text()
  var url = burl + symbol
  var ourRequest = new XMLHttpRequest()

  ourRequest.open('GET', url, true)
  ourRequest.onload = function() {
    var str = ourRequest.responseText
    var strOBJ = JSON.parse(str)
    priceorder.value = parseFloat(strOBJ.price)
  }
  ourRequest.send()
}
function watchTicker() {
  clearTimeout(timer1)
  timer1 = setInterval(buildTicker, 100)
  return false
}
function stopTicker() {
  clearTimeout(timer1)
  return false
}

// watch the p&l
function buildPL() {
  // detect profit loss
  if (shorting === true) {
    gainorLoss = parseFloat(parseFloat(cashIn) - parseFloat(priceOrder.value)).toFixed(2)
    gainorLoss = parseFloat(gainorLoss * parseFloat($("#leverage option:selected").val())).toFixed(2)
  } else {
    gainorLoss = parseFloat(parseFloat(priceOrder.value) - parseFloat(cashIn)).toFixed(2)
    gainorLoss = parseFloat(gainorLoss * parseFloat($("#leverage option:selected").val())).toFixed(2)
  }
  console.log("gainorLoss: " + gainorLoss)

  // active position
  cash.disabled = true
  cash.style.cursur = 'default'
  closedPrice = priceOrder.value
  $("[data-trade=symbol]").text($('#coin').text())
  $("[data-trade=price]").text(closedPrice)
  $("[data-pl=open]").text(gainorLoss)
}
function watchPL() {
  $("[data-clone=position]").show()
  clearTimeout(timer2)
  timer2 = setInterval(buildPL, 100)
  return false
}
function stopPL() {
  // finally add to balance  
  balanceTxt = cash.textContent;
  balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
  finalPrice = parseFloat(parseFloat(balanceTxt) + parseFloat(gainorLoss)).toFixed(2)
  balanceTxt = "$" + parseFloat(finalPrice).toLocaleString()
  cash.textContent = balanceTxt;
  clearTimeout(timer2)
  
  cash.disabled = false
  cash.style.cursur = 'pointer'
  $("[data-output=position]").prepend('<tr><td>'+ $("[data-trade=symbol]").text() +'</td><td>'+ $("[data-trade=price]").text() +'</td><td>0.00</td><td>'+ gainorLoss +'</td></tr>').show()
  $("[data-clone=position]").hide()
  leverageElm.disabled = false
  
  $("[data-trade=symbol]").text(" ")
  $("[data-trade=price]").text(" ")
  $("[data-pl=open]").text(" ")
  $("[data-pl=closed]").text(" ")
  return false
}