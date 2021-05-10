// var theme = "metro";
var theme = "metrodark";

// initiate splitter
$('#mainSplitter, #leftSplitter, #midSplitter, #rightSplitter').jqxSplitter({
  width: "100%",
  height: "100%",
  theme: theme
});
$('#mainSplitter').jqxSplitter({
  panels: [{ size: "30%" }]
});

// splitter orientation
$('#leftSplitter, #midSplitter, #rightSplitter').jqxSplitter({
  orientation: 'horizontal'
});

// splitter left column default size
$('#leftSplitter').jqxSplitter({
  panels: [{ size: "70%", collapsible: false }]
});
$('#midSplitter').jqxSplitter({
  panels: [{ size: "50%" }]
});

// splitter right don't collapse ticker
$('#rightSplitter').jqxSplitter({
  panels: [{ size: "70%", collapsible: false }]
});