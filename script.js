var treeSize = 2000;
var body = document.getElementsByTagName("body")[0];
var width = body.scrollWidth, height = body.scrollHeight;
/*var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", zoomed));
var svgCircleGroup = svg.append("g");*/
d3.selectAll("canvas").call(d3.zoom().on("zoom", zoomed));
var root = d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
    (generateRandomTree());

function generateRandomTree(){
  var nodes = [{"name" : "0", "parent": ""}];
  var currentNode = 0, currentNeighbor = 1, neighborCount;
  while(nodes.length < 200){
    neighborCount = 1 + Math.round(Math.random()*5);
    for (var i = 0; i < neighborCount; i++) {
      nodes.push({"name" : ""+currentNeighbor++, "parent" : currentNode});
    }
    currentNode++;
  }
  return nodes;
}

var tree = d3.tree().separation(
  function separation(a, b) {
    return (a.parent == b.parent ? 1 : 2) / a.depth;
  });
tree(root);

var canvas = document.getElementById("mainCanv"),
    centerX = width/2,
    centerY = height/2;
    context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

function drawTree(){
  context.save();
  context.resetTransform();
  context.clearRect(0,0,width,height);
  context.restore();

  drawLinks();
  root.each(drawNode);
  drawRoot();
}

function drawRoot(){
  /*var x = Math.cos(root.x*2*Math.PI) * root.y * treeSize + centerX,
      y = Math.sin(root.x*2*Math.PI) * root.y * treeSize + centerY;*/
  context.beginPath();
  context.strokeStyle = "#f00";
  context.fillStyle = "#f00";
  context.arc(root.x,root.y,10-root.depth,0,2*Math.PI);
  context.fill();
}

function drawNode(node){
  /*var x = Math.cos(node.x*2*Math.PI) * node.y * treeSize + centerX,
      y = Math.sin(node.x*2*Math.PI) * node.y * treeSize + centerY;*/

  context.beginPath();
  context.strokeStyle = "#000";
  context.fillStyle = "#000";
  context.arc(node.x,node.y,10-node.depth,0,2*Math.PI);
  context.fill();
}

function drawLinks(){
  var links = root.links(), sourceX, sourceY, targetX, targetY;
  context.strokeStyle = "#f0f";
  context.beginPath();
  links.forEach(function (currentLink){
    
    /*sourceX = Math.cos(currentLink.source.x*2*Math.PI) * currentLink.source.y * treeSize + centerX;
    sourceY = Math.sin(currentLink.source.x*2*Math.PI) * currentLink.source.y * treeSize + centerY;
    targetX = Math.cos(currentLink.target.x*2*Math.PI) * currentLink.target.y * treeSize + centerX;
    targetY = Math.sin(currentLink.target.x*2*Math.PI) * currentLink.target.y * treeSize + centerY;*/

    context.moveTo(currentLink.source.x, currentLink.source.y);
    context.lineTo(currentLink.target.x, currentLink.target.y);
  });
  context.stroke();
}

function calculateCoordinates(){
  root.descendants().forEach(function(current){
    var x = current.x;
    var y = current.y;
    current.x = Math.cos(x*2*Math.PI) * y * treeSize + centerX,
    current.y = Math.sin(x*2*Math.PI) * y * treeSize + centerY;
  })
}

function zoomed() {
  //svgCircleGroup.attr("transform", d3.event.transform);
  context.translate(d3.event.transform.x, d3.event.transform.y);
  context.scale(d3.event.transform.k, d3.event.transform.k);
  drawTree();
}

/*calculateCoordinates();
svgCircleGroup.selectAll("circle")
    .data(root.descendants())
    .enter()
    .append("circle")
    .attr("r", function(d){ 
      return 10 - d.depth 
    })
    .attr("transform", function(d){
      return "translate(" + d.x + "," + d.y + ")"
    });*/
calculateCoordinates();
drawTree();