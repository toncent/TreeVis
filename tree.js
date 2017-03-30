//############################
// Variables
//############################
var rightContainer = document.getElementById("rightContainer");
var leftContainer = document.getElementById("leftContainer");
var width, height;
var treeWidth, treeHeight;
var rightNodeHeight, rightNodeWidth, leftNodeWidth, gapHeight;

var previousK = 0;
var animationDuration = 400, longPressDuration = 500;
var lineGenerator;

var rightSVG, leftSVG;
var rightSvgLinkGroup;
var rightSvgNodeGroup;

var root, currentRoot, currentPath = [];
var tree;

var lineHeight = 1.3; //em
var captionOffset = 2.3;//em
var textBoxPadding = lineHeight*16; //px -- usually 1em is 16px
var calculatingRightSide;

var longPressTimeout;
var dragStartY, translationY = 0, minTranslationY, scrollingEnabled = false;

var longPressHappened = false;

var popUpMenu, popUpMenuRadius, arcGenerator, smallArcGenerator, donutChart, menuNodeSVG, menuNode;

var treeVisPatientId, treeVisGraphId, treeVisUser, treeArr, patientArr, medicalActions;

var loadingNode;

//############################
// Initialization
//############################
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
}, false);
fetchDataAndInitialize();

//############################
// Functions
//############################
function fetchDataAndInitialize(){
  //load example tree data from json file
  treeVisGraphId = getCookie("treeVisGraph");
  treeVisPatientId = getCookie("treeVisPatient");
  treeVisUser = getCookie("treeVisUser");
  if (treeVisGraphId) {
    var url = "http://10.200.1.75:8012/tree?hops=10&name=" + treeVisGraphId;
    console.log("fetching tree from "+url)
    d3.json(url).get(null, onTreeDataReturned);
  } else {
    treeVisGraphId = "graphdiarrhea1";
    d3.json("http://10.200.1.75:8012/tree?hops=10&name=graphdiarrhea1").get(null, onTreeDataReturned);
    //window.location.href = "login.html";
  }
  //d3.json("exampleTree.json").get(null, onTreeDataReturned);
}

function onTreeDataReturned(arr){
  if(!arr) {
    //TODO real error handling
    console.log("error fetching tree data. returned data was " + arr);
  } else {
    treeArr = arr;
  }
  if (treeVisPatientId) {
    d3.json("http://10.200.1.75:8016/patients/id/" + treeVisPatientId).get(null, onPatientDataReturned);
  } else {
    onAllDataReturned();
  }
}

function onPatientDataReturned(arr){
  if(!arr) {
    //TODO real error handling
    console.log("error fetching patient data. returned data was " + arr);
  } else {
    patientArr = arr;
  }
  onAllDataReturned();
}

function onAllDataReturned(){
  d3.select("#loader-container").remove();
  d3.select("#main-container").style("display", "block");
  initHtmlElements();

  //extract relevant data from patientArray
  if (patientArr) {
    getPatientData();
  }
  // create a new d3 tree
  tree = d3.tree();
  setupD3Hierarchy(treeArr);
  lineGenerator = d3.line();
  //collapse the tree to only show the currentRoot and it's children
  currentRoot.children.forEach(collapseAllChildren);
  window.addEventListener("resize", init);
  init();
}

function setupD3Hierarchy(arr){
  // create a d3 hierarchy from the data collected from exampleTree.json
  root = d3.hierarchy(arr[0])
  
  currentRoot = root;
  currentPath.push(root);
  currentRoot.x0 = width/2;
  currentRoot.y0 = height/2;
  currentRoot.descendants().forEach(initializeNode);
}

function getPatientData(){
  var data = patientArr.medicalActions;
  medicalActions = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].action.graphId == treeVisGraphId) {
      medicalActions.push(data[i]);
    }
  }
}

function initializeNode(node){
  node.left = {};
  if (medicalActions) {
    for (var i = 0; i < medicalActions.length; i++) {
      if(medicalActions[i].action.name == node.data.name){
        node.data.state = medicalActions[i].state.toLowerCase();
        break;
      }
    };
  };
}

