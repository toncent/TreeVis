//---------------------------------------//
// Variables
//---------------------------------------//
var rightContainer = document.getElementById("rightContainer");
var leftContainer = document.getElementById("leftContainer");
var width, height;
var treeRadius, leftTreeRadius;
var rightNodeSize, leftNodeWidth, leftNodeHeight, gapHeight;

var previousK = 0;
var animationDuration = 400, zoomDuration = 150;
var lineGenerator;

var rightSVG, leftSVG;
var rightSvgLinkGroup;
var rightSvgNodeGroup;

var root, currentRoot;
var tree;

var longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin posuere eu lectus vitae tincidunt. Maecenas finibus nec diam ac molestie."



//---------------------------------------//
// Initialization
//---------------------------------------//
initHtmlElements();
setupD3Hierarchy();
setupD3Tree();

//collapse the tree to only show the currentRoot and it's children
currentRoot.children.forEach(collapseAllChildren);

window.addEventListener("resize", init);
init();

//---------------------------------------//
// Functions
//---------------------------------------//
function setupD3Hierarchy(){
  // create a d3 hierarchy from the data generated by generateRandomTree()
  root = d3.stratify()
    .id(function(d) { return d.name; }) //tells d3 where to find the id for each node
    .parentId(function(d) { return d.parent; }) //tells d3 where to find the id for each nodes parent node
    (generateRandomTree()); //passes the data to create the tree from
  
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
  width = rightContainer.offsetWidth; 
  height = rightContainer.offsetHeight;
  rightNodeSize = Math.min(width/10, height/10);
  leftNodeWidth = width*0.75;
  treeRadius = height > width ? width/2 - rightNodeSize * 1.5 : height/2 - rightNodeSize * 1.5;
  updateTree(currentRoot);
  updatePath();
}

