//---------------------------------------//
// Variables
//---------------------------------------//
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

var root, currentRoot;
var tree;

var lineHeight = 1.3; //em
var captionOffset = 2.3;//em
var textBoxPadding = lineHeight*16; //px -- usually 1em is 16px
var calculatingRightSide;

var longPressTimeout;
var dragStartY, translationY = 0, minTranslationY, scrollingEnabled = false;

//---------------------------------------//
// Initialization
//---------------------------------------//
fetchDataAndInitialize();

//---------------------------------------//
// Functions
//---------------------------------------//
function fetchDataAndInitialize(){
  //load example tree data from json file
  d3.json("http://10.200.1.75:8012/tree?hops=15&name=graphdiarrhea1").get(null, handleJsonResponse);
  //d3.json("exampleTree.json").get(null, handleJsonResponse);
}

function handleJsonResponse(arr){
  d3.select("#loader-container").remove();
  d3.select("#main-container").style("display", "block");
  initHtmlElements();
  setupD3Tree();
  setupD3Hierarchy(arr);
  lineGenerator = d3.line();
  //collapse the tree to only show the currentRoot and it's children
  currentRoot.children.forEach(collapseAllChildren);
  window.addEventListener("resize", init);
  init();
}

function setupD3Hierarchy(arr){
  // create a d3 hierarchy from the data collected from exampleTree.json
  root = d3.hierarchy(arr[0])
    //.id(function(d) { return d.properties.id; }) //tells d3 where to find the id for each node
    //.parentId(function(d) { return d.properties.parent; }); //tells d3 where to find the id for each nodes parent node
    //(arr); //passes the data to create the tree from
  
  currentRoot = root;
  currentRoot.x0 = width/2;
  currentRoot.y0 = height/2;
  currentRoot.descendants().forEach(initializeNode);
}

function initializeNode(node){
  node.left = {};
  node.right = {};
}

function setupD3Tree(){
  // create a new d3 tree
  tree = d3.tree();
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
  treeWidth = width/2 - rightNodeWidth*0.55;
  treeHeight = height/2 - rightNodeHeight*0.55;
  updateTree(currentRoot);

  //left half initialization
  leftNodeWidth = width*0.75;
  updatePath();
}

