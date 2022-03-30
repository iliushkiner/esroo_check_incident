// JavaScript Document
var Suspended_Nums = {"suspended_nums":{}};
var indexeddb = {
  server: 'pkurp-suspended',
  version: 1,
  schema: {
    suspended: {
      key: { keyPath: 'id', autoIncrement: true },
      // Optionally add indexes
      indexes: {
        appealNumber: { },
        visited : { },
        
      }
    }
  }
};

function getQuota(db){
  db.getUsageAndQuota(function(r){
    console.log("used", r.usage);
    console.log("quota", r.quota);
    //db.close(function(){console.log("closed");});
  });
}

$(document).ready(function(){ 
  var db = new exDB();
  db.open(indexeddb, function () {
    getQuota(db);
  });
  
  function load(){ 
    //Suspended_Nums = (typeof(window.localStorage.suspended_nums) != "undefined" ? JSON.parse(window.localStorage.suspended_nums) : Suspended_Nums);
    
    let db = new exDB();
    db.open(indexeddb, function () {
        /*db.table("people").query("answer").all().desc().execute(function(r){
            console.log("all",r);
        });*/
        db.suspended.query("appealNumber").all().desc().execute(function(r){
            console.log("Suspended",r);

            let htm = '<div class="row">';  
            $.each(r, function(key,suspended_num){
                if((!suspended_num.visited || $('#show_all')[0].checked) && suspended_num.document_numbers.length>0){
                    htm += '<div id="appealnum-' + suspended_num.appealNumber + '" class="col-xs-6"><div><a target="_blank" href="http://pkurp-app-balancer-01.prod.egrn/00/requests/' + suspended_num.appealNumber + '/documents?_id=' + suspended_num.appealNumber + '">' + suspended_num.appealNumber + '</a> <input class="visited" data-suspended=\'' + JSON.stringify(suspended_num) + '\' type="button" value="' + (!suspended_num.visited ? 'отметить' : 'включить') + '"></div></div>';
                }    
            });    
            htm += '</div>';
            
            $('#suspended_nums').html(htm);
        });
    }); 
  }
  
  load();
 
  function refreshStatus(){
    let db = new exDB();
    db.open(indexeddb, function () {
        /*db.table("people").query("answer").all().desc().execute(function(r){
            console.log("all",r);
        });*/
        db.suspended.query("appealNumber").all().desc().execute(function(r){
            console.log("SUSPENDED",r);
            chrome.runtime.sendMessage({action: 'RefreshIcon', suspended: r});
        });
    });                        
  }    
    
  $('body').on('click', '.visited', function(){  
    let suspended = $(this).data('suspended');
    //suspended = JSON.parse(suspended);
    suspended.visited = !suspended.visited;
    
    let db = new exDB();
    db.open(indexeddb, function () {
        db.table("suspended").update(suspended,function(r){
            console.log("Изменеие записи в IndexedDB",r);
        });                        
    });
    
    if (suspended.visited && !$('#show_all')[0].checked){
        $('#appealnum-'+suspended.appealNumber).remove();
    }
    $('#appealnum-' + suspended.appealNumber + ' .visited').val(suspended.visited ? 'включить' : 'отметить');
    //chrome.runtime.sendMessage({action: 'RefreshIcon'});
    refreshStatus()
  });
  
  $('#refresh').on('click', function(){  
      load();
  });
  
  $('#show_all').on('click', function(){  
      load();
  });
});
