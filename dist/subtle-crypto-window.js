
   (function (node) {

   var cryptoWindow =  function (storage,storageKey){
       if (typeof window==='object' && typeof process==='undefined') {
           if (storage!==false) {
               window.keyStorage = window.keyStorage || window[storage||"localStorage"];
           } else {
               window.keyStorage =fakeStorage() ;
           }
           cryptoWindow = function () {return window;};
           cryptoWindow.keyname_public  = !!storageKey ? storageKey+"-public"  : "uploads-public";
           cryptoWindow.keyname_private = !!storageKey ? storageKey+"-private" : "uploads-private";
           return window;
       }
       var 
       
       WebCrypto = require("node-webcrypto-ossl"),
       
       webcrypto = new WebCrypto(storage===false?undefined:{
         directory: storage||"key_storage"
       }),
       subtle = webcrypto.subtle,
       keyStorage = storage ? webcrypto.keyStorage : fakeStorage() ,
       node_window = { crypto : { subtle : subtle }, keyStorage : keyStorage};
       
       cryptoWindow = function () {return node_window;};
       
       return node_window;
   };
   
   function fakeStorage() {
       var tempKeyStorage={};
       return {
           getItem : function(k) {return tempKeyStorage[k];},
           setItem : function(k,v) { return tempKeyStorage[k];},
       };
   }

   cryptoWindow.hardCodedPublic=hardCodedPublic;
   function hardCodedPublic (cb) {
       var win=cryptoWindow(false),subtle=win.crypto.subtle,
       exported = { kty: 'RSA',
                      key_ops: [ 'verify' ],
                      e: 'AQAB',
                      n:
                       '4Hwq4gKZvqNQ-aPwP0i-PKS_QXM3ImXti1OaRud3t7TK7lFQNFmrrlSg055Yz8ITHcUKq8VsAZ8RuVRfzgbjiKKs8lqR0jSOFjsZjuGu4q4ZDv8RDXQqDJxthRgEly9wmrWqhzfrPZErN3W__5wqpDi8UPvrsH_Wwj7O7N4POLM',
                      alg: 'RS1',
                      ext: true };
                      
       subtle.importKey(
           "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
           exported,
           {   //these are the algorithm options
               name: "RSASSA-PKCS1-v1_5",
               hash: {name: "SHA-1"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
           },
           false, //whether the key is extractable (i.e. can be used in exportKey)
           ["verify"] //"verify" for public key import, "sign" for private key imports
       )
       .then(function(publicKey){
           //returns a publicKey (or privateKey if you are importing a private key)
           cb(undefined,publicKey);
       })
       .catch(function(err){
           cb(err);
       });
   }
   
   cryptoWindow.hardCodedVerify=hardCodedVerify;
   function hardCodedVerify (_data,signature,cb) {
       hardCodedPublic (function(err,publicKey){
           if (err) return cb(err);
           var win=cryptoWindow(false),subtle=win.crypto.subtle,keyStorage=win.keyStorage,
           data = typeof _data ==='string'? Buffer.from(_data,"utf-8") : _data;
           subtle.verify(
               {
                   name: "RSASSA-PKCS1-v1_5",
               },
               publicKey, //from generateKey or importKey above
               signature, //ArrayBuffer of the signature
               data //ArrayBuffer of the data
           )
           .then(function(isvalid){
               //returns a boolean on whether the signature is true or not
               cb(undefined,isvalid,data,_data);
           })
           .catch(cb);
       });
   }
   
   cryptoWindow.generateKeys=generateKeys;
   function generateKeys(encdec,cb){
       if (typeof encdec==='function') {
           cb=encdec;
           encdec=false;
       } else {
           encdec=!!encdec;
       }
       var suffix=encdec ? '-crypto':'';
       
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage;
       

       // generating RSA key
       subtle.generateKey(
           encdec ? {
                        name: "RSA-OAEP",
                        modulusLength: 2048, //can be 1024, 2048, or 4096
                        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                        hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
           }: {
           name: "RSASSA-PKCS1-v1_5",
           modulusLength: 1024,
           publicExponent: new Uint8Array([1, 0, 1]),
           hash: {
             name: "SHA-1"
           }
         },
           false,
           encdec ? ["encrypt", "decrypt"] : ["sign", "verify"]
         )
         .then(function(keyPairs){
           /** 
            * saving private RSA key to KeyStorage
            * creates file ./key_storage/prvRSA-1024.json
            */
           keyStorage.setItem(cryptoWindow.keyname_private+suffix, keyPairs.privateKey);
           keyStorage.setItem(cryptoWindow.keyname_public+suffix, keyPairs.publicKey);
           
           subtle.exportKey(
               "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
               keyPairs.publicKey //can be a publicKey or privateKey, as long as extractable was true
           )
           .then(function(keydata){
               //returns the exported key data
               cb(undefined,keyPairs,keydata);
           })
           .catch(cb);
         });
   }
   
   cryptoWindow.getPrivate=getPrivate;
   function getPrivate (encdec,cb){
       if (typeof encdec==='function') {
           cb=encdec;
           encdec=false;
       } else {
           encdec=!!encdec;
       }
       var suffix=encdec ? '-crypto':'';
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage;
       
       cb(keyStorage.getItem(cryptoWindow.keyname_private+suffix));
   }
   
   cryptoWindow.getPublic=getPublic;
   function getPublic (encdec,cb){
       if (typeof encdec==='function') {
           cb=encdec;
           encdec=false;
       } else {
           encdec=!!encdec;
       }
       var suffix=encdec ? '-crypto':'';
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage;
       cb(keyStorage.getItem(cryptoWindow.keyname_public+suffix));
   }
   
   cryptoWindow.importPublic=importPublic;
   function importPublic (keydata,encdec,cb,nosave){
       if (typeof encdec==='function') {
          cb=encdec;
          encdec=false;
       } else {
          encdec=!!encdec;
       }
       var suffix=encdec ? '-crypto':'';
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage;
       
       subtle.importKey(
           "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
           keydata,
           encdec ? 
           {   //these are the algorithm options
               name: "RSA-OAEP",
               hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
           }:
           {   //these are the algorithm options
               name: "RSASSA-PKCS1-v1_5",
               hash: {name: "SHA-1"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
           },
           false, //whether the key is extractable (i.e. can be used in exportKey)
           encdec ?["encrypt"] : ["verify"] 
       )
       .then(function(theKey){
           //returns a publicKey (or privateKey if you are importing a private key)
           if (!nosave) keyStorage.setItem(cryptoWindow.keyname_public+suffix)
           cb(undefined,theKey);
       })
       .catch(cb);
       
       
   }
   
   cryptoWindow.exportPublic=exportPublic;
   function exportPublic (cb) {
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage;
       subtle.exportKey(
           "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
           keyStorage.getItem(cryptoWindow.keyname_public) //can be a publicKey or privateKey, as long as extractable was true
       )
       .then(function(keydata){
           //returns the exported key data
           cb(undefined,keydata);
       })
       .catch(cb);
   }
   
   cryptoWindow.sign=sign;
   function sign(_data,cb) {
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage,
       data = typeof _data ==='string'? Buffer.from(_data,"utf-8") : _data;
       subtle.sign(
           {
               name: "RSASSA-PKCS1-v1_5",
           },
           keyStorage.getItem(cryptoWindow.keyname_private), //from generateKey or importKey above
           data //ArrayBuffer of data you want to sign
       )
       .then(function(signature){
           //returns an ArrayBuffer containing the signature
           cb(undefined,new Uint8Array(signature),data,_data);
       })
       .catch(cb);
   }
   
   cryptoWindow.verify=verify;
   function verify(_data,signature,cb) {
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage,
       data = typeof _data ==='string'? Buffer.from(_data,"utf-8") : _data;
       subtle.verify(
           {
               name: "RSASSA-PKCS1-v1_5",
           },
           keyStorage.getItem(cryptoWindow.keyname_public), //from generateKey or importKey above
           signature, //ArrayBuffer of the signature
           data //ArrayBuffer of the data
       )
       .then(function(isvalid){
           //returns a boolean on whether the signature is true or not
           cb(undefined,isvalid,data,_data);
       })
       .catch(cb);
   }
   
   
   cryptoWindow.encrypt=encrypt;
   function encrypt (_data,cb) {
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage,
       data = typeof _data ==='string'? Buffer.from(_data,"utf-8") : _data;
       subtle.encrypt(
           {
               name: "RSA-OAEP",
               //label: Uint8Array([...]) //optional
           },
           keyStorage.getItem(cryptoWindow.keyname_public+'-crypto'), 
           data //ArrayBuffer of data you want to encrypt
       )
       .then(function(encrypted){
           //returns an ArrayBuffer containing the encrypted data
           cb(undefined,new Uint8Array(encrypted),data,_data);
       })
       .catch(cb);
   }
   
   cryptoWindow.decrypt=decrypt;
   function decrypt (_data,cb) {
       var win=cryptoWindow(),subtle=win.crypto.subtle,keyStorage=win.keyStorage,
       data = typeof _data ==='string'? Buffer.from(_data,"utf-8") : _data;
       subtle.decrypt(
           {
               name: "RSA-OAEP",
               //label: Uint8Array([...]) //optional
           },
           keyStorage.getItem(cryptoWindow.keyname_private+'-crypto'), 
           data //ArrayBuffer of data you want to encrypt
       )
       .then(function(decrypted){
           //returns an ArrayBuffer containing the decrypted data
           cb(undefined,new Uint8Array(decrypted),typeof _data ==='string' ? new TextDecoder("utf-8").decode(decrypted):undefined);
       })
       .catch(cb);
   }
   

   window.cryptoWindow = cryptoWindow;

   //generateKeys(console.log.bind(console,"generateKeys:"));
   //getPrivate (console.log.bind(console,"getPrivate:"));
   //getPublic (console.log.bind(console,"getPublic:"));
   //exportPublic (console.log.bind(console,"exportPublic:"));
   //hardCodedPublic (console.log.bind(console,"hardCodedPublic:"));
   /*
   sign("hello world",function(err,signature,data,orig_data){
       if (err) throw(err);
       hardCodedVerify(orig_data,signature,console.log.bind(console,"hardCodedVerify:"))
   });
   */
   })(typeof process==='object' && typeof module==='object' );

