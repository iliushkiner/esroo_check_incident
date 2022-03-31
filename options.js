// JavaScript Document
$(document).ready(function(){

  $('#plg_psca_timeout').val((typeof(window.localStorage.plg_psca_timeout) != "undefined" && window.localStorage.plg_psca_timeout != null && window.localStorage.plg_psca_timeout !="") ? window.localStorage.plg_psca_timeout : '60000');
  let checked = (typeof(window.localStorage.plg_psca_icreate) != "undefined" && window.localStorage.plg_psca_icreate != null && window.localStorage.plg_psca_icreate !="") ? window.localStorage.plg_psca_icreate : 'true';
  if (checked === "true") {
    $('#plg_psca_icreate').attr('checked', true);
  }

  
  $('body').on('change past kayup select', '#plg_psca_timeout', function(){  
    let plg_psca_timeout = $('#plg_psca_timeout').val();  
    window.localStorage.plg_psca_timeout = plg_psca_timeout;
    chrome.storage.local.set({plg_psca_timeout: plg_psca_timeout}, function(){
            console.log(plg_psca_timeout);
    }); 
  });

  $('body').on('click', '#plg_psca_icreate', function(){
    let plg_psca_icreate = $(this)[0].checked;
    window.localStorage.plg_psca_icreate = plg_psca_icreate;
    chrome.storage.local.set({plg_psca_icreate: plg_psca_icreate}, function(){
      console.log(plg_psca_icreate);
    });
  });

});