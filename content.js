var timeout = 30000;
var indexeddb = {
	server: 'esroo-inc',
	version: 1,
	schema: {
		incidents: {
			key: {keyPath: 'id', autoIncrement: true},
			// Optionally add indexes
			indexes: {
				number: {unique: true},
				type: {},
				title: {},
				date: {},
				status: {},
				visited: {},
			}
		}
	}
};

async function getLocalStorageValue(name) {
	return new Promise(resolve => {
		chrome.storage.local.get(name, data => {
			resolve(data);
		});
	});
}

async function setLocalStorageValue(name, value) {
	let storage_param = {};
	storage_param[name] = value;
	chrome.storage.local.set(storage_param, function () {
		console.log(name, ": ", storage_param);
	});
}

function refreshStatus() {
	let dbr = new exDB();
	dbr.open(indexeddb, function () {
		// db.incidents.query("number").all().desc().execute(function(r){
		// db.incidents.query("visited").only('false').execute(function(r){
		dbr.incidents.query("number").filter("return item.visited==false").execute(function (r) {
			console.log("incidents", r);
			if (r.length > 0) {
				chrome.runtime.sendMessage({action: 'RefreshIcon', icon: 'attention'});
			} else {
				chrome.runtime.sendMessage({action: 'RefreshIcon', icon: 'normal'});
			}
		});
		// db.close();
	});
}

