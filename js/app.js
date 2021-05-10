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
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $(".controls select option:selected").val() +'</td><td>'+ priceOrder.value +'</td><td>Buy</td></tr>')
      this.disabled = true
    } else {
      // grab current balance
      balanceTxt = cash.textContent;
      balanceTxt = balanceTxt.substr(1, balanceTxt.length).replace(/,/g, '')
      
      // active (short selling)
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $(".controls select option:selected").val() +'</td><td>'+ priceOrder.value +'</td><td>Buy</td></tr>')
      this.disabled = false
      sell.disabled = false
      shorting = false
      console.log("shorting false")
      
      // finally add to balance
      gainorLoss = parseFloat(parseFloat(cashIn) - parseFloat(priceOrder.value)).toFixed(2)
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
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $(".controls select option:selected").val() +'</td><td>'+ priceOrder.value +'</td><td>Sell</td></tr>')
      buy.disabled = false
      this.disabled = false
      shorting = false
      console.log("shorting false")
      
      // finally add to balance
      var gainorLoss = parseFloat(parseFloat(cashIn) + parseFloat(priceOrder.value)).toFixed(2)
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
      
      $("[data-output=orderhistory]").prepend('<tr><td>'+ activeDate + now.toLocaleTimeString() +'</td><td>'+ $(".controls select option:selected").val() +'</td><td>'+ priceOrder.value +'</td><td>Sell</td></tr>')
      this.disabled = true
      watchPL()
      $(".controls select")[0].disabled = true
      leverageElm.disabled = true
      console.log("start watching")
    }
  } else {
    this.disabled = false
  }
}

// watch the ticker price
function buildTicker() {
  var str = $(".price span").text()
  priceOrder.value = str.substr(1, str.length)
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
watchTicker()

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

  // active position
  closedPrice = priceOrder.value
  $("[data-trade=symbol]").text($(".controls select option:selected").val())
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
  if (shorting === true) {
    // is this a profit or a loss
    if (gainorLoss >= 0) {
      console.log(parseFloat(parseFloat(gainorLoss) + parseFloat(currentBalance)).toFixed(2))
    } else {
      console.log(parseFloat(parseFloat(gainorLoss) - parseFloat(currentBalance)).toFixed(2))
    }
  } else {
    // finally add to balance
    priceTimes = Math.floor(parseFloat(currentBalance) / closedPrice)
    closedPrice = parseFloat(parseFloat(gainorLoss) * parseFloat(priceTimes))
    finalPrice = parseFloat(parseFloat(currentBalance) + parseFloat(closedPrice)).toFixed(2)
  }
  clearTimeout(timer2)
  
  gainorLoss = parseFloat(parseFloat(gainorLoss) * parseFloat(priceTimes))
  $("[data-output=position]").prepend('<tr><td>'+ $("[data-trade=symbol]").text() +'</td><td>'+ $("[data-trade=price]").text() +'</td><td>0.00</td><td>'+ gainorLoss +'</td></tr>').show()
  $("[data-clone=position]").hide()
  cash.textContent = "$" + parseFloat(finalPrice).toLocaleString()
  balanceTxt = cash.textContent
  $(".controls select")[0].disabled = false
  leverageElm.disabled = false
  
  $("[data-trade=symbol]").text(" ")
  $("[data-trade=price]").text(" ")
  $("[data-pl=open]").text(" ")
  $("[data-pl=closed]").text(" ")
  return false
}