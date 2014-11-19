/*
This file is part of Ext JS 3.4

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-04-03 15:07:25
*/
Ext.ns('Ext.ux.grid');

/**
 * @class Ext.ux.grid.ImportMetadataPlugin
 * @extends Ext.util.Observable
 * Plugin (ptype = 'importmetadata') that adds an action column
 * to show import metadata from destination / lose metadata tables.
 *
 * @ptype importmetadata
 */
Ext.ux.grid.ImportMetadataPlugin = Ext.extend(Ext.util.Observable, {
    id : 'importmetadata',
    
	metadataTooltip: 'Show Metadata',

    constructor: function(config){
        Ext.apply(this, config);

        this.addEvents({
            
        });

        Ext.ux.grid.ImportMetadataPlugin.superclass.constructor.call(this);
    },

    init : function(grid){
        this.grid = grid;
		this.grid.colModel.config.push(new Ext.grid.ActionColumn({
			id:'9',
			width: 50,
			scope:this,
			handler: this.showMetadata,
            items: [
                {
                    iconCls:'metadata_ic',
					width:25,
					tooltip: this.metadataTooltip,
					getClass: function(v, meta, rec) {
						return 'x-grid-center-icon action_column_btn';
					}
                }
            ]
		}));
		//this.grid.reconfigure(this.grid.store, this.grid.colModel);
    },
	/**
     *    private: method[showMetadata] show the metadata for current import
     *      * grid : the grid
     *      * rowIndex: the index of the row 
     *      * colIndex: the actioncolumn index
     */
    showMetadata: function(grid, rowIndex, colIndex){
        var record =  grid.getStore().getAt(rowIndex);
        var filename = record.get('details').events[0];
		filename = filename.substring(0, filename.length - 4);
        var me = this;
		
		var filter = new OpenLayers.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.EQUAL_TO,
			property : "nome_file",
			value : filename,
		});
        var proxy= new GeoExt.data.ProtocolProxy({ 
            protocol: new OpenLayers.Protocol.WFS({ 
                url: this.wfsURL, 
                featureType: this.metadataFeature, 
                readFormat: new OpenLayers.Format.GeoJSON(),
                featureNS: this.metadataNS, 
                filter: filter, 
                outputFormat: "application/json",
                version: this.wfsVersion
            }) 
        });
		
        var metadataStore= new GeoExt.data.FeatureStore({ 
              id: "metadataStore",
              fields: ["partner","bersaglio","nome_file","data","nr_rec_shape","nr_rec_storage","nr_rec_scartati","nr_rec_scartati_siig","data_imp_storage","data_elab","data_imp_siig","flg_tipo_imp","fk_processo","errors"],
              proxy: proxy , 
              autoLoad: true 
        });
		
		
        var win = new Ext.Window({
                    iconCls:'metadata_ic',
                    title:this.metadataTooltip,
                    width: 700,
                    height: 600, 
                    minWidth:250,
                    minHeight:200,
                    layout:'fit',
                    autoScroll:false,
                    closeAction:'hide',
                    maximizable: true, 
                    modal:true,
                    resizable:true,
                    draggable:true,
                    tbar:[/*{
                        text:this.refreshText,
                        iconCls:'refresh_ic',
                        handler: function(btn){
                            win.refreshLog();
                        } 
                    }*/],
                    items: [{
						xtype:'grid',
						store:metadataStore,
						columns:[
							{header: "Original Records", width: 100, dataIndex: 'nr_rec_shape', sortable: true},
							{header: "Imported Records", width: 100, dataIndex: 'nr_rec_storage', sortable: true},
							{header: "Skipped Records", width: 100, dataIndex: 'nr_rec_scartati', sortable: true},
						]
                    }],
                    listeners: {
                        scope: this,
                        afterrender : function(win){
                            //win.refreshLog();
                             
                        }
                    }
        });
        win.show();
    }

    
});

Ext.preg('importmetadata', Ext.ux.grid.ImportMetadataPlugin);