function initHtmlElements(){
  // create an svg element for the tree and add it to the body
  rightSVG = d3.select(rightContainer)
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%");

  //create an svg element for the path
  leftSVG = d3.select(leftContainer)
              .append("svg")
              .attr("width", "100%")
              .attr("height", "100%");

  // create group elements in the svgs for links and nodes
  rightSvgLinkGroup = rightSVG.append("g");
  rightSvgNodeGroup = rightSVG.append("g");

  leftSvgLinkGroup = leftSVG.append("g");
  leftSvgNodeGroup = leftSVG.append("g");

  rightSVG.on("mouseup", stopLongPressTimer)
          .on("click", closePopUpMenu);
}

function init(){
  //check if the right container is currently visible otherwise use the left container for width and height calculations
  if (rightContainer.offsetWidth != 0) {
    width = rightContainer.offsetWidth; 
    height = rightContainer.offsetHeight;
  } else {
    width = leftContainer.offsetWidth; 
    height = leftContainer.offsetHeight;
  }

  //right half initialization
  rightNodeWidth = width*0.30;
  rightNodeHeight = height*0.25;
  rightNodeRadius = Math.min(width, height)*.12;
  treeWidth = width/2 - 2*rightNodeRadius;
  treeHeight = height/2 - 2*rightNodeRadius;

  initPopUpMenu();
  updateTree(currentRoot);

  //left half initialization
  leftNodeWidth = width*0.75;
  updatePath();
}

//creates a line using d3.line() according to the links source and target
//always creates lines so they are drawn from left to right which makes sure
//that any text along the line will not be upside down
function getLine(link){
  if(link.source.x <= link.target.x){
    return lineGenerator([[link.source.x, link.source.y],[link.target.x, link.target.y]]);
  } else {
    return lineGenerator([[link.target.x, link.target.y],[link.source.x, link.source.y]]);
  } 
}

//decides the color of a node depending on its position in the tree
function getNodeClass(node){
  return node.data.type;
}

function insertNodeName(node){
  var textElement = d3.select(this);

  //remove all previous text
  textElement.text(null);
  
  //add the caption to the text element
  textElement.attr("font-size", "1em")
             .text(node.data.name.trim())
             .attr("dominant-baseline", "central")
             .attr("font-style", "italic")
             .each(calculateTextSize)
             .attr("font-size", function(d) {return Math.min(1.3, d.fontSize) + "em"});
  if(node.fontSize < 1) wrapNodeName.bind(this)(node);
}

//splits node name into two lines. If second line is still too long removes letters 
//from the nodename unil it can fit in its text element with text size 1em
function wrapNodeName(node){
  var textElement = d3.select(this);
  textElement.attr("font-size", "1em").text(null);
  var text = node.data.name;
  var wordList = text.split(/\s/).reverse();
  var currentLine = [];
  var lineNumber = 1;
  var currentTspan = textElement.append("tspan")
                                .attr("x", 0)
                                .attr("y", 0)
                                .attr("dy", 0);
  while (currentWord = wordList.pop()){
    currentLine.push(currentWord);
    currentTspan.text(currentLine.join(" "));
    if (currentTspan.node().getComputedTextLength() > rightNodeRadius*2*0.9) {
      if(lineNumber == 2){
        //cut off remaining text
        currentLine.pop();
        //currentLine.push("...");
        var shortenedText = currentLine.join(" ").slice(0,text.length - 3).trim() + "...";
        currentTspan.text(shortenedText);
        break;
      } else {
        //insert a new line
        currentLine.pop();
        currentTspan.text(currentLine.join(" "));
        currentLine = [currentWord];
        currentTspan = textElement.append("tspan").attr("x", 0).attr("y", 0).attr("dy", (lineNumber++*lineHeight) + "em");
        currentTspan.text(currentLine.join(" "));
      }
    }
  }
  //update dominant baseline setting for two lines of text
  textElement.attr("dominant-baseline", "auto");
}

