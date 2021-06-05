/*
  Version: 0.0.2
  Crypto Paper Trader, copyright (c) by Michael Schwartz
  Distributed under the MIT license: https://github.com/michaelsboost/Crypto-Paper-Trader/blob/gh-pages/LICENSE
  This is Crypto Paper Trader (https://michaelsboost.github.io/Crypto-Paper-Trader), Day trade crypto with out risking any money!
*/

// variables
var timer, timer1, timer2, shorting;
var now, month, currentDate, year, activeDate;
var balanceTxt, cashIn, closedPrice, currentBalance, gainorLoss, priceTimes, finalPrice;
var priceOrder  = document.getElementById("priceorder")
var buyBtn      = document.getElementById("buy")
var sellBtn     = document.getElementById("sell")
var cash        = document.getElementById("cash")
var coin        = document.getElementById("coin")
var leverageElm = document.getElementById("leverage")

// Is there localStorage?
if (localStorage) {
  if (localStorage.getItem("rememberLeverage")) {
    leverageElm.value = localStorage.getItem("rememberLeverage")
  }
  if (localStorage.getItem("rememberBalance")) {
    cash.textContent = localStorage.getItem("rememberBalance")
  }
  if (localStorage.getItem("orderHistory")) {
    $('[data-output=orderhistory]').html(localStorage.getItem("orderHistory"))
  }
  if (localStorage.getItem("orderPositions")) {
    $('[data-output=position]').html(localStorage.getItem("orderPositions")).show()
  }
}

// balance button
cash.onclick = function() {
  // balanceTxt = cash.textContent
  // balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')

  Swal.fire({
    title: "Warning! Clears your history!!",
    input: 'number',
    inputValue: '',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!'
      }
    }
  }).then(function(result) {
    if (result.value) {
      localStorage.clear()
      var newBal = '$' + parseFloat(result.value).toLocaleString() + '.00'
      leverageElm.value = '1'
      $('[data-output=orderhistory], [data-output=position]').html('')
      cash.textContent = ''
      cash.textContent = newBal
      localStorage.setItem("rememberBalance", cash.textContent)
      // localStorage.removeItem("rememberLeverage")
      // localStorage.removeItem("rememberBalance")
      // localStorage.removeItem("orderHistory")
      // localStorage.removeItem("orderPositions")
    }
  })
}

// Hotkeys/Shortcut keys
window.addEventListener("keydown", function(e) {
  // Hotkey to buy (B)
  if ( e.keyCode == 66 ) {
    $("#buy").trigger("click")
  }
  // Hotkey to sell (S)
  if ( e.keyCode == 83 ) {
    $("#sell").trigger("click")
  }
})
buy.setAttribute("title", "Initiate a Buy Order")
sell.setAttribute("title", "Initiate a Sell Order")

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
      balanceTxt = cash.textContent
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // does the user have enough funds to execute this order?
      if (parseFloat(priceOrder.value) > parseFloat(balanceTxt)) {
        alert('insufficient funds')
        return false
      } else {
        cashIn = parseFloat(priceOrder.value)
        currentBalance = parseFloat(balanceTxt).toFixed(2)
        watchPL()
      }
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin option:selected').val() +'</td><td>'+ priceOrder.value +'</td><td>Buy</td></tr>')
      this.disabled = true
    } else {
      // grab current balance
      balanceTxt = cash.textContent
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // closing active short selling position
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin option:selected').val() +'</td><td>'+ priceOrder.value +'</td><td>Buy</td></tr>')
      this.disabled = false
      sell.disabled = false
      shorting = false
      console.log("shorting false")
      
      // finally add to balance
      console.log("gainorLoss: " + gainorLoss)
      // gainorLoss = parseFloat(parseFloat(parseFloat(cashIn) - parseFloat(priceOrder.value)) * parseFloat($("#leverage option:selected").val())).toFixed(2)

      // how many times does the balance go into the cashIn value
      priceTimes = parseFloat(balanceTxt / cashIn)
      activePL = ""
      activePL = parseFloat(parseFloat(gainorLoss) * parseFloat(priceTimes))
      gainorLoss = parseFloat(activePL).toFixed(2)

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
      balanceTxt = cash.textContent
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // closing active long position
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin option:selected').val() +'</td><td>'+ priceOrder.value +'</td><td>Sell</td></tr>')
      buy.disabled = false
      this.disabled = false
      shorting = false
      console.log("shorting false")
      
      // finally add to balance
      gainorLoss = parseFloat(parseFloat(parseFloat(priceOrder.value) - parseFloat(cashIn)) * parseFloat($("#leverage option:selected").val()))

      // how many times does the balance go into the cashIn value
      priceTimes = parseFloat(balanceTxt / cashIn)
      activePL = ""
      activePL = parseFloat(parseFloat(gainorLoss) * parseFloat(priceTimes))
      gainorLoss = parseFloat(activePL).toFixed(2)

      stopPL()
    } else {
      // grab current balance
      balanceTxt = cash.textContent
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // does the user have enough funds to execute this order?
      if (parseFloat(priceOrder.value) > parseFloat(balanceTxt)) {
        alert('insufficient funds')
        return false
      }
      
      // no active order (short sell)
      shorting = true
      console.log("shorting true")
      cashIn = parseFloat(priceOrder.value)
      currentBalance = parseFloat(balanceTxt).toFixed(2)
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $('#coin option:selected').val() +'</td><td>'+ priceOrder.value +'</td><td>Sell</td></tr>')
      this.disabled = true
      watchPL()
      leverageElm.disabled = true
      console.log("start watching")
    }
  } else {
    this.disabled = false
  }
}

