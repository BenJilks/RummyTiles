
function get(url, response)
{
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() 
    {
    	if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
			response(xmlHttp.responseText);
    };
	xmlHttp.open("GET", url, true);
	xmlHttp.send(null);
}

function refesh()
{
    get("/tiles", function(data)
    {
    	if (data != "false")
    		window.location.href = "/game";
    });
}

setInterval(refesh, 500);