//inserts line breaks into the text so it fits inside the corresponding rectangle
function fillWithText(node){
  var textElement = d3.select(this),
      text = node.data.properties.description,
      lineNumber = 1,
      wordList = text.split(/\s+/).reverse(),
      currentWord,
      currentLine = [],
      y = textElement.attr("y"),
      topOffset = 0.5,
      nodeWidth = calculatingRightSide ? rightNodeWidth : leftNodeWidth;

  //remove all previous text
  textElement.text(null);
  
  //add the caption to the text element
  textElement.append("tspan")
             .attr("x", nodeWidth/2)
             .attr("y", 0)
             .attr("dy", lineHeight + "em")
             .attr("font-size", "1em")
             .text(node.data.name)
             .attr("font-style", "italic")
             .each(calculateTextSize)
             .attr("font-size", function(d) {return Math.min(1.3, d.fontSize) + "em"});

  //add tspans for each line and fill them word-by-word until no more words can fit into that line
  var currentTspan = textElement.append("tspan")
                                .attr("x", nodeWidth/2)
                                .attr("y", 0)
                                .attr("dy",  (captionOffset + lineHeight) + "em");
  while (currentWord = wordList.pop()){
    currentLine.push(currentWord);
    currentTspan.text(currentLine.join(" "));
    if (currentTspan.node().getComputedTextLength() > nodeWidth*0.95) {
        currentLine.pop();
        currentTspan.text(currentLine.join(" "));
        currentLine = [currentWord];
        currentTspan = textElement.append("tspan").attr("x", nodeWidth/2).attr("y", 0).attr("dy", (++lineNumber*lineHeight + captionOffset) + "em");
        currentTspan.text(currentLine.join(" "));
    }
  }
  
  //apply special treatment for left and right side nodes
  if (!calculatingRightSide){
    //save the height that is needed for all text to fit inside the rect
    node.left.textHeight = this.getBBox().height;
  }

  //text that is too long is shortened for all nodes on the right side
  if (calculatingRightSide && this.getBBox().height > rightNodeHeight) {
    var tspans = textElement.selectAll("tspan");
    while(this.getBBox().height > rightNodeHeight){
      tspans.filter(":last-child").remove();
    }
    //change the last line to "..." to show that there is hidden text
    tspans.filter(":last-child").text("...");
  }
}

//if node is already the current root does nothing and returns false
//otherwise makes the given node the current root and returns true
function jumpToNode(node){
  if (node == currentRoot) return false;

  //in case we are jumping forward in the currentPath 
  //we need to expand all children along the way
  for (var i=0; i < currentPath.length; i++){
    if (currentPath[i].childrenBackup) currentPath[i].children = currentPath[i].childrenBackup;
    if (currentPath[i] == node) break;
  }
  currentRoot = node;

  //in case we jumped backwards in the currentPath 
  //we need to collapse all children of the nodes children (unless it's a leaf)
  if(currentRoot.children) currentRoot.children.forEach(collapseAllChildren);
  return true;
}

//checks if there are more nodes to be loaded. 
//New nodes are loaded from server if the out-degree
//of the node or it's children is greater than 0 but 
//they have no children attached.
function loadMoreNodes(node){
  var url;
  var children = node.children || node.childrenBackup;
  if (!children && node.data.properties["out-degree"] > 0) {
    //new nodes have to be fetched from server
    url = "http://10.200.1.75:8012/tree?hops=5&name=" + treeVisGraphId+"&rootNodeId=" + node.data.properties.id;
    node.children = [];
    loadingNode = node;
  }

  if (url) {
    //add dummynodes to the node that display "loading"
    addDummyNodes(node);
    console.log("fetching tree from "+url)
    d3.json(url).get(null, onMoreNodesLoaded);
  };
}

function addDummyNodes(node){
  for (var i = 0; i < node.data.properties["out-degree"]; i++) {
    node.children.push({
      data:{
        name: "loading...", 
        parent: node.data.name, 
        type: "symptom", 
        properties:{id: "dummy-"+i}
      },
      parent : node,
      depth : node.depth + 1
    });
  }
}

function onMoreNodesLoaded(arr){
  loadingNode.children = arr[0].children;
  for (var i = 0; i < loadingNode.children.length; i++) {
    loadingNode.children[i] = d3.hierarchy(loadingNode.children[i]);
  };
  loadingNode.descendants().forEach(initLoadedNode);
  console.log(loadingNode.descendants());
  loadingNode.children.forEach(collapseAllChildren);
  updateTree(currentRoot);
}

function initLoadedNode(node){
  if(node == loadingNode) return;
  node.depth += loadingNode.depth;
  if (!node.parent) {
    node.parent = loadingNode;
  };
  initializeNode(node);
  updatePath();
}

//############################
// Right SVG (main tree)
//############################