function generateRandomTree(){
  var nodes = [{"name" : "0", "parent": "", "type" : 0, "text" : "Node 1", "longText" : longText}];
  var currentNode = 0, currentNeighbor = 1, neighborCount, currentType;
  while(nodes.length < 400){
    neighborCount = 1 + Math.round(Math.random()*4);
    for (var i = 0; i < neighborCount; i++) {
      currentType = Math.round(Math.random())
      nodes.push({"name" : ""+currentNeighbor++, "parent" : currentNode, "type" : currentType, "text" : "Node " + (currentNeighbor), "longText" : longText});
    }
    currentNode++;
  }
  return nodes;
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

//updates all the nodes and links when a zoom event has occured (zoom events also happen when dragging the tree around)
function zoomed() {
  if (d3.event.transform.k != previousK) {
    //zoom behaviour
    rightSvgNodeGroup.transition()
      .duration(zoomDuration)
      .attr("transform", d3.event.transform);
    rightSvgLinkGroup.transition()
      .duration(zoomDuration)
      .attr("transform", d3.event.transform);
  } else {
    //drag behaviour
    rightSvgNodeGroup.attr("transform", d3.event.transform);
    rightSvgLinkGroup.attr("transform", d3.event.transform);
  }
  previousK = d3.event.transform.k;
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
  if (node.id == currentRoot.id) return "#f00";
  //all other nodes get black color
  return "#000";
}

function updateTree(rootNode){

  //calculate a new layout for the tree
  tree(rootNode);
  //convert coordinates of all nodes for radial layout
  calculateCoordinates(rootNode);

  // add all the nodes from the tree as circles to the svg node Group
  var nodes = rightSvgNodeGroup.selectAll("g").data(rootNode.descendants(), function(d){return d.data.name});
  
  //transition existing nodes to their new positions
  nodes.transition()
      .duration(animationDuration)
      .attr("transform", function(d){
        return "translate(" + d.x + "," + d.y + ")"}
      )
      .attr("fill", getNodeColor);

  //update the sizes of existing nodes in case the screen size has changed
  nodes.each(function(d){
    if(d.data.type == 0){
      d3.select(this).select("circle").attr("r", rightNodeSize);
    } else if(d.data.type == 1){
      d3.select(this).select("ellipse").attr("rx", rightNodeSize).attr("ry", rightNodeSize * 0.6);
    }
  });

  //update text sizes in case screen size has changed
  nodes.selectAll("text")
        .attr("font-size","1px")
        .each(calculateTextSize)
        .attr("font-size", function(d){return d.fontSize});

  //get all the nodes that have been added to the tree
  var newNodes = nodes.enter().append("g");
  
  //nodes that weren't in the tree before get a shape in the svg according to their type
  var newCircleNodes = newNodes.filter(function(d){
    return d.data.type == 0;
  });
  var newEllipseNodes = newNodes.filter(function(d){
    return d.data.type == 1;
  });
  newEllipseNodes.insert("ellipse")
              .attr("rx", rightNodeSize)
              .attr("ry", rightNodeSize * 0.6);
  newCircleNodes.insert("circle") 
            .attr("r", rightNodeSize);

  //nodes get text applied to them
  newNodes.insert("text")
          .text(function(d) {return d.data.text})
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
  //remove nodes that aren't supposed to be shown anymore
  nodes.exit().remove();
  
  rightSvgNodeGroup.selectAll("g").on("click", nodeClicked);

  // add all the links from the tree to the svg link group
  var links = rightSvgLinkGroup.selectAll("path").data(rootNode.links(), function(d){return d.target.id});
  
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
      .attr("id", function(d){return d.source.id + "-" + d.target.id})
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

  //show path only if there is more than one node in it
  if (path.length == 1) {
    leftSvgNodeGroup.selectAll("g").remove();
    leftSvgLinkGroup.selectAll("path").remove();
    return;
  };
  
  //calculate the height of each node and the gap between nodes depending on how many nodes need to be shown
  leftNodeHeight = height*0.75/path.length;
  gapHeight = height*0.25/(path.length + 1);

  for (var i=0; i<path.length; i++){
    if (path[i+1]) links[i] = {source:{id: path[i].id, x: (width/2 - leftNodeWidth/2), y: ((i + 1) * gapHeight + i * leftNodeHeight)}, 
                               target:{id: path[i+1].id, x: (width/2 - leftNodeWidth/2), y: ((i + 2) * gapHeight + (i + 1) * leftNodeHeight)}};
  }
  //get all the nodes in the svg and compare them with the new path
  var nodes = leftSvgNodeGroup.selectAll("g").data(path, function(d){return d.data.name});
  //update the positions and heights of already existing nodes
  nodes.transition()
      .duration(animationDuration)
      .attr("transform", function(d, i){
        return "translate(" + (width/2 - leftNodeWidth/2) + "," + ((i + 1) * gapHeight + i * leftNodeHeight) + ")"}
      )


  leftSvgNodeGroup.selectAll("rect")
        .transition()
        .duration(animationDuration)
        .attr("width", leftNodeWidth)
        .attr("height", leftNodeHeight);

  //for every node that is new to the svg append a group element and give it the right coordinates
  var newNodes = nodes.enter().append("g").attr("transform", function(d, i){
        return "translate(" + (width/2 - leftNodeWidth/2) + "," + ((i + 1) * gapHeight + i * leftNodeHeight) + ")"}
      );
  //insert a rectangle into each new group node
  newNodes.insert("rect")
          .attr("width", leftNodeWidth)
          .attr("height", leftNodeHeight);

  nodes.selectAll("text")
        .text(function(d) {return d.data.longText})
        .each(wrapText)
        .transition()
        .duration(animationDuration)
        .attr("transform");
        
  newNodes.insert("text")
          .text(function(d) {return d.data.longText})
          .attr("text-anchor","middle")
          .attr("dy", "0.4em")
          .each(wrapText);

  //remove nodes that aren't in the path anymore
  nodes.exit().remove();

  //get all the lines in the svg and compare them to the new path
  var lines = leftSvgLinkGroup.selectAll("path")
              .data(links, function(d){
                            return d.source.id + "-" + d.target.id;
                          }
              );
  //update positions of lines that aren't new to the svg
  lines.transition().duration(animationDuration).attr("d", getOverviewLine);

  //insert lines for all new links in the path
  lines.enter()
      .append("path")
      .attr("d", getOverviewLine)
      .attr("opacity", 0)
      .transition()
      .delay(animationDuration)
      .duration(animationDuration)
      .attr("opacity", 1);

  //remove lines that aren't in the path anymore
  lines.exit().remove();
}

function getOverviewLine(link){
  return lineGenerator([[link.source.x + leftNodeWidth / 2, link.source.y + leftNodeHeight], [link.target.x + leftNodeWidth / 2, link.target.y]]);
}

function wrapText(){
  var textElement = d3.select(this),
      text = textElement.text(),
      lineHeight = 1.1,
      lineNumber = 1,
      wordList = text.split(/\s+/).reverse(),
      currentWord,
      currentLine = [],
      y = textElement.attr("y");

  textElement.text(null);
  var currentTspan = textElement.append("tspan").attr("x", leftNodeWidth/2).attr("y", 0).attr("dy", lineHeight + "em");
  while (currentWord = wordList.pop()){
    currentLine.push(currentWord);
    currentTspan.text(currentLine.join(" "));
    if (currentTspan.node().getComputedTextLength() > leftNodeWidth) {
        currentLine.pop();
        currentTspan.text(currentLine.join(" "));
        currentLine = [currentWord];
        currentTspan = textElement.append("tspan").attr("x", leftNodeWidth/2).attr("y", 0).attr("dy", ++lineNumber*lineHeight +"em");
    };
  }
}