/*
// clears hash
window.location.href = window.location.toString().split(/\?|#/)[0];
*/

// detect window hash
var hash = window.location.hash
if (!hash) {
  window.location.hash = 'LTCUSDT'
  location.reload(true)
} else {
  hash = hash.substr(1, hash.length)
  $('#coin option[value='+ hash +']').prop('selected', true)
  
  // ticker chart
  new TradingView.widget({
    "width": "100%",
    "height": window.innerHeight,
    "symbol": "BINANCE:" + $('#coin option:selected').val(),
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
      "BB@tv-basicstudies"
    ],
    "news": [
      "headlines"
    ],
    "container_id": "tradingview_0b60e"
  })
  watchTicker()
}

// add hash from change and reload
$('#coin')[0].onchange = function() {
  window.location.hash = this.value
  location.reload(true)
}

// remember leverage
leverageElm.onchange = function() {
  localStorage.setItem("rememberLeverage", this.value)
}

// watch the ticker price
function buildTicker() {
  var burl = 'https://api.binance.com/api/v3/ticker/price?symbol='
  var symbol = $('#coin option:selected').val()
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
    gainorLoss = parseFloat(parseFloat(cashIn) - parseFloat(priceOrder.value))
    gainorLoss = parseFloat(gainorLoss * parseFloat($("#leverage option:selected").val()))
  } else {
    gainorLoss = parseFloat(parseFloat(priceOrder.value) - parseFloat(cashIn))
    gainorLoss = parseFloat(gainorLoss * parseFloat($("#leverage option:selected").val()))
  }
  
  // how many times does the balance go into the cashIn value
  priceTimes = parseFloat(balanceTxt / cashIn)
  activePL = ""
  activePL = parseFloat(parseFloat(gainorLoss) * parseFloat(priceTimes))
  var gainrLoss = parseFloat(activePL).toFixed(2)

  // active position
  leverageElm.disabled = true
  cash.disabled = true
  coin.disabled = true
  if (!$('#cash').hasClass('noclick')) {
    $('#cash').addClass('noclick')
  }
  closedPrice = priceOrder.value
  closedPrice = priceOrder.value
  $("[data-trade=symbol]").text($('#coin option:selected').val())
  $("[data-trade=price]").text(closedPrice)
  $("[data-pl=open]").text(gainrLoss)
}
function watchPL() {
  $("[data-clone=position]").show()
  clearTimeout(timer2)
  timer2 = setInterval(buildPL, 100)
  return false
}
function stopPL() {
  // finally add to balance  
  balanceTxt = cash.textContent
  balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
  finalPrice = parseFloat(parseFloat(balanceTxt) + parseFloat(gainorLoss)).toFixed(2)
  balanceTxt = "$" + parseFloat(finalPrice).toLocaleString()
  cash.textContent = balanceTxt
  localStorage.setItem("rememberBalance", balanceTxt)
  clearTimeout(timer2)
  
  cash.disabled = false
  coin.disabled = false
  $('#cash').removeClass('noclick')
  $("[data-output=position]").prepend('<tr><td>'+ $("[data-trade=symbol]").text() +'</td><td>'+ $("[data-trade=price]").text() +'</td><td>0.00</td><td>'+ gainorLoss +'</td></tr>').show()
  $("[data-clone=position]").hide()
  localStorage.setItem("orderHistory", $('[data-output=orderhistory]').html())
  localStorage.setItem("orderPositions", $('[data-output=position]').html())
  leverageElm.disabled = false
  
  $("[data-trade=symbol]").text(" ")
  $("[data-trade=price]").text(" ")
  $("[data-pl=open]").text(" ")
  $("[data-pl=closed]").text(" ")
  return false
}