function updateTree(rootNode){
  calculatingRightSide = true;
  //calculate a new layout for the tree
  tree(rootNode);
  //convert coordinates of all nodes for radial layout
  calculateCoordinates(rootNode);

  // add all the nodes from the tree as circles to the svg node Group
  var nodes = rightSvgNodeGroup.selectAll("g").data(rootNode.descendants(), function(d){return d.data.properties.id});
  updateRightSvgNodes(nodes);

  //get all the nodes that have been added to the tree
  var newNodes = nodes.enter().append("g");
  createNewRightSvgNodes(newNodes);
  
  //remove nodes that aren't supposed to be shown anymore
  nodes.exit().remove();

  // add all the links from the tree to the svg link group
  var links = rightSvgLinkGroup.selectAll("path").data(rootNode.links(), function(d){return d.target.data.properties.id});
  updateRightSvgLinks(links);
  var newLinks = links.enter().append("path");
  createNewRightSvgLinks(newLinks);
  //remove links that don't have a target anymore
  links.exit().remove();

  //backup the current positions for animations
  nodes.each(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  newNodes.each(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

//updates previously existing nodes to their new status
function updateRightSvgNodes(nodes){
  //transition existing nodes to their new positions and update their color
  nodes.transition()
      .duration(animationDuration)
      .attr("transform", function(d){
        return "translate(" + (d.x) + "," + (d.y) + ")"}
      )
      .attr("class", getNodeClass)
      .attr("opacity", 1);

  //update the sizes of nodes in case the screen size has changed
  nodes.selectAll("circle")
       .attr("r", rightNodeRadius);

  //update text wrapping and shortening
  nodes.selectAll("text")
        .attr("text-anchor","middle")
        .each(insertNodeName);
}

//creates svg nodes for all the newly added nodes
function createNewRightSvgNodes(newNodes){
  //nodes get text applied to them
  newNodes.insert("text")
          .attr("text-anchor","middle")
          .each(insertNodeName);
  
  //nodes get a shape in the svg
  newNodes.insert("circle", "text") 
          .attr("r", rightNodeRadius)
          .attr("class", getCircleClass);

  //set the new nodes positions to their parents starting position
  newNodes.attr("transform", function(d){
              return "translate(" + (width/2) + "," + (height/2) + ")";
            })
          .attr("class", getNodeClass)
          //animate the node to fade in and go to it's correct position (starting from the parents previous position)
          .attr("opacity", 0)
          .transition()
            .duration(animationDuration)
            .delay(animationDuration)
            .attr("transform", function(d){
              return "translate(" + (d.x) + "," + (d.y) + ")"}
            )
            .attr("opacity", 1)
            //add the click listener after the animation has ended
            .on("end", addMouseListeners);
}

function getCircleClass(node){
  return node.data.state || "";
}

function calculateTextSize(d){
  if(calculatingRightSide) d.fontSize = (2*rightNodeRadius / this.getComputedTextLength())*0.9;
  else d.fontSize = (leftNodeWidth / this.getComputedTextLength())*0.9;
}

function addMouseListeners(node){
  //give all new nodes a click listener
  element = d3.select(this);
  element.on("click", nodeClicked)
         .on("mousedown", startLongPressTimer)
         .on("touchstart", startLongPressTimer)
         .on("touchend", stopLongPressTimer);
}

function updateRightSvgLinks(links){
  //update links to their new coordinates
  links.transition().duration(animationDuration)
      .attr("d", getLine);
}

function createNewRightSvgLinks(newLinks){
  //give new links a corresponding path in the svg and animate them
  newLinks.attr("d", function(d){return lineGenerator([[d.source.x, d.source.y],[d.source.x, d.source.y]])})
          .attr("id", function(d){return d.target.data.properties.id})
          .transition()
            .duration(animationDuration)
            .delay(animationDuration)
            .attr("d", getLine);
}

function nodeClicked(node){
  if (longPressHappened) {
    longPressHappened = false;
    d3.event.stopPropagation();
    return;
  }
  closePopUpMenu();
  //if the current root is clicked then hide it's children and make it's parent 
  //the root unless the clicked node is the root of the whole tree with hidden children.
  if (node == currentRoot && (node.children || node.parent)) {
    collapseSingleNode(node);
    if(node.parent) currentRoot = node.parent;
  } else {
    //check if new nodes have to be fetched from server
    loadMoreNodes(node);
    //make the clicked node the new root and show its children
    currentRoot = node;
    if (node.childrenBackup) {
      node.children = node.childrenBackup;
    }
    //set the clicked node as the new endpoint on the 
    //left side so greyed out nodes disappear
    var nodeIsInPath = currentPath.find(function(n){return n == node});
    if(!nodeIsInPath) currentPath = root.path(node);
  }
  updateTree(currentRoot);
}

//calculates where to put each node using the layout d3 came up with as polar coordinates
function calculateCoordinates(rootNode){
  rootNode.descendants().forEach(function(current){
    var x = current.x;
    var y = current.y;
    current.x = Math.cos(x*2*Math.PI - Math.PI) * y * treeWidth + width / 2;
    current.y = Math.sin(x*2*Math.PI - Math.PI) * y * treeHeight + height / 2;
  })
  rootNode.x = width / 2;
  rootNode.y = height / 2;
}

function collapseSingleNode(node){
  if (node.children) {
    node.childrenBackup = node.children;
    node.children = null;
  }
}

function collapseAllChildren(node){
  if (node.children) {
    node.children.forEach(collapseAllChildren);
    collapseSingleNode(node);
  }
}

//############################
// Left SVG (overview)
//############################

function updatePath(){
  if (leftContainer.offsetWidth == 0) return;
  calculatingRightSide = false;
  //create the path from the original root to the currently selected node
  var path = root.path(currentRoot);//.reverse();
  //make nodes greyed out that go beyond the path from root to currentRoot
  currentPath.forEach(function(node){
    node.left.greyedOut = true;
  });
  path.forEach(function(node){
    node.left.greyedOut = false;
  });
  //get all the nodes in the svg and compare them with the new path
  var nodes = leftSvgNodeGroup.selectAll("g").data(currentPath, function(d){return d.data.properties.id});
  
  //remove nodes that aren't in the path anymore
  var nodesRemoved = !nodes.exit().empty();
  nodes.exit().remove();
  
  updateLeftSVGNodes(nodes);
  
  //for every node that is new to the svg append a group element
  var newNodes = nodes.enter().append("g");

  createNewLeftSVGNodes(newNodes);

  //move nodes to the correct positions
  gapHeight = height/20;
  leftNodeTranslateY = gapHeight;

  //new node is added at the top
  //newNodes.attr("transform", getLeftNodeTransform);

  animateLeftSVGNodes(nodes, newNodes);

  //give all new nodes a click listener
  newNodes.on("click", leftNodeClicked);
  
  //update the lines between nodes 
  updateLeftSVGLinks(currentPath);

  //enable scrolling if not enough nodes fit on the screen
  toggleScrolling(currentPath, newNodes, nodesRemoved);
}

function updateLeftSVGNodes(nodes){
  //recalculate how to wrap the text to fit inside it's container
  nodes.selectAll("text")
       .each(fillWithText);

  //update width and height of already existing nodes
  leftSvgNodeGroup.selectAll("rect")
        .attr("class", getRectClass)
        .transition()
        .duration(animationDuration)
        .attr("width", leftNodeWidth)
        .attr("height", getLeftNodeHeight);
  
  //grey out nodes where necessary
  leftSvgNodeGroup.selectAll("g")
                  //.transition()
                  //.duration(animationDuration)
                  .attr("opacity", function(node){
                    if (node.left.greyedOut) {
                      return 0.3;
                    }
                    return 1;
                  });
}

function createNewLeftSVGNodes(newNodes){
  //calculate text wrapping for all new nodes
  newNodes.insert("text")
          .attr("text-anchor","middle")
          .each(fillWithText);
  
  //insert a rectangle into each new group node
  newNodes.insert("rect", "text")
          .attr("width", leftNodeWidth)
          .attr("height", getLeftNodeHeight)
          .attr("class", getRectClass);
}

function calculateLeftTextSize(d){
  d.fontSize = (2*rightNodeRadius / this.getComputedTextLength())*0.9;
}

function animateLeftSVGNodes(nodes, newNodes){
  nodes.transition()
       .duration(animationDuration)
       .attr("transform", getLeftNodeTransform);

  //new node is added at the bottom
  newNodes.attr("transform", getLeftNodeTransform);
  
  //fade in new nodes after old nodes have moved to new positions
  newNodes.attr("opacity", 0).transition()
          .duration(animationDuration)
          .delay(animationDuration)
          .attr("opacity", function(d){
            if (d.left.greyedOut) return 0.3;
            return 1;
          });
}

function updateLeftSVGLinks(path){
  //create an array of links containing source and target points with their x/y position and id of the connected node
  var links = [];
  var sourceY = 0;
  for (var i=0; i<path.length-1; i++){
    sourceY += gapHeight + path[i].left.calculatedHeight;
    links[i] = {source:{id: path[i].data.properties.id, x: width/2, y: sourceY}, 
                target:{id: path[i+1].data.properties.id, x: width/2, y: sourceY + gapHeight}};
  }
  
  //get all the lines in the svg and compare them to the new path
  var lines = leftSvgLinkGroup.selectAll("path")
              .data(links, function(d){
                            return d.source.id + "-" + d.target.id;
                          }
              );
  //update positions of lines that aren't new to the svg
  lines.transition().duration(animationDuration).attr("d", getLine).attr("opacity",1);

  //insert lines for all new links in the path
  lines.enter()
      .append("path")
      .attr("d", getLine)
      .attr("opacity", 0)
      .transition()
      .delay(animationDuration)
      .duration(animationDuration)
      .attr("opacity", 1);

  //remove lines that aren't in the path anymore
  lines.exit().remove();
}

function toggleScrolling(path, newNodes, nodesRemoved){
  var leftContainerHeight = calculateLeftContainerHeight(path);
  if (leftContainerHeight > height / 2) {
    minTranslationY = height / 2 - (leftContainerHeight);

    //check if nodes need to be scrolled
    //due to screen resizing (orientation change on mobile devices),
    //a new node being added or nodes being removed
    if (!newNodes.empty() || nodesRemoved || minTranslationY > translationY) scrollToNewestNode();
    
    if (!scrollingEnabled) {
      enableScrolling();
      scrollingEnabled = true;
    }
  } else if(scrollingEnabled){
    scrollToTop();
    disableScrolling();
    scrollingEnabled = false;
  }
}

function calculateLeftContainerHeight(path){
  var result = 0;
  for (var i = 0; i < path.length; i++) {
    result += path[i].left.calculatedHeight + gapHeight;
  };
  return result;
}

function leftNodeClicked(node){
  var changed = jumpToNode(node);
  if (changed) {
    updateTree(currentRoot);
    updatePath();
  }
}

//returns the correct height for the given node
function getLeftNodeHeight(node){
  var result = node.left.textHeight + textBoxPadding;
  // using node.calculatedHeight instead of getting the bounding box
  // because bounding box can return wrong size during animations
  node.left.calculatedHeight = result;
  return result;
}

function getLeftNodeTransform(node, i){
  var xTranslate, yTranslate;
  yTranslate = leftNodeTranslateY;
  xTranslate = width/2 - leftNodeWidth/2;
  leftNodeTranslateY += gapHeight + node.left.calculatedHeight;
  return "translate(" + xTranslate + "," + yTranslate + ")";
}

function getRectClass(node){
  var strokeClass = node.data.state ? node.data.state + " " : "";
  return strokeClass + getNodeClass(node);
}

//############################
// Scrolling behaviour
//############################

function enableScrolling(){
  leftSVG.call(d3.drag()
         .on("start", dragStarted)
         .on("drag", dragged));
}

function disableScrolling(){
  leftSVG.on(".drag", null);
}

function dragStarted(d){
  previousY = d3.event.y;
}

function dragged(d){
  translationY += d3.event.y - previousY;
  
  if (translationY < minTranslationY) translationY = minTranslationY;
  else if (translationY > 0) translationY = 0;
  previousY = d3.event.y;

  executeScrolling(false);
}

function scrollToNewestNode(){
  translationY = minTranslationY;
  executeScrolling(true);
}

function scrollToTop(){
  translationY = 0;
  executeScrolling(true);
}

function executeScrolling(shouldAnimate){
  if (shouldAnimate) {
    leftSvgNodeGroup.transition().duration(animationDuration).attr("transform", "translate(0," + translationY + ")");
    leftSvgLinkGroup.transition().duration(animationDuration).attr("transform", "translate(0," + translationY + ")");
  } else {
    leftSvgNodeGroup.attr("transform", "translate(0," + translationY + ")");
    leftSvgLinkGroup.attr("transform", "translate(0," + translationY + ")");
  }
}

//############################
// Popup Menu
//############################
function startLongPressTimer(node){
  if(!menuNode){
    menuNode = node;
    menuNodeSVG = d3.select(this);
    longPressTimeout = window.setTimeout(onLongPress, 500, node);
  }
}

function stopLongPressTimer(){
  window.clearTimeout(longPressTimeout);
}

function onLongPress(node){
  longPressHappened = true;
  openPopUpMenu(node.x, node.y);
}

//generates a new popUpMenu using d3.arc and d3.pie
function initPopUpMenu(){
  closePopUpMenu();
  popUpMenuRadius = rightNodeRadius;
  arcGenerator = d3.arc().innerRadius(popUpMenuRadius + 2.5).outerRadius(popUpMenuRadius*1.8);//.padAngle(0.1);
  //calculate the angles for a pie/donut chart with two equal sections
  donutChart = d3.pie()
                 .value(function(d){return d.value}).padAngle(0.1)
                 ([{value:1, cssClass:"positive"}, {value:1, cssClass:"negative"}, {value:1, cssClass:"unknown"}]);
}

function openPopUpMenu(x,y){
  //create a group element to contain the menu without appending it to the DOM
  popUpMenu = rightSVG.append("g");

  //put the menu at the correct opening position
  popUpMenu.attr("transform", "translate(" + x + "," + y + ")");

  //add a path for each section of the donut chart to the popUpMenu and animate it
  smallArcGenerator = d3.arc().innerRadius(popUpMenuRadius).outerRadius(popUpMenuRadius+1);
  popUpMenu.selectAll("path")
           .data(donutChart)
           .enter()
           .append("path")
           .attr("class", function(d){return d.data.cssClass})
           .attr("d", smallArcGenerator)
           .each(addPopUpMenuListeners)
           .each(addPopUpMenuImages)
           .transition()
              .attr("d", arcGenerator)
              .ease(d3.easeElastic)
              .duration(animationDuration*2);
}

function closePopUpMenu(){
  if (menuNode) {
    if (popUpMenu) popUpMenu.attr("opacity", 1).transition().duration(animationDuration).attr("opacity", 0).on("end", function(){popUpMenu.remove()});
    menuNodeSVG = undefined;
    menuNode = undefined;
    longPressHappened = false;
  };
}

function addPopUpMenuListeners(){
  d3.select(this).on("click", onPopUpMenuClick)
                 .on("touchend", onPopUpMenuClick);
}

function addPopUpMenuImages(d){
  var image = "img/" + d.data.cssClass + ".png";
  popUpMenu.insert("svg:image", "path")
           .attr("xlink:href", image)
           .attr("width", getPopUpMenuIconSizeSmall)
           .attr("height", getPopUpMenuIconSizeSmall)
           .attr("x", function(){return smallArcGenerator.centroid(d)[0] - getPopUpMenuIconSizeSmall() / 2})
           .attr("y", function(){return smallArcGenerator.centroid(d)[1] - getPopUpMenuIconSizeSmall() / 2})
           .transition().duration(animationDuration*2).ease(d3.easeElastic)
              .attr("width", getPopUpMenuIconSize)
              .attr("height", getPopUpMenuIconSize)
              .attr("x", function(){return arcGenerator.centroid(d)[0] - getPopUpMenuIconSize() / 2})
              .attr("y", function(){return arcGenerator.centroid(d)[1] - getPopUpMenuIconSize() / 2});
}

function getPopUpMenuIconSizeSmall(){
  return (smallArcGenerator.outerRadius()() - smallArcGenerator.innerRadius()()) * 0.8;
}

function getPopUpMenuIconSize(){
  return (arcGenerator.outerRadius()() - arcGenerator.innerRadius()()) * 0.8;
}

function onPopUpMenuClick(element){
  d3.event.stopPropagation();
  var circle = menuNodeSVG.select("circle");
  var menuButton = d3.select(this);
  menuNode.data.state = menuButton.attr("class")
  menuButton.transition()
            .duration(animationDuration)
            .on("end", closePopUpMenu)
            .attr("d", d3.arc()
                         .outerRadius(popUpMenuRadius * 2)
                         .innerRadius(popUpMenuRadius + 2.5)
                         .padAngle(0.1)
                  );
  circle.classed("positive", false);
  circle.classed("negative", false);
  circle.classed("unknown", false);
  circle.classed(menuButton.attr("class"), true);
  updatePath();
}