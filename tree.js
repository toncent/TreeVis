//---------------------------------------//
// Variables
//---------------------------------------//
var rightContainer = document.getElementById("rightContainer");
var leftContainer = document.getElementById("leftContainer");
var width, height;
var treeRadius, leftTreeRadius;
var rightNodeSize, leftNodeWidth, leftNodeMaxHeight, leftNodeExpandedHeight, gapHeight;

var previousK = 0;
var animationDuration = 400;
var lineGenerator;

var rightSVG, leftSVG;
var rightSvgLinkGroup;
var rightSvgNodeGroup;

var root, currentRoot;
var tree;
var expandedNode;
var leftNodeTranslateY;
//accumulated height to determine gaps between nodes
var leftNodesAccumulatedHeight;

//---------------------------------------//
// Initialization
//---------------------------------------//
fetchDataAndInitialize();

//---------------------------------------//
// Functions
//---------------------------------------//
function fetchDataAndInitialize(){
  //load example tree data from json file
  d3.json("http://10.200.1.56:8012/tree?hops=10&name=graphdiarrhea1").get(null, handleJsonResponse);
}

function handleJsonResponse(arr){
  d3.select("#loader-container").remove();
  d3.select("#main-container").style("display", "block");
  initHtmlElements();
  setupD3Tree();
  setupD3Hierarchy(arr);
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
}

function setupD3Tree(){
  // create a new d3 tree
  tree = d3.tree()
          .separation( //defines how far nodes should be apart from each other
            function separation(a, b) {
              return (a.parent == b.parent ? .4 : 2) / a.depth;
            }
          );
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
  rightNodeSize = Math.min(width/10, height/10);
  leftNodeWidth = width*0.75;
  treeRadius = height > width ? width/2 - rightNodeSize * 1.5 : height/2 - rightNodeSize * 1.5;
  updateTree(currentRoot);
  updatePath();
}

