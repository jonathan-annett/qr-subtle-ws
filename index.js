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
    
    var 
    button_id ="click_here" ,
    div_id="paste_here";
    
    
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
                       if (err) {
                           return console.log(err);
                       }
                       lib.cryptoWindow.importPublic(connectObj.publicKey,true,function(err){
                           if (err) {
                               return console.log(err);
                           }
                           document.getElementById(div_id).innerHTML="Copy the code from the terminal window and paste it in here";
                           
                           awaitPastedData(button_id,div_id,function(data){
                               
                               lib.cryptoWindow.encrypt_obj({pastedData:data,code:connectObj.code},function(err,ecryptedCode){
                                  
                                     if (err) {
                                         return console.log(err);
                                     }

                                     ws.send(JSON.stringify({connect:ecryptedCode}));
                                   
                               });
                               
                           });
                           
                       });

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
        //return "\u001b[3J\u001b[2J\u001b[1J"+
        return       "Copy and paste this code\n"+
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
          var consoleCode,browserCode;
          ws.on('message', function(msg) {
              var payload = JSON.parse(msg);
              
              if (payload.connect){
                  
                  console.log("decrypting:",payload.connect);
                  
                  lib.cryptoWindow.decrypt_obj(payload.connect,function(err,connectObj){
                      if (err) {
                          return console.log(err);
                          
                      }
                      
                      console.log({payload});

                      
                  });
                  
//              } && checkPastedQR(payload.pastedData,consoleCode) ) {
              
               
                 
              } else {
                  
                  console.log({payload});
                      
                  if (payload.public) {
                      
                      lib.cryptoWindow.generateKeys(true,function(err,keyPairs,publicExported){
                          if (err) {
                              return console.log(err);
                          }
                          
                          lib.cryptoWindow.encrypt_obj({publicKey:publicExported,code:browserCode},function(err,encryptedTest){
                             
                                lib.cryptoWindow.decrypt_obj(JSON.parse(JSON.stringify({test:encryptedTest})).test,function(err,testObj){
                                    if (err) {
                                        return console.log(err);
                                        
                                    }
                                    
                                    console.dir({encryptedTest,testObj},{depth:null});
                                    
                                    
                                    lib.cryptoWindow.importPublic (payload.public,true,function(err,publicImported){
                                        if (err) {
                                            return console.log(err);
                                        }
                                        consoleCode = Array.from({length:3}).map(function(){return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);}).join('').substr(-24);
                                        browserCode = Array.from({length:3}).map(function(){return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);}).join('');    
                                        lib.cryptoWindow.encrypt_obj({publicKey:publicExported,code:browserCode},function(err,ecryptedCode){
                                           
                                              if (err) {
                                                  return console.log(err);
                                              }
                                              console.log(getQrCodeSmall(consoleCode)); 
                                              
                                              ws.send(JSON.stringify({connect:ecryptedCode}));
                                            
                                            //console.log(JSON.stringify({connect:ecryptedCode}));
                                            
                                        });
          
                                        
                                    });
              
                                    
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
              if (checkPastedQR(line,consoleCode)||checkPastedQR(lines.join("\n"),consoleCode)) {
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
