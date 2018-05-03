
var http = require('http');
var fs = require('fs');
var colours = ["red", "blue", "orange", "green"];
var games = [];

function init(port)
{
    http.createServer(connection).listen(port);
}

function find_game_by_code(code)
{
	for (var i = 0; i < games.length; i++)
		if (games[i].code == code)
			return games[i];
	return null;
}

function read_data(body)
{
    var data = [];
    var elements = body.split('&');
    for (var i = 0; i < elements.length; i++)
    {
        var chunk = elements[i].split('=');
        data.push([chunk[0], chunk[1]]);
    }
    return data;
}

function handle_post(request, response, user)
{
    var body = "";
    request.on("data", function (chunk) 
    {
        body += chunk;
    });
    
    request.on("end", function()
    {
        var data = read_data(body);
        if (request.url == "/game")
        {
        	var code = data[0][1];
            console.log(code);
        	var game = find_game_by_code(code);
        	if (game != null)
        	{
        		if (game.player == null)
        		{
                    console.log("new game with " + game.host + " and " + user);
        			game.player = user;
        			game.tiles = [];
                    game.local_tiles = {};
        			game.local_tiles[game.host] = [];
        			game.local_tiles[game.player] = [];
                    game.board = [];
					create_tiles(game, game.host, 7);
        			create_tiles(game, game.player, 7);
                    game.turn = game.player;
        		}
        	}
        }
        handle_request(request, response, user, data);
    });
}

function create_tiles(game, user, num)
{
	var local_tiles = game.local_tiles[user];
	for (var i = 0; i < num; i++)
	{
		var number = Math.floor(Math.random() * 13)+1;
		var colour = colours[Math.floor(Math.random() * colours.length)];
		var id = Math.floor(Math.random() * 99999);
		var tile = {id: id, number: number, colour: colour};
		local_tiles.push(tile);
        game.tiles.push(tile);
	}
}

function connection(request, response)
{
    console.log("url=" + request.url + ", method=" + request.method);
    var user = request.connection.remoteAddress;
    if (request.method == "POST")
		handle_post(request, response, user);
    else
    	handle_request(request, response, user);
}

function handle_request(request, response, user, data=[])
{
	var url = request.url;
    switch(url)
    {
        case "/": home_page(response, user); break;
		case "/game": send_file("RummyTiles.html", response); break;
		case "/tiles": req_tiles(response, user); break;
		case "/next": req_next(response, user, data); break;
        case "/turn": req_turn(response, user); break;
        case "/update": req_update(response, user); break;
        default: send_file("." + url, response); break;
    }
}

function req_update(response, user)
{
    var game = find_game(user);
    if (game != null)
    {
        if (game.turn != user)
        {
            write_text(response, "false");
            return;
        }
        
        write_json(response, game.board);
    }
}

function req_turn(response, user)
{
    var game = find_game(user);
    if (game != null)
        write_text(response, (game.turn == user).toString());
}

function write_json(response, data)
{
	var json = JSON.stringify(data);
	response.writeHead(200,
	    {'Content-Type':'text/json;charset=UTF-8',
	    'Content-Length':json.length}
	);
	response.write(json);
	response.end();
}

function req_tiles(response, user)
{
	var game = find_game(user);
	if (game != null)
	{
        console.log(game);
        if (game.player != null)
        {
            var tiles = game.local_tiles[user];
            write_json(response, tiles);
        }
	}
}

function write_text(response, text)
{
    response.writeHead(200,
        {'Content-Type':'text/html;charset=UTF-8',
        'Content-Length':text.length}
    );
    response.write(text);
    response.end();
}

function find_tile(game, id)
{
    for (var i = 0; i < game.tiles.length; i++)
        if (game.tiles[i].id == id)
            return game.tiles[i];
    return null;
}

function group_tiles(board)
{
    var groups = [];
    var has_group = [];
    for (var i = 0; i < board.length; i++)
    {
        var tile = board[i];
        if (has_group.indexOf(tile) == -1)
        {
            var group = [tile];
            if (tile.left != null)
                group = scan_left(tile.left, board, has_group).concat(group);
            if (tile.right != null)
                group = group.concat(scan_right(tile.right, board, has_group));
            groups.push(group);
        }
    }
    return groups;
}

function find_state(board, id)
{
    for (var i = 0; i < board.length; i++)
        if (board[i].tile.id == id)
            return board[i];
    return null;
}

