
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

function handle_post(request, response, user)
{
    var body = "";
    request.on("data", function (chunk) 
    {
        body += chunk;
    });
    
    request.on("end", function()
    {
    	console.log(body);
        if (request.url == "/game")
        {
        	var code = body.split('=')[1];
        	var game = find_game_by_code(code);
        	if (game != null)
        	{
        		if (game.player == null)
        		{
        			game.player = user;
        			game.tiles = {};
        			game.tiles[game.host] = [];
        			//game.tiles[game.player] = [];
					create_tiles(game, game.host, 2);
        			//create_tiles(game, game.player, 2);
        		}
        	}
        }
        handle_request(request, response, user, body);
    });
}

function create_tiles(game, user, num)
{
	var tiles = game.tiles[user];
	for (var i = 0; i < num; i++)
	{
		var number = Math.floor(Math.random() * 13)+1;
		var colour = colours[Math.floor(Math.random() * colours.length)];
		var id = Math.floor(Math.random() * 99999);
		var tile = {id: id, number: number, colour: colour};
		tiles.push(tile);
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

function handle_request(request, response, user, data=null)
{
	var url = request.url;
    switch(url)
    {
        case "/": home_page(response, user); break;
		case "/game": send_file("RummyTiles.html", response); break;
		case "/tiles": req_tiles(response, user); break;
		case "/next": req_next(response, user); break;
        default: send_file("." + url, response); break;
    }
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
		var tiles = game.tiles[user];
		write_json(response, tiles);
	}
}

function req_next(response, user)
{
	var game = find_game(user);
	if (game != null)
	{
		var tiles = game.tiles[user];
		create_tiles(game, user, 1);
		write_json(response, tiles[tiles.length-1]);
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
