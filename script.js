
var curr_tile = null;
var curr_pos = 10;
var colours = ["red", "blue", "orange", "green"];

function create_tile()
{
	var tile = document.createElement("div");
	tile.className = "tile";
	tile.style = "left:" + curr_pos + "px";
	tile.onmousedown = function() {start_drag(tile)};
	
	var number = document.createElement("text");
	number.style = "color:" + colours[Math.floor(Math.random() * colours.length)];
	number.innerHTML = Math.floor(Math.random() * 13)+1;
	tile.appendChild(number);
	document.body.appendChild(tile);
	curr_pos += 80;
}

function start_drag(tile)
{
	curr_tile = tile;
}

function drag(event, tile)
{
	if (curr_tile != null)
	{
		curr_tile.style.left = (event.clientX-40) + "px";
		curr_tile.style.top = (event.clientY-50) + "px";
	}
}

function end_drag()
{
	curr_tile = null;
}

