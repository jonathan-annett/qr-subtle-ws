function awaitPastedData(button_id,div_id,cb) {
    var 
    handlers=[],
    CB=function(pastedData){handlers.forEach(function(cb){if (typeof cb==='function') cb(pastedData);});},
    div,button;
    
    function handlePaste(e) {
        var clipboardData;
    
        // Stop data actually being pasted into div
        e.stopPropagation();
        e.preventDefault();
    
        // Get pasted data via clipboard API
        clipboardData = e.clipboardData || window.clipboardData;
        CB(clipboardData.getData('Text'));
    }
    
    function buttonClick() {
        navigator.clipboard.readText().then(CB).catch (function(){});
    }
    
    function attach(button_id,div_id,cb)  {
        handlers.splice(0,handlers.length,cb);
        div    = document.getElementById(div_id);
        button = document.getElementById(button_id);
        
        div.contentEditable='true';
        div.addEventListener('paste', handlePaste);
        
        button.addEventListener("click",buttonClick);
    }
    
    attach(button_id,div_id,cb);
    
    return {
        addEventListener : function (e,fn) {
            if (e==="paste") {
                var ix = handlers.indexOf(fn);
                if (ix<0) return !!handlers.push(fn);
                return !!handlers.splice(ix,1,fn);
            }
        },
        removeEventListener : function (e,fn) {
              if (e==="paste") {
                  var ix = handlers.indexOf(fn);
                  if (ix<0) return;
                  return !!handlers.splice(ix,1);
              }
        },
        detach : function () {
            handlers.splice(0,handlers.length);
            button.removeEventListener("click",buttonClick);
            button.addEventListener('paste', handlePaste);
        },
        attach  : attach
    }
        
}