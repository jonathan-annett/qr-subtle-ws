var npms = {
    'express-ws':'express-ws',
    'body-parser':'body-parser',
};
var options = {
    moduleCode   : moduleCode, 
    browserFiles : ["qrcode-val-browser.js","node_modules/subtle-crypto-window/dist/subtle-crypto-window.js"], 
    nodeCode     : nodeJS, 
    browserCode  : browser, 
    npmPackages  : npms,
    getApp       : getApp
};
require("./@")(module,options);

function moduleCode(window){
    console.log("in the module");    
}

function browser(window,awaitPastedData) {
    
    var
    lib=window.cryptoWindow(false),
    ws,
    booting=true;
    
    function connect( ) {
        
            lib.cryptoWindow.generateKeys(true,function(err,keyPairs,publicExported){
            
            ws = new WebSocket("ws://" + location.host + "/");
        
            ws.onopen = function() {
                console.log("socket connected");
                ws.send(JSON.stringify({public:publicExported}));
            };
        
            ws.onmessage = function (evt) {
               var payload = JSON.parse(evt.data);
               
               if (payload.connect) {
                   lib.cryptoWindow.decrypt_obj(payload.connect,function(err,connectObj){
                       console({err,connectObj});
                   });
               } else {
                  console.log({payload});
               }
               
            };
        
            ws.onclose = function() {
                
                if (booting) {
                    console.log("reconnecting");
                    setTimeout(connect,500);
                } else {
                    console.log("socket closed");
                }
        
            };
        });
      
    }
    
    var button_id ="click_here" ,div_id="paste_here";
    awaitPastedData(button_id,div_id,function(data){
        ws.send(JSON.stringify({pastedData:data}));
    });
    

    setTimeout(connect,500);
    
    
}



function getApp (npms) {
    console.log("getApp()");
    var app =  npms.express();  
    var expressWs = npms['express-ws'](app);
    app.use(npms['body-parser'].json());
    return app;
}


function nodeJS(err,child,app,port,url,npmrequire) {

    app.ws("/",onNewWebSocket);
                
    var lib={};
    moduleCode(lib);
    
    var qrcode = require('qrcode-terminal');
    var readline = require('readline');
    
    npmrequire["subtle-crypto-window"](lib,false);
   
    
    function getQrCodeSmall(data) {
        var result;
        qrcode.generate(data, {small: true}, function (qrcode) {
            result=qrcode;
        });
        return "\u001b[3J\u001b[2J\u001b[1JCopy and paste this code\n"+
               "Back into the terminal\n"+
               result+"\n"+
               data;
    }
    
    
    function checkPastedQR(pasted,needed) {
        if (pasted===needed) return true;
        if (pasted.indexOf("\n"+needed+"\n")>=0) return true;
        var result;
        qrcode.generate(needed, {small: true}, function (qrcode) {
            result=qrcode;
        });
        return pasted.indexOf(result)>=0;
    }
    
    var myInterface = readline.createInterface({
       input: process.stdin,
       output: null
    });
    
    function onNewWebSocket(ws) {
        
          console.log("new web socket");
          var code;
          ws.on('message', function(msg) {
              var payload = JSON.parse(msg);
              
              if (payload.pastedData && checkPastedQR(payload.pastedData,code) ) {
              
                 console.log({payload});
                 
              } else {
                  
                  console.log({payload});
                      
                  if (payload.public) {
                      
                      lib.cryptoWindow.generateKeys(true,function(err,keyPairs,publicExported){
                          if (err) {
                              return console.log(err);
                          }
                          lib.cryptoWindow.importPublic (payload.public,true,function(err,publicImported){
                              if (err) {
                                  return console.log(err);
                              }
                              code = Array.from({length:3}).map(function(){return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);}).join('').substr(-24);
                                   
                              lib.cryptoWindow.encrypt_obj({publicKey:publicExported,code:code},function(err,ecryptedCode){
                                 
                                    if (err) {
                                        return console.log(err);
                                    }
                                    console.log(getQrCodeSmall(code)); 
                                    
                                    ws.send(JSON.stringify({connect:Array.from(ecryptedCode)}));
                                  
                              });

                              
                          });
                      
                      
                      });
                      
                      
                  }
                  
              }
            
          });
    
          ws.on('close', function() {
    
          });
    
          ws.on('error', function(err) {
    
          });
          
          
          function clearConsoleAndScrollbackBuffer() { 
              process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");console.clear();
          }
          
          
          var lines=[],validated=false,activated=false;
          
          function onTerminalLine(line) {
              if (validated)  {
                  return ;
              }
              lines.push(line);
              if (checkPastedQR(line,code)||checkPastedQR(lines.join("\n"),code)) {
                 // validated = true;
                  clearConsoleAndScrollbackBuffer();
                  lines=[];
                  
                  //myInterface.removeListener('line', onTerminalLine);
                  setTimeout(function() {
                      clearConsoleAndScrollbackBuffer();
                  
                      console.log("Validated. Now paste that into the browser.");
                      
                  },500);
                  
              } else {
                  lines = lines.slice(-17);
              }
          }
          
          myInterface.addListener('line', onTerminalLine);

    }
    
    
}
