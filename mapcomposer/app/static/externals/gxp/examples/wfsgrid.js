/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the BSD license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

var store, map, grid;
Ext.onReady(function() {
    OpenLayers.ProxyHost = "/proxy/?url=";

    var container = new Ext.Container({
        "id": "gridcontainer",
        "renderTo": "grid"
    });
    var wfsGrid = new gxp.plugins.WFSGrid({
        "wfsURL": "http://demo1.geo-solutions.it/geoserver-enterprise/wfs",
        "featureType": "cities",
        "outputTarget": "gridcontainer",
        "name": "Cities",
        "fields": [
            {
                "name": "country",         
                "mapping": "CNTRYNAME"
            },
            {
                "name": "name",      
                "mapping": "NAME"
            },
            {
                "name": "province",      
                "mapping": "PROVNAME"
            }
        ],
        "columns": [
            {
                "header": "Country",
                "dataIndex": "country"
            },
            {
                "header": "Province",
                "dataIndex": "province"
            },
            {
                "header": "Name",
                "dataIndex": "name"
            }
        ]
    });

    var widget = wfsGrid.addOutput({  
        width: 500,
        height:300
    });
    
    // creates the map that will contain the vector layer with features
    map = new OpenLayers.Map("map");
    map.addLayer(new OpenLayers.Layer.WMS(
        "Global Imagery",
        "http://demo1.geo-solutions.it/geoserver-enterprise/wms",
        {layers: 'GeoSolutions:ne_shaded'}
    ));
    map.setCenter(new OpenLayers.LonLat(-100, 35), 3);
   

});