function nodeClicked(node){
  if (node.children) {
    collapseSingleNode(node);
    if(node.parent) currentRoot = node.parent;
  } else {
    if (node.childrenBackup) {
      currentRoot = node;
      node.children = node.childrenBackup;
    } else {
      return;
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
    current.x = Math.cos(x*2*Math.PI) * y * treeRadius + width / 2;
    current.y = Math.sin(x*2*Math.PI) * y * treeRadius + height / 2;
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
  var boundingBox = this.getBBox();
  var parentBox = this.parentNode.getBBox();
  d.fontSize = Math.min(parentBox.width / boundingBox.width, parentBox.height / boundingBox.height)*0.8 + "px";
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
  //leafs get white color
  if (!node.children && !node.childrenBackup) return "#fff";
  //the root gets red color
  if (node.data.properties.id == currentRoot.data.properties.id) return "#f00";
  //all other nodes get black color
  return "#acf";
}

function updateTree(rootNode){

  //calculate a new layout for the tree
  tree(rootNode);
  //convert coordinates of all nodes for radial layout
  calculateCoordinates(rootNode);

  // add all the nodes from the tree as circles to the svg node Group
  var nodes = rightSvgNodeGroup.selectAll("g").data(rootNode.descendants(), function(d){return d.data.properties.id});
  
  //transition existing nodes to their new positions
  nodes.transition()
      .duration(animationDuration)
      .attr("transform", function(d){
        return "translate(" + d.x + "," + d.y + ")"}
      )
      .attr("fill", getNodeColor);

  //update the sizes of existing nodes in case the screen size has changed
  nodes.each(function(d){
    if(d.data.type == "diagnosis"){
      d3.select(this).select("circle").attr("r", rightNodeSize);
    } else if(d.data.type == "symptom"){
      d3.select(this).select("circle").attr("r", rightNodeSize);
    } else if(d.data.type == "examination"){
      d3.select(this).select("circle").attr("r", rightNodeSize);
    } else if(d.data.type == "therapy"){
      d3.select(this).select("circle").attr("r", rightNodeSize);
    }
  });

  //update text sizes in case screen size has changed
  nodes.selectAll("text")
        .attr("font-size","1px")
        .each(calculateTextSize)
        .attr("font-size", function(d){return d.fontSize});

  //get all the nodes that have been added to the tree
  var newNodes = nodes.enter().append("g");
  
  //nodes that weren't in the tree before get a shape in the svg
  newNodes.insert("circle") 
            .attr("r", rightNodeSize);

  //nodes get text applied to them
  newNodes.insert("text")
          .text(function(d) {return d.data.name})
          .attr("text-anchor","middle")
          .attr("dominant-baseline", "central")
          .attr("font-size","1px")
          .each(calculateTextSize)
          .attr("font-size", function(d){return d.fontSize});

  //set the new nodes positions to their parents starting position
  newNodes.attr("transform", function(d){
    if(d.parent){
      d.x0 = d.parent.x;
      d.y0 = d.parent.y;
      return "translate(" + d.x0 + "," + d.y0 + ")";
    }
    else return "translate(" + d.x + "," + d.y + ")";
  })
  .attr("fill", getNodeColor)
  .attr("opacity", 0)
  //animate the node to go to it's correct position (starting from the parents previous position)
  .transition()
    .duration(animationDuration)
    .delay(animationDuration)
    .attr("transform", function(d){
      return "translate(" + d.x + "," + d.y + ")"}
    )
    .attr("opacity", 1);

  //give all new nodes a click listener
  newNodes.on("click", nodeClicked);
  
  //remove nodes that aren't supposed to be shown anymore
  nodes.exit().remove();

  // add all the links from the tree to the svg link group
  var links = rightSvgLinkGroup.selectAll("path").data(rootNode.links(), function(d){return d.target.data.properties.id});
  
  //remove links that don't have a target anymore
  links.exit().remove();

  //create a new line generator
  if(!lineGenerator) lineGenerator = d3.line();

  //update existing links to their new coordinates
  links.transition().duration(animationDuration)
      .attr("d", getLine);//function(d){return lineGenerator([[d.source.x, d.source.y],[d.target.x, d.target.y]])});

  //give the new links a corresponding path in the svg and animate them
  links.enter().append("path")
      .attr("d", function(d){return lineGenerator([[d.source.x, d.source.y],[d.source.x, d.source.y]])})
      .attr("id", function(d){return d.target.data.properties.id})
      .transition()
        .duration(animationDuration)
        .delay(animationDuration)
        .attr("d", getLine);

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
  //create the path from the original root to the currently selected node
  var path = root.path(currentRoot);
  var links = [];
  
  //calculate the height of each node and the gap between nodes depending on 
  //how many nodes need to be shown and whether there is an expanded node
  leftNodeMaxHeight = height*0.75/path.length;
  if (expandedNode) {
    leftNodeExpandedHeight = expandedNode.necessaryHeight;
    //reduce height of other nodes
    leftNodeMaxHeight -= (leftNodeExpandedHeight - leftNodeMaxHeight)/(path.length - 1)
  };

  //get all the nodes in the svg and compare them with the new path
  var nodes = leftSvgNodeGroup.selectAll("g").data(path, function(d){return d.data.properties.id});
  
  //remove nodes that aren't in the path anymore
  nodes.exit().remove();
  
  //recalculate how to wrap the text to fit inside it's container
  nodes.selectAll("text")
        .text(function(d) {
                if(d.data.properties.description) return d.data.properties.description
                else return d.data.name
              })
        .each(wrapText);

  //reset accumulated height
  leftNodesAccumulatedHeight = 0;
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
          .text(function(d) {
                if(d.data.properties.description) return d.data.properties.description
                else return d.data.name
              })
          .attr("text-anchor","middle")
          .attr("dy", "0.4em")
          .each(wrapText);
  
  //insert a rectangle into each new group node
  newNodes.insert("rect", ":first-child")
          .attr("width", leftNodeWidth)
          .attr("height", getLeftNodeHeight);

  
  //move nodes to the correct positions
  gapHeight = (height - leftNodesAccumulatedHeight) / (path.length + 1);
  leftNodeTranslateY = gapHeight;
  nodes.transition()
      .duration(animationDuration)
      .attr("transform", getLeftNodeTransform);
  
  newNodes.attr("transform", getLeftNodeTransform);
  
  //hide new nodes to fade them in later
  newNodes.attr("opacity", 0);
  
  //fade in new nodes after old nodes have moved to new positions
  newNodes.transition()
          .duration(animationDuration)
          .delay(animationDuration)
          .attr("opacity", 1);

  //give all new nodes a click listener
  newNodes.on("click", expandTextBox);
  
  //create an array of links containing source and target points with their x/y position and id of the connected node
  var sourceY = 0, targetY;
  for (var i=0; i<path.length-1; i++){
    sourceY += gapHeight + path[i].calculatedHeight;
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
}

function getOverviewLine(link){
  return lineGenerator([[link.source.x + leftNodeWidth / 2, link.source.y + leftNodeMaxHeight], [link.target.x + leftNodeWidth / 2, link.target.y]]);
}

//inserts line breaks into the text so it fits inside the corresponding rectangle
function wrapText(data){
  var textElement = d3.select(this),
      text = textElement.text(),
      lineHeight = 1.3,
      lineNumber = 1,
      wordList = text.split(/\s+/).reverse(),
      currentWord,
      currentLine = [],
      y = textElement.attr("y"),
      topOffset = 0.5;

  textElement.text(null);
  var currentTspan = textElement.append("tspan").attr("x", leftNodeWidth/2).attr("y", 0).attr("dy", topOffset + lineHeight + "em");
  while (currentWord = wordList.pop()){
    currentLine.push(currentWord);
    currentTspan.text(currentLine.join(" "));
    if (currentTspan.node().getComputedTextLength() > leftNodeWidth*0.95) {
        currentLine.pop();
        currentTspan.text(currentLine.join(" "));
        currentLine = [currentWord];
        currentTspan = textElement.append("tspan").attr("x", leftNodeWidth/2).attr("y", 0).attr("dy", ++lineNumber*lineHeight + topOffset + "em");
    }
  }
  //save the height that is needed for all text to fit inside the rect
  data.necessaryHeight = this.getBBox().height * 1.3;

  if (this.getBBox().height > leftNodeMaxHeight*0.75 && !data.isExpanded) {
    //text is too long to fit in the rectangle -> remove lines until it fits
    var tspans = textElement.selectAll("tspan");
    while(this.getBBox().height > leftNodeMaxHeight*0.75){
      tspans.filter(":last-child").remove();
    }
    //change the last line to "..." to show that there is hidden text
    tspans.filter(":last-child").text("...");
  }
}

function expandTextBox(node){
  if (node.isExpanded) {
    //node is already expanded so shrink it again
    node.isExpanded = false;
    expandedNode = undefined;
  } else {
    node.isExpanded = true;
    //if another node is currently expanded shrink it again
    if(expandedNode) expandedNode.isExpanded = false;
    //set the clicked node to be the currently expanded one
    expandedNode = node;
  }
  updatePath();
}

//returns the correct height for the given node
function getLeftNodeHeight(node){
  var result = node.isExpanded ? leftNodeExpandedHeight : leftNodeMaxHeight;
  result = result > node.necessaryHeight ? node.necessaryHeight : result;
  node.calculatedHeight = result;

  //increase accumulated height by the height of this node
  leftNodesAccumulatedHeight += result;
  return result;
}

function getLeftNodeTransform(node, i){
  var xTranslate, yTranslate;
  yTranslate = leftNodeTranslateY;
  xTranslate = width/2 - leftNodeWidth/2;
  leftNodeTranslateY += gapHeight + node.calculatedHeight;
  return "translate(" + xTranslate + "," + yTranslate + ")";
}