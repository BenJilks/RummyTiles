
var http = require('http');
var fs = require('fs');
var games = [];

function init(port)
{
    http.createServer(connection).listen(port);
}

function handle_post(request)
{
    var body = "";
    request.on("data", function (chunk) 
    {
        body += chunk;
    });
    
    request.on("end", function()
    {
        console.log(body);
    });
}

function connection(request, response)
{
    var user = request.connection.remoteAddress;
    if (request.method == "POST")
        handle_post(request);
    
    var url = request.url;
    console.log(url);
    switch(url)
    {
        case "/": home_page(response, user); break;
        case "/game": send_file("RummyTiles.html", response); break;
        default: send_file("." + url, response); break;
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
    
    var game = {host: user, code: code};
    games.push(game);
    return game;
}

function find_game(user)
{
    for (var i = 0; i < games.length; i++)
        if (games[i].host == user)
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
                    'Content-Length':data.length}
                );
                response.write(str);
            }
            
            response.end();
        }
    );
}

init(8080);
