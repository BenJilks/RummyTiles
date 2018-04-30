
var curr_tile = null;
var curr_pos = 10;
var colours = ["red", "blue", "orange", "green"];
var tiles = [];
var groups = [];

function create_tile()
{
	var tile = document.createElement("div");
	tile.className = "tile";
	tile.style = "left:" + curr_pos + "px;top:10px";
	tile.onmousedown = function() {start_drag(tile)};
	
	var number = document.createElement("text");
	number.style = "color:" + colours[Math.floor(Math.random() * colours.length)];
	number.innerHTML = Math.floor(Math.random() * 13)+1;
	tile.appendChild(number);
	document.body.appendChild(tile);
    tiles.push(tile);
	curr_pos += 80;
}

function create_group()
{
    var group = document.createElement("div");
    group.className = "group";
    return group;
}

function start_drag(tile)
{
	curr_tile = tile;
}

function dist(p0x, p0y, p1x, p1y)
{
    var a = p1x - p0x;
    var b = p1y - p0y;
    return Math.sqrt(a*a + b*b);
}

function update_tile()
{
    curr_tile.style.left = curr_tile.px + "px";
    curr_tile.style.top = curr_tile.py + "px";
}

function snap_pos(x, y)
{
    if (dist(x, y, curr_tile.px, curr_tile.py) <= 20)
    {
        curr_tile.px = x;
        curr_tile.py = y;
        update_tile();
        return true;
    }
    return false;
}

function drag(event, tile)
{
	if (curr_tile != null)
	{
        curr_tile.px = event.clientX-40;
        curr_tile.py = event.clientY-50;
        update_tile();
        
        var px = Math.round((curr_tile.px - 10) / 80) * 80 + 10;
        if (!snap_pos(px, 10))
            snap_tiles();
	}
}

function snap_tiles()
{
    var did_snap = false;
    for (var i = 0; i < tiles.length; i++)
    {
        var tile = tiles[i];
        if (tile != curr_tile)
        {
            if (snap_pos(tile.px + 70, tile.py))
            {
                snap_right(tile);
                did_snap = true;
            }
            
            if (snap_pos(tile.px - 70, tile.py))
            {
                snap_left(tile);
                did_snap = true;
            }
        }
    }
    
    if (!did_snap)
        unsnap();
}

function snap_right(tile)
{
    var group = find_group(tile);
    if (group == null)
        groups.push([create_group(), [tile, curr_tile]]);
    else if (group.indexOf(curr_tile) == -1)
        group.push(curr_tile);
}

function snap_left(tile)
{
    var group = find_group(tile);
    if (group == null)
        groups.push([create_group(), [curr_tile, tile]]);
    else if (group.indexOf(curr_tile) == -1)
        group.unshift(curr_tile);
}

function unsnap()
{
    var group = find_group(curr_tile);
    if (group != null)
    {
        group.splice(group.indexOf(curr_tile), 1);
        if (group.length <= 0)
            groups.splice(
    }
}

function find_group(tile)
{
    for (var i = 0; i < groups.length; i++)
    {
        var group = groups[i];
        if (group.indexOf(tile) != -1)
            return group;
    }
    return null;
}

function end_drag()
{
	curr_tile = null;
}
