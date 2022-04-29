// JavaScript Document
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

function getQuota(db) {
	db.getUsageAndQuota(function (r) {
		console.log("used", r.usage);
		console.log("quota", r.quota);
		//db.close(function(){console.log("closed");});
	});
}

$(document).ready(function () {
	let body = $('body');
	var db = new exDB();
	db.open(indexeddb, function () {
		getQuota(db);
	});

	function getInc(incidents) {
		let htm = '';
		let count = 0;
		$.each(incidents, function (key, incident) {
			if ((!incident.visited || $('#show_all')[0].checked)) {
				if ((incident.status === parseInt($('#status_inc').val()) || $('#status_inc').val() === '-1') &&
					(incident.type === $('#type_inc').val() || $('#type_inc').val() === 'all')) {
					count++;
					let inc_date = new Date(incident.date * 1000);
					// inc_date.setDate(incident.date);
					// inc_date = Date();
					// inc_date =inc_date.setDate(inc_date);
					let str_inc_date = "" + ((inc_date.getDate()) < 10 ? '0' : '') + inc_date.getDate() + '.' + ((inc_date.getMonth() + 1) < 10 ? '0' : '') + (inc_date.getMonth() + 1) + '.' + inc_date.getFullYear() + '  | ' + inc_date.getHours() + ':' + inc_date.getMinutes() + ':' + inc_date.getSeconds();
					htm += '<div class="row" id="incidentnum-' + incident.number + '">';
					htm += '<input type="checkbox" style="position: absolute; float: left; z-index: 9999;" data-inc="' + incident.number + '" name="inc_checkbox_' + incident.number + '">';
					htm += '<div class="col-xs-10"><div class="col-xs-10"><a target="_blank" href="http://10.128.21.4/app/incidents/' + incident.number + '" class="link_open_esroo" data-inc=\'' + incident.number + '\'>' + incident.number + ' от ' + str_inc_date + '</a>&nbsp;&nbsp;&nbsp;<input type="button" class="open_esroo" data-inc="' + incident.number + '" value="&#8634;"></div>';
					let status = '';
					switch (incident.status) {
						case 0:
							status = 'Новый';
							break;
						case 1:
							status = 'Назначен';
							break;
						case 2:
							status = 'Выполняется';
							break;
						case 3:
							status = 'Ожидание';
							break;
						case 4:
							status = 'Решен';
							break;
						case 5:
							status = 'Закрыт';
							break;
						case 6:
							status = 'Отменен';
							break;
						default:
							status = 'Неизвестный статус'
					}
					htm += '<div class="col-xs-2">' + status + '</div>';
					htm += '<div class="col-xs-12 desc">' + incident.title + '</div></div>';
					htm += '<div class="col-xs-2"><input id="inc_input_' + incident.number + '" class="visited" data-incident=\'' + JSON.stringify(incident) + '\' type="button" value="' + (!incident.visited ? 'отметить' : 'включить') + '"></div>';
					htm += '</div>';
				}
			}

		});
		$('#row_count').html("Всего показано: " + count + " записей из " + incidents.length);
		$('#incidents_num').html(htm);
	}

	function load() {
		//Suspended_Nums = (typeof(window.localStorage.suspended_nums) != "undefined" ? JSON.parse(window.localStorage.suspended_nums) : Suspended_Nums);

		let db = new exDB();
		db.open(indexeddb, function () {
			/*db.table("people").query("answer").all().desc().execute(function(r){
				console.log("all",r);
			});*/
			$('#row_count').html("Всего показано: нет записей вовсе. <img src='loading.gif' alt='loading' class='loading'>");
			if ($('#find_inc').val() !== "") {
				db.incidents.query("number").bound($('#find_inc').val(), $('#find_inc').val() + '\uffff').desc().execute(function (r) {
					console.log("Инциденты: ", r);
					$('#row_count').html("Всего показано: 0 записей из " + r.length);
					getInc(r);
				});
			} else db.incidents.query("number").all().desc().execute(function (r) {
				$('#row_count').html("Всего показано: 0 записей из " + r.length);
				getInc(r);
			});
		});
	}

	load();

	function refreshStatus() {
		let db = new exDB();
		db.open(indexeddb, function () {
			/*db.table("people").query("answer").all().desc().execute(function(r){
				console.log("all",r);
			});*/
			// db.incidents.query("number").all().desc().execute(function(r){
			db.incidents.query("number").filter("return item.visited==false").execute(function (r) {
				console.log("Incidents: ", r);
				if (r.length > 0) {
					chrome.runtime.sendMessage({action: 'RefreshIcon', icon: 'attention'});
				} else {
					chrome.runtime.sendMessage({action: 'RefreshIcon', icon: 'normal'});
				}
			});
		});
	}

	$('body').on('click', '.visited', function () {
		let incident = $(this).data('incident');
		//incident = JSON.parse(incident);
		incident.visited = !incident.visited;

		let db = new exDB();
		db.open(indexeddb, function () {
			db.table("incidents").update(incident, function (r) {
				console.log("Изменеие записи в IndexedDB", r);
			});
		});

		if (incident.visited && !$('#show_all')[0].checked) {
			$('#incidentnum-' + incident.number).remove();
		}
		$('#incidentnum-' + incident.number + ' .visited').val(incident.visited ? 'включить' : 'отметить');
		//chrome.runtime.sendMessage({action: 'RefreshIcon'});
		refreshStatus()
	});

	$('#refresh').on('click', function () {
		load();
	});

	$('#show_all').on('click', function () {
		load();
	});
	body.on('click', '#check_all', function () {
		body.find('input[name^="inc_checkbox_"]:not(:disabled)').prop('checked', $(this).is(':checked'));
	});
	$('#find_inc').on('keyup', function () {
		load();
	});
	body.on('click', '#visited_all', function () {
		// console.log('Исправить выделенные.')
		let checkboxes = body.find('input[name^="inc_checkbox_"]');
		let change = false;
		$.each(checkboxes, function (key, checkbox) {
			if ($(checkbox).is(':checked')) {
				let inc = $(checkbox).data('inc');
				console.log('Проставляем отметку #inc_input_' + inc);
				// body.find('#input_' + index).trigger('click');
				let input = body.find('#inc_input_' + inc)
				let incident = $(input).data('incident');
				//incident = JSON.parse(incident);
				incident.visited = !incident.visited;

				let db = new exDB();
				db.open(indexeddb, function () {
					db.table("incidents").update(incident, function (r) {
						console.log("Изменеие записи в IndexedDB", r);
					});
				});

				if (incident.visited && !$('#show_all')[0].checked) {
					$('#incidentnum-' + incident.number).remove();
				}
				$('#incidentnum-' + incident.number + ' .visited').val(incident.visited ? 'включить' : 'отметить');
				change = true;
			}
		});
		if (change) {
			alert('Отметка проставлена.');
			refreshStatus();
			// location.reload();
		}
	});

	body.on('click', '.open_esroo', function () {
		let incident = $(this).data('inc');
		chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
			var activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, {inc: incident}/*, function (response) {
				console.log(response);
			}*/);
		});
	});

	/*body.on('dblclick', '.link_open_esroo', function () {
		let incident = $(this).data('inc');
		chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
			var activeTab = tabs[0];
			chrome.runtime.sendMessage(activeTab.id, {inc: incident}, function (response) {
				console.log(response);
			});
		});
	});*/
});