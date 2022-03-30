/*chrome.browserAction.onClicked.addListener(function(tab){
  chrome.tabs.executeScript(tab.id, {
    code: "(" + refreshPopaup.toString() + ")();"
  });  
});

var refreshPopaup = function(){
  let podrazc = 'пусто';
  podrazc = chrome.storage.local.get(['podrazdelenie'], function(result){
    console.log(result.podrazdelenie);
  });

  $("#statistic").html("Подразделение: ".concat(podrazc));
}*/

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    console.log("request",request);
    console.log("sender",sender);
    console.log("sendResponse",sendResponse);
    var cmd = request.cmd,
        params = request.params;
    try {
        switch (cmd) {
            case "getUsageAndQuota":
                navigator.webkitPersistentStorage.queryUsageAndQuota(function(u,q){
                    sendResponse({"usage": u,"quota":q});
                });
                break;
            case "open":
                db.open(params).then(function (s) {
                    server = s;
                    var exclude = "add close get query remove update".split(" ");
                    var tables = new Array();
                    for(var table in server){
                        if(exclude.indexOf(table)==-1){
                            tables.push(table);
                        }
                    }
                    sendResponse(tables);
                });
                break;
            case "close":
                server.close();
                sendResponse({});
                break;
            case "get":
                server[request.table].get(params).then(sendResponse)
                break;
            case "add":
                server[request.table].add(params).then(sendResponse);
                break;
            case "update":
                server[request.table].update(params).then(sendResponse);
                break;
            case "remove":
                server[request.table].remove(params).then(sendResponse);
                break;
            case "execute":
                var tmp_server = server[request.table];
                var query = tmp_server.query.apply(tmp_server, obj2arr(request.query));
                var flt;
                for (var i = 0; i < request.filters.length; i++) {
                    flt = request.filters[i];
                    if (flt.type == "filter") {
                        flt.args = new Function("item", flt.args[0]);
                    }
                    query = query[flt.type].apply(query, obj2arr(flt.args));
                }
                query.execute().then(sendResponse);
                break;
        }
    } catch (error) {
        if (error.name != "TypeError") {
            sendResponse({RUNTIME_ERROR: error});
        }
    }
    
    if (request.action === 'RefreshIcon'){        
        let icon = 'normal';
        $.each(request.suspended, function(key,suspended_num){ 
            icon = (suspended_num.document_numbers.length>0 && !suspended_num.visited) ? 'attention' : 'normal';
            return !(icon === 'attention');
        });
        if(icon === 'attention'){
            chrome.browserAction.setIcon({
                path: {
                    "16": "icon16 !.png",
                    "48": "icon48 !.png",
                    "128": "icon128 !.png"
                }
            }); 
        } else {
            chrome.browserAction.setIcon({
                path: {
                    "16": "icon16.png",
                    "48": "icon48.png",
                    "128": "icon128.png"
                }
            });         
        }
    }/* else if(request.action === 'Update_Suspended_Nums'){   
        window.localStorage.suspended_nums = JSON.stringify(request.suspended_nums);  
        chrome.storage.local.set({suspended_nums : request.suspended_nums}, function(){
            console.log(request);
        });
    }*/
    return true;
});
