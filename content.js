var timeout = 30000;
var Suspended_Nums = {"suspended_nums":{}};
var indexeddb = {
  server: 'pkurp-suspended',
  version: 1,
  schema: {
    suspended: {
      key: { keyPath: 'id', autoIncrement: true },
      // Optionally add indexes
      indexes: {
        appealNumber: { unique: true },
        visited : { },
        
      }
    }
  }
};

async function getLocalStorageValue(name){
    return new Promise(resolve => {
      chrome.storage.local.get(name, data=> {
        resolve(data);
      });
    });
}

function refreshStatus(){
    let db = new exDB();
    db.open(indexeddb, function () {
        /*db.table("people").query("answer").all().desc().execute(function(r){
            console.log("all",r);
        });*/
        db.suspended.query("appealNumber").all().desc().execute(function(r){
            console.log("Suspended",r);
            chrome.runtime.sendMessage({action: 'RefreshIcon', suspended: r});
        });
    });                        
}

(async() => {
    let tmptimeout = await getLocalStorageValue('plg_psca_timeout');
    timeout = (Object.values(tmptimeout).length>0 ? parseInt(Object.values(tmptimeout)[0]) : timeout);
    console.log("timeout:",timeout);
    
    /*let tmpSuspended_Nums = await getLocalStorageValue('suspended_nums');
    Suspended_Nums = (typeof(tmpSuspended_Nums.suspended_nums) != "undefined" ? tmpSuspended_Nums : Suspended_Nums);*/
    
    refreshStatus();
    //chrome.runtime.sendMessage({action: 'RefreshIcon'});

  
setInterval(function (){
    /*function postAjaxData(url, json){
      var result = "";
      $.ajax({
        url: url,
        dataType: "json",
        data: JSON.stringify(json),
        method: "POST",
        contentType: "application/json;charset=UTF-8",
        async: false,
        success: function(data) {
          //console.log(data);
          result = data;
        } 
      });
      return result
    }*/
    
    function getAjaxDataPKURP(suspended_num){
        //var result = ""; //возврат при неасинхронном запуске
        let url = "http://pkurp-app-balancer-01.prod.egrn/00/requests/"+suspended_num.appealNumber+"/documents?_id=" + suspended_num.appealNumber;
        
        $.ajax({
            url: url,
            dataType: "html",
            method: "GET",
            contentType: "text/html; charset=utf-8",
            async: true,
            success: function(data) {
                //result = data; //возврат при неасинхронном запуске
                //console.log(data);
                //<input class="js-autofill-element" type="checkbox" style="display: none; margin-right: 5px;" data-fields="{&quot;_type&quot;:&quot;RegistryData::DocumentRequisites&quot;,&quot;document_code&quot;:[&quot;558610800000&quot;,{&quot;value&quot;:&quot;Дополнительные документы, представляемые заявителем, в том числе с целью устранения причин, приведших к приостановлению государственного кадастрового учета и (или) государственной регистрации прав (статья 29 Закона)&quot;}],&quot;document_name&quot;:&quot;Дополнительные документы, представляемые заявителем, в том числе с целью устранения причин, приведших к приостановлению государственного кадастрового учета и (или) государственной регистрации прав (статья 29 Закона)&quot;,&quot;document_number&quot;:&quot;КУВД-001/2021-3670443&quot;,&quot;document_date&quot;:&quot;2021-02-03T00:00:00Z&quot;}" data-doc-id="af6c809b-0f79-488a-af38-24f766caff5f" data-doc-type="subprimary" data-subrequest-id="PKPVDMFC-2021-02-03-419758">                    
                let regexp = new RegExp('<input class="js-autofill-element" type="checkbox" style="display: none; margin-right: 5px;" data-fields="(.+?)" data-doc-id=".+?" data-doc-type="subprimary" data-subrequest-id=".+?">','gi');
                //let match = data.matchAll(patern);
                let saved = true;                
                while ((matches = regexp.exec(data)) !== null) {
                    //console.log(`Found ${matches}. Next starts at ${regexp.lastIndex}.`);
                    //console.log(matches[1]);  
                    valid_data = matches[1].replace(/&quot;/g, '"');
                    let doc_data = JSON.parse(valid_data);
                    console.log(doc_data);
                    //Suspended_Nums = {"suspended_nums": [{"appealNum" : appealNum, document_number : []}]};
                    
                    if (typeof(doc_data.document_code) != "undefined" && doc_data.document_code != null && typeof(doc_data.document_code[0]) != "undefined" && doc_data.document_code[0] == "558610800000"){
                        if(suspended_num.document_numbers.indexOf(doc_data.document_number)<0){
                            suspended_num.document_numbers.push(doc_data.document_number);
                            suspended_num.visited = false;
                            saved = false;
                        }
                    }
                }                
                if (!saved){
                    /**
                     * Запись в IndexedDB номера обращения
                     */
                    let db = new exDB();
                    db.open(indexeddb, function () {
                        if (suspended_num.id === -1){
                            delete suspended_num.id;
                            db.table("suspended").add(suspended_num,function(r){
                                console.log("Добавлена запись в IndexedDB",r);
                            });
                        } else {
                            db.table("suspended").update(suspended_num,function(r){
                                console.log("Изменеие записи в IndexedDB",r);
                            });
                        }
                    });
                    //console.log(Suspended_Nums);
                    /*chrome.runtime.sendMessage({action: 'Update_Suspended_Nums',suspended_nums: Suspended_Nums.suspended_nums}
                        //, function(response){console.log(response.farewell);}
                    );*/
                    //chrome.storage.local.set(Suspended_Nums);
                    
                    //chrome.runtime.sendMessage({action: 'RefreshIcon', suspended: r});
                    refreshStatus();                    
                }
            } 
        });
        //return result //возврат при неасинхронном запуске
    }    
    
    function getAjaxData(url){
        //var result = ""; //возврат при неасинхронном запуске
        $.ajax({
            url: url,
            dataType: "html",
            method: "GET",
            contentType: "text/html; charset=utf-8",
            async: true,
            success: function(data) {
                //result = data; //возврат при неасинхронном запуске
                //console.log(data);
                let regexp = new RegExp('<div class="claims-list-collapse .+?" data-id="(.+?)">','gi');
                //let match = data.matchAll(patern);
                while ((matches = regexp.exec(data)) !== null) {                    
                    //http://pkurp-app-balancer-01.prod.egrn/00/requests/PKPVDMFC-2021-01-28-548444/documents?_id=PKPVDMFC-2021-01-28-548444                    
                    let appealNum = matches[1];//"PKPVDMFC-2021-01-28-548444";
                    console.log("appealNumber: ",appealNum);
                    
                    let suspended_num = {"appealNumber": appealNum, "document_numbers": [], "visited" : false, "id" : -1};
                    /**
                     * Получаем информацию о приостановленном обращение 
                     */
                    let db = new exDB();
                    db.open(indexeddb, function () {
                                                
                        db.suspended.query("appealNumber").only(appealNum).execute(function(r){
                            console.log("SUSPENDED",r);
                            //if (typeof(suspended_num) == "undefined"){
                            if (r.length<=0){
                                suspended_num = {"appealNumber": appealNum, "document_numbers": [], "visited" : false, "id" : -1};
                            } else {
                                suspended_num = r[0];
                            }                    
                            getAjaxDataPKURP(suspended_num);                    
                        });
                        //suspended_num = r.
                        /*let filter = "return item.reassignReg=='"+reassignReg+"' && item.reassignDate>="+ reassignDate.getTime() +" && item.reassignDate<"+ reasign_end_date.getTime();
                        //console.log("filter",filter);
                        db.table("reassigns").query("appealNumber").filter(filter).execute(function(r){
                            if (r != null){
                                $(selector).html(r.length);
                            } else {
                                $(selector).html("-");
                            }
                        });*/
                    });
                    
                    //suspended_num = Suspended_Nums.suspended_nums[appealNum];
                }
                console.log("---------------------------------------------")
                regexp = new RegExp('<ul class="pager">(.+?)</ul>','gi');
                while ((matches = regexp.exec(data)) !== null) {
                    //console.log(`Found ${matches}. Next starts at ${regexp.lastIndex}.`);*/
                    //console.log(matches[1]);
                    let regexpnext = new RegExp('<a rel="next" href="(.+?)">\\d+<\\/a>','gi');
                    let regexpb = new RegExp('<a rel="next" href="(.+?)">\\d+<\\/a>','gi');
                    
                    if((matchesb = regexpb.exec(matches[1])) === null){
                        /**
                        * Чистим лишние из списка
                        */
                       let db = new exDB();
                       db.open(indexeddb, function () {
                            /*db.table("people").query("answer").all().desc().execute(function(r){
                                console.log("all",r);
                            });*/
                            db.suspended.query("appealNumber").all().desc().execute(function(r){
                                console.log("Suspended",r);
                                $.each(r, function(key,suspended){ 
                                    CheckSuspendedAjax(suspended);
                                });
                            });
                        });
                       
                        /*$.each(Suspended_Nums.suspended_nums, function(appeal_Nums,suspended_num){ 
                            if(suspended_num.actual === false){
                                delete Suspended_Nums.suspended_nums[appeal_Nums];
                            }
                        });*/
                    }
                    
                    while ((matchesnext = regexpnext.exec(matches[1])) !== null) {
                        console.log(matchesnext[1]);
                        getAjaxData(matchesnext[1]);                       
                    }
                }
            } 
        });
        //return result //возврат при неасинхронном запуске
    }
    
    function CheckSuspendedAjax(suspended){
        //var result = ""; //возврат при неасинхронном запуске
        let url = "http://pkurp-app-balancer-01.prod.egrn/12/requests/" + suspended.appealNumber + "/validations_views/statements";
        $.ajax({
            url: url,
            dataType: "html",
            method: "GET",
            contentType: "text/html; charset=utf-8",
            async: true,
            success: function(data) {
                //console.log("Обращение",data);
                let regexptmp = new RegExp('<div class="overflow-hidden break-word">(Ожидание дополнительных документов|Создание уведомлений|Выполнение фоновых задач)<\\/div>','gi');
                //let regexpb = new RegExp('<a rel="next" href="(.+?)">\\d+<\\/a>','gi');
                    
                if((matchesb = regexptmp.exec(data)) === null){                
                    let regexptmptmp = new RegExp('<div class="overflow-hidden break-word">(.+?)<\\/div>','gi');
                    console.log("RegExp matches: ",regexptmptmp.exec(data));
                    let db = new exDB();
                    db.open(indexeddb, function () {
                        db.suspended.remove(suspended.id,function(r){                            
                            console.log("Удаление записи в IndexedDB: ",r);
                            refreshStatus();
                        });
                    });
                }
            } 
        });
        //return result //возврат при неасинхронном запуске
    }
    
    /**
     * Test na obr PKPVDMFC-2021-01-28-548444
     */
    /*if(document.webkitVisibilityState == 'visible'){      
        //let url = "http://pkurp-app-balancer-01.prod.egrn/00/requests/PKPVDMFC-2021-01-28-548444/documents?_id=PKPVDMFC-2021-01-28-548444";
        let appealNum = "PKPVDMFC-2021-01-28-548444";
        let suspended_num = Suspended_Nums.suspended_nums[appealNum];
        if (typeof(suspended_num) == "undefined"){
            //reassigned_today.set(reassignReg, {"count": r.length, "percent": reassigned_today.get(reassignReg).percent, "limit": reassigned_today.get(reassignReg).limit});
            suspended_num = {"document_number" : [], "visited" : false};
            Suspended_Nums.suspended_nums[appealNum] = suspended_num;
            //Suspended_Nums = {"suspended_nums": [appealNum: {document_number : []}]};
        }
        let url = "http://pkurp-app-balancer-01.prod.egrn/00/requests/"+appealNum+"/documents?_id=" + appealNum;
        getAjaxDataPKURP(Suspended_Nums, suspended_num, url);
    }*/
    if(document.webkitVisibilityState == 'visible'){        
        /**
         * отмечаем все как неактульные
         */
        /*$.each(Suspended_Nums.suspended_nums, function(appeal_Nums,suspended_num){ 
            suspended_num.actual = false;
        });*/
        /**
         * Ищем приостановленные обращения
         */
        getAjaxData("http://pkurp-app-balancer-01.prod.egrn/requests?filter=suspended");
        getAjaxData("http://pkurp-app-balancer-01.prod.egrn/requests?filter=additional_documents");
    }    
}, timeout);    
})();