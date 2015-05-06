/** This file contains the common configuration options 
 *  that can be overridden by the serverConfig objects in templates */
var localConfig = {
   geoStoreBase: "http://localhost:8082/geostore/rest/",
   adminUrl: "http://localhost:8082/admin/",
   authenticationMethod: "token",
   sessionLogin: true,
   proxy:"/http_proxy/proxy/?url=",
   defaultLanguage: "en"
};