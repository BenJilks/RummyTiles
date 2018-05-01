
var curr_tile = null;
var tiles = [];
var in_group = [];
var groups = [];
var html_groups = [];
var slots = [];
var slot_offest = 10;
var intervals = [];
var last_board = [];

function get(url)
{
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", url, false);
	xmlHttp.send(null);
	return xmlHttp.responseText;
}

function post(url, data)
{
	var str = "";
	for (var i = 0; i < data.length; i++)
		str += data[i][0] + "=" + data[i][1] + 
			(i == data.length-1 ? "" : "&");

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", url, false);
	xmlHttp.send(str);
	return xmlHttp.responseText;
}

function init()
{
	var tile_json = get("/tiles");
	var tile_data = JSON.parse(tile_json);
	for (var i = 0; i < tile_data.length; i++)
	{
		var tile = tile_data[i];
		create_tile(tile.id, tile.number, 
			tile.colour);
	}
}

function create_tile(id, number, colour)
{
	var tile = document.createElement("div");
    var slot = find_slot();
    var pos = slot * 80 + slot_offest;
    
	tile.className = "tile";
	tile.style = "left:" + pos + "px;top:10px";
	tile.onmousedown = function() {start_drag(tile)};
	tile.px = pos;
	tile.py = 10;
	tile.left = null;
	tile.right = null;
	tile.id = id;
	tile.number = number;
	tile.colour = colour;
	
	var number = document.createElement("text");
	number.style = "color:" + tile.colour;
	number.innerHTML = tile.number;
	tile.appendChild(number);
	document.body.appendChild(tile);
    tiles.push(tile);
    slots[slot] = tile;
}

function update_slots()
{
    for (var i = 0; i < slots.length; i++)
    {
        var tile = slots[i];
        if (tile != null)
        {
            tile.px = i * 80 + slot_offest;
            update_tile(tile);
        }
    }
    update_slot_scroll();
}

function scroll_right()
{
    var i = setInterval(function() 
    {
        slot_offest -= 10;
        update_slots();
    }, 5);
    intervals.push(i);
}

function scroll_left()
{
    var i = setInterval(function() 
    {
        slot_offest += 10;
        update_slots();
    }, 5);
    intervals.push(i);
}

function stop_scroll()
{
    for (var i = 0; i < intervals.length; i++)
        clearInterval(intervals[i]);
    intervals = [];
}

function find_slot()
{
    for (var i = 0; i < slots.length; i++)
        if (slots[i] == null)
            return i;
    return slots.length;
}

function create_group(x, y, width)
{
    var group = document.createElement("div");
    group.className = "group";
    group.style.left = (x-13) + "px";
    group.style.top = (y-13) + "px";
    group.style.width = (width+80) + "px";
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

function snap_pos(x, y)
{
    if (dist(x, y, curr_tile.px, curr_tile.py) <= 20)
    {
        curr_tile.px = x;
        curr_tile.py = y;
        return true;
    }
    return false;
}

function clear_tile()
{
    for (var i = 0; i < slots.length; i++)
        if (slots[i] == curr_tile)
            slots[i] = null;
}

function update_tile(tile)
{
    tile.style.left = tile.px + "px";
    tile.style.top = tile.py + "px";
}

function drag(event, tile)
{
	if (curr_tile != null)
	{
        curr_tile.px = event.clientX-40;
        curr_tile.py = event.clientY-50;
        clear_tile();
        
        if (curr_tile.py <= 100)
        {
            var slot = Math.round((curr_tile.px - slot_offest) / 80);
            var px = slot * 80 + slot_offest;
            if (slots[slot] == null)
            {
                curr_tile.px = px;
                curr_tile.py = 10;
                slots[slot] = curr_tile;
            }
        }
        else
        {
            snap_tiles();
        }
        
        update_groups();
        update_tile(curr_tile);
        update_slot_scroll();
        update_next_button();
	}
}

function update_slot_scroll()
{
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    
    var last = slots.length;
    if (last * 80 + slot_offest > window.innerWidth)
        right.style.display = "block";
    else
        right.style.display = "none";
    
    if (slot_offest < 10)
        left.style.display = "block";
    else
        left.style.display = "none";
}

function snap_tiles()
{
    var did_snap = false;
    for (var i = 0; i < tiles.length; i++)
    {
        var tile = tiles[i];
        if (tile != curr_tile)
        {
        	if (tile.right == null || tile.right == curr_tile)
        	{
            	if (snap_pos(tile.px + 70, tile.py))
            	{
            	    snap_right(tile);
            	    did_snap = true;
            	}
            }
            
            if (tile.left == null || tile.left == curr_tile)
        	{
           		if (snap_pos(tile.px - 70, tile.py))
            	{
            	    snap_left(tile);
            	    did_snap = true;
            	}
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
		if (in_group.indexOf(tile) == -1 && tile.py > 100)
		{
			var group = [tile];
			if (tile.left != null)
				group = scan_left(tile.left).concat(group);
			if (tile.right != null)
				group = group.concat(scan_right(tile.right));

			in_group.push(tile);
            groups.push(group);
		}
	}
	
	for (var i = 0; i < groups.length; i++)
	{
		var group = groups[i];
        var valid = is_group_valid(group);
        
        if (!valid)
        {
            var first = group[0];
            var last = group[group.length-1];
            create_group(first.px, first.py, last.px - first.px, valid);
        }
	}
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

// It's very messy, but it works I guess
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

function replace_tile(tile)
{
	var slot = find_slot();
    tile.px = slot * 80 + slot_offest;
    tile.py = 10;
    slots[slot] = tile;
    update_tile(tile);
    update_slot_scroll();
}

function end_drag()
{
    if (curr_tile != null)
    {
        if (curr_tile.py <= 100 && slots.indexOf(curr_tile) == -1)
        	replace_tile(curr_tile);
        curr_tile = null;
    }
}

function does_match(a, b)
{
    if (a.length != b.length)
        return false;
    
    for (var i = 0; i < a.length; i++)
        if (a[i] != b[i])
            return false;
    
    return true;
}

function update_next_button()
{
    var diffrent = false;
    var all_valid = true;
    for (var i = 0; i < groups.length; i++)
    {
        var group = groups[i];
        var has_match = false;
        for (var j = 0; j < last_board.length; j++)
        {
            var other = last_board[j];
            if (does_match(group, other))
            {
                has_match = true;
                break;
            }
        }
        
        if (!has_match)
            diffrent = true;
        if (!is_group_valid(group))
            all_valid = false;
    }
    
    var button = document.getElementById("next");
    if (diffrent && all_valid)
    {
        button.style.backgroundColor = "green";
        button.innerHTML = "Finish";
    }
    else
    {
        button.style.backgroundColor = "red";
        button.innerHTML = "Pickup";
    }
}

function next_turn(button)
{
	if (button.innerHTML == "Pickup")
	{
		var data = [];
		for (var i = 0; i < tiles.length; i++)
		{
			var tile = tiles[i];
			if (tile.py > 100)
			{
				var info = tile.px + "," + tile.py + ",";
				info += (tile.left == null ? "null" : tile.left.id) + ",";
				info += tile.right == null ? "null" : tile.right.id;
				data.push([tile.id, info]);
			}
		}
		
		var response = post("/next", data);
		if (response != "ok")
		{
			var tile = JSON.parse(response);
			create_tile(tile.id, tile.number, tile.colour);
			
			for (var i = 0; i < last_board.length; i++)
			{
				var group = last_board[i];
				for (var j = 0; j < group.length; j++)
				{
					
				}
			}
		}
		else
			last_board = groups;
	}
}