function scan_left(id, board, has_group)
{
    var state = find_state(board, id);
    has_group.push(state);
    if (state.left != null)
        return scan_left(state.left, board, has_group).concat([state]);
    return [state];
}

function scan_right(id, board, has_group)
{
    var state = find_state(board, id);
    has_group.push(state);
    if (state.right != null)
        return [state].concat(scan_right(state.right, board, has_group));
    return [state];
}

function decode_tiles(game, data)
{
    var board = [];
    for (var i = 0; i < data.length; i++)
    {
        var pair = data[i];
        if (pair.length >= 2 && pair[1] != null)
        {
            var id = parseInt(pair[0]);
            var tile_data = pair[1].split(',');
            var px = parseInt(tile_data[0]);
            var py = parseInt(tile_data[1]);
            var left = tile_data[2] == "null" ? null : parseInt(tile_data[2]);
            var right = tile_data[3] == "null" ? null : parseInt(tile_data[3]);
            
            var tile = find_tile(game, id);
            var state = {tile: tile, px: px, py: py, 
                left: left, right: right};
            board.push(state);
        }
    }
    return board;
}

function is_group_valid(group)
{
    if (group.length < 3)
        return false;
    
    var same_number = true;
    var same_colour = true;
    var diffrent_colours = true;
    var counts_up = true;
    
    var last_num = null;
    var last_colour = null;
    var colours = [];
    var counter = null;
    for (var i = 0; i < group.length; i++)
    {
        var state = group[i];
        var tile = state.tile;
        
        if (last_num == null) last_num = tile.number;
        if (last_num != tile.number) same_number = false;
        last_num = tile.number;
        
        if (last_colour == null) last_colour = tile.colour;
        if (last_colour != tile.colour) same_colour = false;
        last_colour = tile.colour;
        
        if (colours.indexOf(tile.colour) != -1) 
            diffrent_colours = false;
        colours.push(tile.colour);
        
        if (counter == null) counter = tile.number-1;
        if (tile.number != counter+1) counts_up = false;
        counter++;
    }
    
    return (same_number && diffrent_colours) || (same_colour && counts_up);
}

function is_valid(game, data)
{
    var board = decode_tiles(game, data);
    var groups = group_tiles(board);
    for (var i = 0; i < groups.length; i++)
    {
        var group = groups[i];
        if (!is_group_valid(group))
            return false;
    }
    return true;
}

function req_next(response, user, data)
{
	var game = find_game(user);
	if (game != null)
	{
        var valid = is_valid(game, data);
        if (valid)
        {
            write_text(response, "ok");
            game.board = decode_tiles(game, data);
        }
        else
        {
            var tiles = game.local_tiles[user];
            create_tiles(game, user, 1);
            write_json(response, tiles[tiles.length-1]);
        }
        
        if (game.turn == game.player)
            game.turn = game.host;
        else
            game.turn = game.player;
	}
}

function make_game(user)
{
    var code = "";
    for (var i = 0; i < 8; i++)
    {
        var digit = Math.floor(Math.random() * 26);
        code += String.fromCharCode(digit + 65);
    }
    
    var game = {host: user, player: null, code: code};
    games.push(game);
    return game;
}

function find_game(user)
{
    for (var i = 0; i < games.length; i++)
        if (games[i].host == user || games[i].player == user)
            return games[i];
    return null;
}

function home_page(response, user)
{
	var game = find_game(user);
	if (game == null)
		game = make_game(user);
    
	send_file("index.html", response, [["code", game.code]]);
}

function send_file(file_path, response, rep=[])
{
    fs.readFile(file_path,
        function(error, data)
        {
            if (error)
            {
                response.writeHead(404,
                    {'Content-Type':'text/html','Content-Length':3}
                );
                response.write("404");
            }
            else
            {
                var str = data.toString('utf-8');
                for (var i = 0; i < rep.length; i++)
                {
                    var name = "{{ " + rep[i][0] + " }}";
                    var value = rep[i][1];
                    str = str.split(name).join(value);
                }
                
                var type = "html";
                if (file_path.endsWith(".css"))
                    type = "css";
                
                response.writeHead(200,
                    {'Content-Type':'text/' + type + ';charset=UTF-8',
                    'Content-Length':str.length}
                );
                response.write(str);
            }
            
            response.end();
        }
    );
}

init(8080);