function nodeClicked(node){
  //if the current root is clicked then hide it's children and make it's parent 
  //the root unless the clicked node is the root of the whole tree with hidden children.
  if (node == currentRoot && (node.children || node.parent)) {
    collapseSingleNode(node);
    if(node.parent) currentRoot = node.parent;
  } else {
    //make the clicked node the new root and show its children
    currentRoot = node;
    if (node.childrenBackup) {
      node.children = node.childrenBackup;
    }
  }
  updateTree(currentRoot);
  updatePath();
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

function calculateTextSize(d){
  d.fontSize = (rightNodeWidth / this.getComputedTextLength())*0.9;
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
function getNodeColor(node){
  //the root gets white color
  //if (node.data.properties.id == currentRoot.data.properties.id) return "#fff";
  if (node.data.type == "diagnosis") return "#a0f";
  if (node.data.type == "symptom") return "#af0";
  if (node.data.type == "examination") return "#fa0";
  if (node.data.type == "therapy") return "#0af";
  return "#a0f";
}

//updates previously existing nodes to their new status
function updateRightSvgNodes(nodes){
  //transition existing nodes to their new positions and update their color
  nodes.transition()
      .duration(animationDuration)
      .attr("transform", function(d){
        return "translate(" + (d.x - rightNodeWidth/2) + "," + (d.y - rightNodeHeight/2) + ")"}
      )
      .attr("fill", getNodeColor);

  //update the sizes of nodes in case the screen size has changed
  nodes.selectAll("rect")
       .attr("width", rightNodeWidth)
       .attr("height", rightNodeHeight);

  //update text wrapping and shortening
  nodes.selectAll("text")
        .attr("text-anchor","middle")
        .each(fillWithText);
}

//creates svg nodes for all the newly added nodes
function createNewRightSvgNodes(newNodes){
  //nodes get text applied to them
  newNodes.insert("text")
          .text(function(d) {return d.data.name})
          .attr("text-anchor","middle")
          .each(fillWithText);
  
  //nodes get a shape in the svg
  newNodes.insert("rect", "text") 
            .attr("width", rightNodeWidth)
            .attr("height", rightNodeHeight);

  //set the new nodes positions to their parents starting position
  newNodes.attr("transform", function(d){
              if(d.parent){
                d.x0 = d.parent.x;
                d.y0 = d.parent.y;
                return "translate(" + (d.x0 - rightNodeWidth/2) + "," + (d.y0 - rightNodeHeight/2) + ")";
              }
              else return "translate(" + (d.x - rightNodeWidth/2) + "," + (d.y - rightNodeHeight/2) + ")";
            })
          .attr("fill", getNodeColor)
          //animate the node to fade in and go to it's correct position (starting from the parents previous position)
          .attr("opacity", 0)
          .transition()
            .duration(animationDuration)
            .delay(animationDuration)
            .attr("transform", function(d){
              return "translate(" + (d.x - rightNodeWidth/2) + "," + (d.y - rightNodeHeight/2) + ")"}
            )
            .attr("opacity", 1)
            //add the click listener after the animation has ended
            .on("end", addClickListener);
}

function addClickListener(node){
  //give all new nodes a click listener
  d3.select(this).on("click", nodeClicked);
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

function updatePath(){
  calculatingRightSide = false;
  //create the path from the original root to the currently selected node
  var path = root.path(currentRoot).reverse();
  var links = [];

  //get all the nodes in the svg and compare them with the new path
  var nodes = leftSvgNodeGroup.selectAll("g").data(path, function(d){return d.data.properties.id});
  
  //remove nodes that aren't in the path anymore
  nodes.exit().remove();
  
  //recalculate how to wrap the text to fit inside it's container
  nodes.selectAll("text")
       .each(fillWithText);

  //update width and height of already existing nodes
  leftSvgNodeGroup.selectAll("rect")
        .transition()
        .duration(animationDuration)
        .attr("width", leftNodeWidth)
        .attr("height", getLeftNodeHeight);
  
  //for every node that is new to the svg append a group element
  var newNodes = nodes.enter().append("g");
  
  //calculate text wrapping for all new nodes
  newNodes.insert("text")
          .attr("text-anchor","middle")
          .each(fillWithText);
  
  //insert a rectangle into each new group node
  newNodes.insert("rect", "text")
          .attr("width", leftNodeWidth)
          .attr("height", getLeftNodeHeight)
          .attr("fill", getNodeColor);

  
  //move nodes to the correct positions
  gapHeight = height/20;
  leftNodeTranslateY = gapHeight;

  newNodes.attr("transform", getLeftNodeTransform);

  nodes.transition()
      .duration(animationDuration)
      .attr("transform", getLeftNodeTransform);
  
  //hide new nodes to fade them in later
  newNodes.attr("opacity", 0);
  
  //fade in new nodes after old nodes have moved to new positions
  newNodes.transition()
          .duration(animationDuration)
          .delay(animationDuration)
          .attr("opacity", 1);

  //give all new nodes a click listener
  newNodes.on("click", leftNodeClicked);
  
  //create an array of links containing source and target points with their x/y position and id of the connected node
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
  lines.transition().duration(animationDuration).attr("d", getLine);

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

  //enable scrolling if not all nodes fit on the screen
  var topOffset = gapHeight;
  var leftContainerHeight = calculateLeftContainerHeight(path);
  if (leftContainerHeight + topOffset > height / 2) {
    minTranslationY = height / 2 - (topOffset + leftContainerHeight);
    if (!scrollingEnabled) {
      enableScrolling();
      scrollingEnabled = true;
    }
  } else if(scrollingEnabled){
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

function getOverviewLine(link){
  return lineGenerator([[link.source.x + leftNodeWidth / 2, link.source.y + leftNodeMaxHeight], [link.target.x + leftNodeWidth / 2, link.target.y]]);
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

function leftNodeClicked(node){
  var changed = jumpToNode(node);
  if (changed) {
    updateTree(currentRoot);
    updatePath();
  }
}

//if node is already the current root does nothing and returns false
//otherwise makes the given node the current root and returns true
function jumpToNode(node){
  if (node == currentRoot) return false;
  collapseSingleNode(currentRoot);
  if (node.childrenBackup) {
      node.children = node.childrenBackup;
  }
  currentRoot = node;
  currentRoot.children.forEach(collapseAllChildren);
  return true;
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
  leftSvgNodeGroup.transition().duration(animationDuration).attr("transform", "translate(0,0)");
  leftSvgLinkGroup.transition().duration(animationDuration).attr("transform", "translate(0,0)");
}

function dragStarted(d){
  previousY = d3.event.y;
}

function dragged(d){
  translationY += d3.event.y - previousY;
  
  if (translationY < minTranslationY) translationY = minTranslationY;
  else if (translationY > 0) translationY = 0;

  previousY = d3.event.y;
  leftSvgNodeGroup.attr("transform", "translate(0," + translationY + ")");
  leftSvgLinkGroup.attr("transform", "translate(0," + translationY + ")");
}