(async () => {
	let tmptimeout = await getLocalStorageValue('plg_psca_timeout');
	let plg_psca_icreate = await getLocalStorageValue('plg_psca_icreate');
	timeout = (Object.values(tmptimeout).length > 0 ? parseInt(Object.values(tmptimeout)[0]) : timeout);
	console.log("timeout:", timeout);
	/**
	 * Получаем количество записей в IndexedDB с типом созданные группой.
	 */
	let count_mygroup_creator = 0;
	let count_icreator=0;
	let db0 = new exDB();
	db0.open(indexeddb, function () {
		db0.incidents.query("number").filter("return item.type=='icreator'").execute(function (r) {
			console.log("INCIDENTS", r.length);
			count_icreator = r.length;
		});
		// db.close();
	});
	db0.open(indexeddb, function () {
		db0.incidents.query("number").filter("return item.type=='mygroup_creator'").execute(function (r) {
			console.log("INCIDENTS", r.length);
			count_mygroup_creator = r.length;
		});
		// db.close();
	});
	let onlyStarted = true;

	/*let tmpSuspended_Nums = await getLocalStorageValue('suspended_nums');
	Suspended_Nums = (typeof(tmpSuspended_Nums.suspended_nums) != "undefined" ? tmpSuspended_Nums : Suspended_Nums);*/

	refreshStatus();
	//chrome.runtime.sendMessage({action: 'RefreshIcon'});

	let csrf_token = $('meta[name="csrf-token"]').attr('content');
	setInterval(function () {
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

		function getError() {
			return function (jqXHR, exception) {
				if (jqXHR.status === 0) {
					// alert('Not connect. Verify Network.');
					console.log('Not connect. Verify Network.');
				} else if (jqXHR.status === 404) {
					setLocalStorageValue('plg_psca_next_page', 1);
					console.log('Requested page not found (404).');
				} else if (jqXHR.status === 500) {
					console.log('Internal Server Error (500).');
				} else if (exception === 'parsererror') {
					// setLocalStorageValue('plg_psca_next_page', 1);
					// alert('Requested JSON parse failed.');
					// csrf_token = $(data).attr('content');
					console.log('Requested JSON parse failed.');
				} else if (exception === 'timeout') {
					console.log('Time out error.');
				} else if (exception === 'abort') {
					console.log('Ajax request aborted.');
				} else {
					console.log('Uncaught Error. ' + jqXHR.responseText);
				}
			};
		}

		function getAjaxDataInc(url, inc) {
			$.ajax({
				url: url + inc.number,
				// dataType: "application/json, text/plain, */*",
				method: "GET",
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'X-CSRF-Token': csrf_token,
					'X-Requested-With': 'XMLHttpRequest'
				},
				//contentType: "application/json; charset=utf-8",
				contentType: false,
				// async: false,
				success: function (data) {
					console.log(data);
					if (typeof data.Status !== "undefined" && data.Status !== inc.status) {
						inc.visited = false;
						inc.status = data.Status;
						let dbai = new exDB();
						dbai.open(indexeddb, function () {
							dbai.table("incidents").update(inc, function (r) {
								console.log("Изменеие записи в IndexedDB", r);
							});
							refreshStatus();
							// db.close();
						});
					}
				},
				error: getError()
			});
		}

		function getAjaxData(url, sendType) {
			//var result = ""; //возврат при неасинхронном запуске
			$.ajax({
				url: url,
				// dataType: "application/json, text/plain, */*",
				method: "GET",
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'X-CSRF-Token': csrf_token,
					'X-Requested-With': 'XMLHttpRequest'
				},
				//contentType: "application/json; charset=utf-8",
				contentType: false,
				async: false,
				success: function (data) {
					//result = data; //возврат при неасинхронном запуске

					let regexp = new RegExp('perPage=(\\d+)', 'gi');
					let matches = regexp.exec(url)
					let pageNumMatches = new RegExp('page=(\\d+)', 'gi').exec(url);
					// console.log(pageNumMatches);
					let pageNum = parseInt(pageNumMatches[1]);
					// console.log(matches);
					// console.log(sendType);

					console.log(data);
					if (typeof data.list !== "undefined"/* && sendType !== 'about_inc'*/) {
						let dba = new exDB();
						dba.open(indexeddb, function () {
							$.each(data.list, function (key, requestInc) {
								let incident = {
									"number": requestInc.Incident_Number,
									"type": sendType,
									"title": requestInc.Description,
									"date": requestInc.Submit_Date,
									"status": requestInc.Status,
									"visited": false/*,
									"id": -1*/
								};
								/**
								 * Получаем информацию о инциденте
								 */
								//db.incidents.query("number").filter("return item.number=='"+incident.number+"' && item.status==5").execute(function(r){
								dba.incidents.query("number").only(incident.number).execute(function (r) {
									console.log("INCIDENT", r);
									if (r.length > 0) {
										incident.id = r[0].id;

										if (incident.status !== r[0].status || incident.type !== r[0].type) {
											if (incident.type !== r[0].type){
												incident.visited = r[0].visited;
											}
											dba.table("incidents").update(incident, function (r) {
												console.log("Изменеие записи в IndexedDB", r);
											});
										}
									} else {
										incident.visited = ((incident.status === 4 || incident.status === 5 || incident.status === 6) && sendType === "mygroup_creator" || sendType === 'icreator');
										dba.table("incidents").add(incident, function (r) {
											console.log("Добавлена запись в IndexedDB", r);
										});
										if (sendType === 'mygroup_creator')
											count_mygroup_creator++;
										if (sendType === 'icreator')
											count_icreator++;
									}
									refreshStatus();
								});
							});
							/**
							 * Запись следующей страницы для следущего поиска
							 */
							if (data.total > parseInt(matches[1]) * pageNum && (((sendType === 'mygroup_creator' && count_mygroup_creator < data.total) || sendType !== 'mygroup_creator') || ((sendType === 'icreator' && count_icreator < data.total) || sendType !== 'icreator'))) {
								if (!onlyStarted)
									setLocalStorageValue('plg_psca_' + sendType + '_next_page', pageNum + 1);
								onlyStarted = false;
								// url = url.replace(/page=\d+/g,"page="+(pageNum + 1));
								// getAjaxData(url, sendType);
							} else {
								setLocalStorageValue('plg_psca_' + sendType + '_next_page', 1);
							}
							// db.close();
						});
					} else {
						// setLocalStorageValue('plg_psca_next_page', 1);
						// alert('Requested JSON parse failed.');

						csrf_token = $(data).filter('meta[name="csrf-token"]').attr('content');
					}
				},
				error: getError()
			});
			//return result //возврат при неасинхронном запуске
		}

		if (document.webkitVisibilityState === 'visible') {
			(async () => {
				/**
				 * Ищем назначенные инциденты:
				 * Открытые На группе
				 * В ожидании На группе
				 * Созданные группой
				 */
				let next_page;
				if (!plg_psca_icreate) {
					// Открытые На группе
					next_page = await getLocalStorageValue('plg_psca_opened_next_page');
					next_page = (Object.values(next_page).length > 0 ? parseInt(Object.values(next_page)[0]) : 1);
					getAjaxData("http://10.128.21.4/search/incidents?on=group&state=opened&page=" + next_page + "&perPage=100", "opened");

					// В ожидании На группе
					next_page = await getLocalStorageValue('plg_psca_pending_next_page');
					next_page = (Object.values(next_page).length > 0 ? parseInt(Object.values(next_page)[0]) : 1);
					getAjaxData("http://10.128.21.4/search/incidents?on=group&state=pending&page=" + next_page + "&perPage=100", "pending");

					// Созданные группой
					next_page = await getLocalStorageValue('plg_psca_mygroup_creator_next_page');
					next_page = (Object.values(next_page).length > 0 ? parseInt(Object.values(next_page)[0]) : 1);
					if (onlyStarted) {
						getAjaxData("http://10.128.21.4/search/incidents?on=me&page=1&perPage=100&mygroup_creator=true", "mygroup_creator");
					} else {
						getAjaxData("http://10.128.21.4/search/incidents?on=me&page=" + next_page + "&perPage=100&mygroup_creator=true", "mygroup_creator");
					}
				} else {
					// Созданные мной
					next_page = await getLocalStorageValue('plg_psca_icreator_next_page');
					next_page = (Object.values(next_page).length > 0 ? parseInt(Object.values(next_page)[0]) : 1);
					if (onlyStarted) {
						getAjaxData("http://10.128.21.4/search/incidents?page=1&perPage=100&on=me&icreator=true", "icreator");
					} else {
						getAjaxData("http://10.128.21.4/search/incidents?page=" + next_page + "&perPage=100&on=me&icreator=true", "icreator"); // Созданные мной
					}
				}

				let check_count = await getLocalStorageValue('plg_psca_inc_check_count');
				check_count = (Object.values(check_count).length > 0 ? parseInt(Object.values(check_count)[0]) : 0);
				let db1 = new exDB();
				db1.open(indexeddb, function () {
					/**
					 * Получаем информацию о инциденте
					 */
					//db.incidents.query("number").filter("return item.number=='"+incident.number+"' && item.status==5").execute(function(r){
					db1.incidents.query("number").filter("return item.status!=4 && item.status!=5 && item.status!=6" + (plg_psca_icreate ? " && item.type=='icreator'": "")).execute(function (r) {
						console.log("INCIDENTS", r);
						let count = 0;
						$.each(r, function (key, incident) {
							count++;
							if (count > check_count && count <= check_count + 10) {
								getAjaxDataInc("http://10.128.21.4/search/incidents/", incident);
							} else if (count > check_count + 10 || check_count > r.length) {
								if (check_count > r.length)
									setLocalStorageValue('plg_psca_inc_check_count', 0);
								return false;
							}
						});
						setLocalStorageValue('plg_psca_inc_check_count', count <= 10 ? 0 : check_count + 10);
					});
					// db1.close();
				});
			})();
		}
	}, timeout);
})();