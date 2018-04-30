
var curr_tile = null;
var curr_pos = 10;
var colours = ["red", "blue", "orange", "green"];
var tiles = [];
var in_group = [];
var groups = [];
var html_groups = [];

function create_tile()
{
	var tile = document.createElement("div");
	tile.className = "tile";
	tile.style = "left:" + curr_pos + "px;top:10px";
	tile.onmousedown = function() {start_drag(tile)};
	tile.px = curr_pos;
	tile.py = 10;
	tile.left = null;
	tile.right = null;
	tile.number = Math.floor(Math.random() * 13)+1;
	tile.colour = colours[Math.floor(Math.random() * colours.length)];
	
	var number = document.createElement("text");
	number.style = "color:" + tile.colour;
	number.innerHTML = tile.number;
	tile.appendChild(number);
	document.body.appendChild(tile);
    tiles.push(tile);
	curr_pos += 80;
}

function create_group(x, y, width, valid)
{
    var group = document.createElement("div");
    group.className = "group";
    group.style.left = (x-10) + "px";
    group.style.top = (y-10) + "px";
    group.style.width = (width+80) + "px";
    group.style.backgroundColor = valid ? "green" : "red";
    document.body.appendChild(group);
    html_groups.push(group);
}

function clear_groups()
{
	for (var i = 0; i < html_groups.length; i++)
	{
		var group = html_groups[i];
		document.body.removeChild(group);
	}
	html_groups = [];
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
        update_groups();
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
	tile.right = curr_tile;
	curr_tile.left = tile;
}

function snap_left(tile)
{
    tile.left = curr_tile;
	curr_tile.right = tile;
}

function unsnap()
{
    if (curr_tile.left != null)
    {
    	curr_tile.left.right = null;
    	curr_tile.left = null;
    }
    
    if (curr_tile.right != null)
    {
    	curr_tile.right.left = null;
    	curr_tile.right = null;
    }
}

function update_groups()
{
	clear_groups();
	in_group = [];
	groups = [];
	for (var i = 0; i < tiles.length; i++)
	{
		var tile = tiles[i];
		if (in_group.indexOf(tile) == -1)
		{
			var group = [tile];
			if (tile.left != null)
				group = scan_left(tile.left).concat(group);
			if (tile.right != null)
				group = group.concat(scan_right(tile.right));

			in_group.push(tile);
			if (group.length > 1)
				groups.push(group);
		}
	}
	
	for (var i = 0; i < groups.length; i++)
	{
		var group = groups[i];
		var first = group[0];
		var last = group[group.length-1];
		var valid = is_group_valid(group);
		create_group(first.px, first.py, last.px - first.px, valid);
	}
}

function is_group_valid(group)
{
	if (group.length <= 2)
		return false;
	
	var follow_num = true;
	var same_colour = true;
	var same_number = true;
	var diffrent_colours = true;
	
	var counter = null;
	var colour = null;
	var number = null;
	var colours = [];
	for (var i = 0; i < group.length; i++)
	{
		var tile = group[i];
		if (counter == null)
			counter = tile.number;
		else
			if (tile.number != ++counter)
				follow_num = false;
		
		if (colour == null)
			colour = tile.colour;
		else
			if (tile.colour != colour)
				same_colour = false;
		
		if (number == null)
			number = tile.number;
		else
			if (tile.number != number)
				same_number = false;
		
		if (colours.indexOf(tile.colour) != -1)
			diffrent_colours = false;
		colours.push(tile.colour);
	}
	
	return (follow_num && same_colour) || (same_number && diffrent_colours);
}

function scan_left(tile)
{
	in_group.push(tile);
	if (tile.left != null)
		return scan_left(tile.left).concat([tile]);
	return [tile];
}

function scan_right(tile)
{
	in_group.push(tile);
	if (tile.right != null)
		return [tile].concat(scan_right(tile.right));
	return [tile];
}

function end_drag()
{
	curr_tile = null;
}

