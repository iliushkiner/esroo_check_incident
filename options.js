// JavaScript Document
$(document).ready(function(){

  $('#plg_psca_timeout').val((typeof(window.localStorage.plg_psca_timeout) != "undefined" && window.localStorage.plg_psca_timeout != null && window.localStorage.plg_psca_timeout !="") ? window.localStorage.plg_psca_timeout : '60000');
  
  $('body').on('change past kayup select', '#plg_psca_timeout', function(){  
    let plg_psca_timeout = $('#plg_psca_timeout').val();  
    window.localStorage.plg_psca_timeout = plg_psca_timeout;
    chrome.storage.local.set({plg_psca_timeout: plg_psca_timeout}, function(){
            console.log(plg_psca_timeout);
    }); 
  });

});