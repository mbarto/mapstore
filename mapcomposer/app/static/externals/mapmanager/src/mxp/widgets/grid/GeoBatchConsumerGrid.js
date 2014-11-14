/*
 *  Copyright (C) 2007 - 2014 GeoSolutions S.A.S.
 *  http://www.geo-solutions.it
 *
 *  GPLv3 + Classpath exception
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/** api: (define)
 *  module = mxp.widgets
 *  class = GeoBatchConsumerGrid
 *  
 */
Ext.ns('mxp.widgets');

/**
 * Class: GeoBatchConsumerGrid
 * Grid panel that shows consumers for a particular flow.
 * Allows also to see details and perform actions for a particular consumer.
 * 
 * GeoBatch REST API used
 * * (GET) "/flows" : list of flows 
 * * (GET) "/flows/{flowid}" : details about the flow
 * * (GET) "/flows/{flowId}/consumers" : the consumers for the flow
 * * (GET) "/consumers/{consumerid}/status" : the status of a consumer
 * * (GET) "/consumers/{consumerid}/log" the log of a consumer
 * * (PUT) "/consumers/{consumerid}/pause" pause the consumer 
 * * (PUT) "/consumers/{consumerid}/resume" resume a paused consumer
 * * (PUT) "/consumers/{consumerid}/clean" clean the consumer 
 *
 * Inherits from:
 *  - <Ext.grid.GridPanel>
 *
 */
mxp.widgets.GeoBatchConsumerGrid = Ext.extend(Ext.grid.GridPanel, {

    /** api: xtype = mxp_viewport */
    xtype: "mxp_geobatch_consumer_grid",
    
    /**
	 * Property: flowId
	 * {string} the GeoBatch flow name to manage
	 */	
    flowId: 'ds2ds_zip2pg',
    /**
	 * Property: geoBatchRestURL
	 * {string} the GeoBatch ReST Url
	 */
    geoBatchRestURL: 'http://localhost:8080/geobatch/rest/',
	
	/**
	 * Property: geoStoreRestURL
	 * {string} the GeoStore ReST Url
	 */
    geoStoreRestURL: 'http://localhost:8080/geostore/rest/',
	
	/**
	 * Property: mode
	 * {string} mode of the grid (active or archived)
	 */
    mode: 'active',
	
	 /**
	 * Property: autoRefreshInterval
	 * {integer} the Consumers auto refresh interval (in seconds).
	 */
    autoRefreshInterval: 5,
	
	autoRefreshState: false,
    /**
	 * Property: GWCRestURL
	 * {string} the GWC ReST Url. If present, a button
     * that allows to manage GWC layers to clean tile cache will be present
	 */
    GWCRestURL: null,
    autoload:true,
    /* i18n */
    statusText: 'Status',
    startDateText: 'StartDate',
    fileText:'File',
    actionText:'Action',
    taskText:'Task',
    progressText:'Progress',
    refreshText:'Refresh',
    autoRefreshText:'Auto Refresh',
    descriptionText:'Description',
    tooltipDelete: 'Clear this',
    tooltipLog: 'Check Log',
    autoExpandColumn: 'task',
    clearFinishedText: 'Clear Finished',
    archiveText: 'Archive Selected',
    loadingMessage: 'Loading...',
    cleanMaskMessage:'Removing consumer data...',
    textConfirmDeleteMsg: 'Do you confirm you want to delete event consumer with UUID:{uuid} ? ',
    errorDeleteConsumerText:'There was an error while deleting consumer',
    confirmClearText: 'Do you really want to remove all consumers with SUCCESS or FAIL state?',
    titleConfirmClearMsg: 'Confirm',
    confirmArchiveText: 'Do you want to archive the selected runs?',
    titleConfirmArchiveMsg: 'Confirm',
    GWCButtonLabel: 'Tile Cache',
    /* end of i18n */
    //extjs grid specific config
    autoload: this.flowsgrid ? true : false,
    loadMask:true,
	cls:'geobatch-consumer-grid',
   
    initComponent : function() {
        //FIX FOR IE10 and responseXML TODO: port this as a global fix
         var ie10XmlStore  = Ext.extend(Ext.data.XmlReader, {
            read : function(response){
                        var data = response.responseXML;
                        if(!data || !data.documentElement) {
                            if(window.ActiveXObject) {
                                var doc = new ActiveXObject("Microsoft.XMLDOM");
                                if(doc.loadXML(response.responseText)){
                                    data = doc;
                                }
                            }
                        }
                        return this.readRecords(data);
                    }
        });
		
		this.resourceManager = new GeoStore.Resource({
			authorization: this.auth,
            url: this.geoStoreRestURL + 'resources'
		});
		
        // create the Data Store
        this.store;
		if(this.mode === 'active') {

			this.store = new Ext.data.Store({
				autoLoad: this.autoload,
				// load using HTTP
				url: this.geoBatchRestURL + 'flows/' + this.flowId + '/consumers',
				record: 'consumer',
				idPath: 'uuid',
				fields: [{name: 'status', mapping: '@status'},
					   'uuid',
					   'startDate',
					   'description',
					   'details'],
				reader:  new ie10XmlStore({
					 record: 'consumer',
					idPath: 'uuid',
					fields: [{name: 'status', mapping: '@status'},
					   'uuid',
					   'startDate',
					   'description',
					   {name:'details',convert: function(v) {
							return Ext.decode(v)
					   }}]
				}),
				listeners:{
					beforeload: function(a,b,c){
					   
						if( a.proxy.conn.headers ){
							if(this.auth){
								a.proxy.conn.headers['Authorization'] = this.auth;
							}
							a.proxy.conn.headers['Accept'] = 'application/xml';
						}else{
							a.proxy.conn.headers = {'Accept': 'application/xml'};
							if(this.auth){
								a.proxy.conn.headers['Authorization'] = this.auth;
							}
						}
					   
					}
				},
				sortInfo: {
					field: 'startDate',
					direction: 'DESC' // or 'DESC' (case sensitive for local sorting)
				}
			});
		} else {
			this.store = new MapStore.data.GeoStoreStore({
				autoLoad: true,
				categoryName: "ARCHIVEDRUNS",
				geoStoreBase: this.geoStoreRestURL,
				currentFilter: 'NOTHING',
				auth: this.auth,
				fields: [
					{name: 'status', mapping: '@status'},
					   {name: 'uuid', mapping: 'name'},
					   'startDate',
					   'description',
					   {name:'details',convert: function(v) {
							return {
								events: ['aa'],
								progress:[{task:'t',progress:0}],
								actions: [{name:'act',progress:{task:'t',progress:0}}]
							}
					   }}
				]
			});
		}
    
		var expander = new Ext.ux.grid.RowExpander({
			getRowClass : function(record, rowIndex, p, ds){
				var c = record.get('status');
				var colorClass;
				if (c == 'SUCCESS') {
					colorClass =  'row-green';
				} else if (c == 'RUNNING') {
					colorClass =  'row-yellow';
				}else if (c == 'FAIL'){
					colorClass =  'row-red';
				}
				p.cols = p.cols-1;
				var content = this.bodyContent[record.id];
				if(!content && !this.lazyRender){
					content = this.getBodyContent(record, rowIndex);
				}
				if(content){
					p.body = content;
				}
				return (this.state[record.id] ? 'x-grid3-row-expanded' : 'x-grid3-row-collapsed') + ' ' + colorClass;
			},
			tpl: new Ext.XTemplate(
				'<table width="100%">',
					'<tr><th width="200"><b>Action</b></th><th><b>Task</b></th><th width="172"><b>Progress</b></th></tr>',
					'<tpl for="details.actions">',
						'<tr>',
							'<td>{name}</td>',
							'<tpl for="progress">',
								'<td>{task}</td><td><span class="action-progress">{progress}</span></td>',
							'</tpl>',
						'</tr>',
					'</tpl>',
				'</table>'
			),
			enableCaching: false,
			listeners: {
				expand: function(exp, record, body, rowIndex) {
					var row = exp.grid.view.getRow(rowIndex);
					Ext.each(Ext.DomQuery.select('.action-progress', row), function(progressContainer) {
						var progress = Math.round(parseFloat(progressContainer.innerHTML));
						progressContainer.innerHTML = '';
						(function() {
						 new Ext.ProgressBar({
						  renderTo : progressContainer,
						  text : progress + "%",
						  value : (progress / 100)
						 });
						}).defer(25);
					}, this);
				},
				scope: this
			}
		});
	
		
	
		this.plugins = [expander];
       
		if(this.mode === 'active') {
			this.getSelectionModel().on({
				rowselect: function(selModel) {
					this.archive.setDisabled(selModel.getSelections().length === 0);
				},
				rowdeselect: function(selModel) {
					this.archive.setDisabled(selModel.getSelections().length === 0);
				},
				scope: this
			});
		}
	   
        this.tbar = [{
                iconCls:'refresh_ic',
                xtype:'button',
                text:this.refreshText,
                scope:this,
                handler:function(){
                    this.store.load();
                }
            },{
                iconCls:'auto_refresh_ic',
                xtype:'button',
				hidden: this.mode === 'archived',
                text:this.autoRefreshText,
				enableToggle: true,
                scope:this,
                toggleHandler:function(btn, state){
                    this.autoRefreshState = state;
					if(state) {
						this.autoRefresh();
					}
                }
            },"->",{
                iconCls:'archive_ic',
                xtype:'button',
				ref:'../archive',
				hidden: this.mode === 'archived',
                text:this.archiveText,
				disabled:true,
                scope:this,
                handler:function(){
                    Ext.Msg.confirm(
						this.titleConfirmArchiveMsg,
						this.confirmArchiveText,
						function(btn) {
							if(btn=='yes') {
								var resource = {
									name: this.flowId + '_' + this.getSelectionModel().getSelections()[0].get('uuid'),
									description: 'test',
									category: 'ARCHIVEDRUNS',
									attributes: {}
									
								};
								//if the resource editor has the metod, call it
								
								resource.blob = Ext.encode(this.getSelectionModel().getSelections()[0].data);
								this.resourceManager.create(resource,
									//SUCCESS
									function() {
										Ext.Msg.alert('Success');
									},
									//FAIL
									function() {
										Ext.Msg.alert('Failed');
									}
								);
								
							}
						}, 
						this
					);
                }
        },{
                iconCls:'broom_ic',
                xtype:'button',
                text:this.clearFinishedText,
				hidden: this.mode === 'archived',
                scope:this,
                handler:function(){
                    var me = this;
                     Ext.Msg.confirm(
                    this.titleConfirmClearMsg,
                    this.confirmClearText,
                    function(btn) {
                        if(btn=='yes') {
                            me.clearFinished();
                            
                        }
                    });
                }
        }];
		
		
		
        if(this.GWCRestURL){
            this.bbar =[
            {
                text:this.GWCButtonLabel,
                iconCls:'gwc_ic',
                handler: this.showGWCGridWin,
                scope:this
            }
        ]
        }
        this.columns= [
			expander,
            {id: 'uuid', header: "ID", width: 220, dataIndex: 'uuid', sortable: true},
            {id: 'status', header: this.statusText, width: 100, dataIndex: 'status', sortable: true,hidden: this.mode === 'archived',},
            {id: 'startDate', header: this.startDateText, width: 180, dataIndex: 'startDate', sortable: true},
            {id: 'file', header: this.fileText, dataIndex: 'details',width: 180, 
                renderer: function(val){
                    return val.events[0]
                } 
            },
			{id: 'task', header: this.taskText, dataIndex: 'details',width: 180, 
                renderer: function(val){
                    return val.progress[0].task
                } 
            },
			{id: 'progress', header: this.progressText, dataIndex: 'details',width: 180, 
				renderer : function(val, metaData, record, rowIndex, colIndex, store) {
					var progress = Math.round(val.progress[0].progress);
					var id = Ext.id();
					(function() {
					 new Ext.ProgressBar({
					  renderTo : id,
					  text : progress + "%",
					  value : (progress / 100)
					 });
					}).defer(25);
					return '<span id="' + id + '"></span>';
					
				} 
            },
			/*{id: 'description', header: this.actionText, dataIndex: 'description', 
                renderer: function(val){
                    var progress = Ext.decode(val).progress || [];
					var actions = [];
					for(var i = 0, len = progress.length; i < len; i++) {
						actions.push(progress[i].action);
					}
					return actions.join('<br/>');
                } 
            },
			{id: 'description', header: this.taskText, dataIndex: 'description', 
                renderer: function(val){
                    var progress = Ext.decode(val).progress || [];
					var tasks = [];
					for(var i = 0, len = progress.length; i < len; i++) {
						tasks.push(progress[i].task);
					}
					return tasks.join('<br/>');
                } 
            },
			{id: 'progress', header: this.progressText, dataIndex: 'description', 
                renderer: function(val){
                    var progress = Ext.decode(val).progress || [];
					var percents = [];
					for(var i = 0, len = progress.length; i < len; i++) {
						percents.push(progress[i].progress + '%');
					}
					return percents.join('<br/>');
                } 
            },*/
            //{id: 'description', header: this.descriptionText, dataIndex: 'description', sortable: true},
            {
                    xtype:'actioncolumn',
                    width: 35,
                    items:[{
                        iconCls:'delete_ic',
                        width:25,
                        tooltip: this.tooltipDelete,
                        handler: this.confirmCleanRow,
                        scope:this,
                        getClass: function(v, meta, rec) {
                           if(rec.get('status')=='RUNNING')return 'x-hide-display';
                            return 'x-grid-center-icon action_column_btn';
                          
                        }
                    }]
            },{
                    xtype:'actioncolumn',
                    width: 35,
                    tooltip: this.tooltipLog,
                    handler: this.checkLog,
                    scope: this,
                    items:[ {
                        iconCls:'information_ic',
                        width:25,
                        tooltip: this.tooltipLog,
                        scope:this,
                        getClass: function(v, meta, rec) {
                          
                            return 'x-grid-center-icon action_column_btn';
                          
                        }
                    }]
            }
        ],
        mxp.widgets.GeoBatchConsumerGrid.superclass.initComponent.call(this, arguments);
    },
	
	/**
     *    private: method[autoRefresh] refresh the grid, and if autoRefresh is active, schedule next refresh
     *      
     */
    autoRefresh: function() {
		if(this.autoRefreshState) {
			this.store.on('load', function() {
				this.autoRefresh.createDelegate(this).defer(this.autoRefreshInterval * 1000);
			}, this, {single: true});
		}
		this.store.load();
	},
	
    /**
     *    private: method[confirmCleanRow] show the confirm message to remove a consumer
     *      * grid : the grid
     *      * rowIndex: the index of the row 
     *      * colIndex: the actioncolumn index
     */
    confirmCleanRow: function(grid, rowIndex, colIndex){
         var record =  grid.getStore().getAt(rowIndex);
         var uuid = record.get('uuid');
         var me = this;
         var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:me.loadingMessage});
         var errorCallback = function(response, form, action) {
            Ext.Msg.show({
               msg: this.errorDeleteConsumerText,
               buttons: Ext.Msg.OK,
               icon: Ext.MessageBox.ERROR
            });
            this.store.load();
            loadMask.hide();
        };
        var successCallback = function(response, form, action) {
            this.store.load();
            loadMask.hide();
        };
        Ext.Msg.confirm(
            this.titleConfirmDeleteMsg,
            this.textConfirmDeleteMsg.replace('{uuid}',uuid),
            function(btn) {
                if(btn=='yes') {
                    me.deleteConsumer(uuid,successCallback,errorCallback,me);
                    loadMask.show();
                    
                }
            });
    },
    /**
     *    private: method[checkLog] show the log of a consumer
     *      * grid : the grid
     *      * rowIndex: the index of the row 
     *      * colIndex: the actioncolumn index
     */
    checkLog: function(grid, rowIndex, colIndex){
        var record =  grid.getStore().getAt(rowIndex);
        var uuid = record.get('uuid');
        var me = this;
        var url = this.geoBatchRestURL + "consumers/" + uuid + "/log";
        var win = new Ext.Window({
                    iconCls:'information_ic',
                    title:this.tooltipLog,
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
                    tbar:[{
                        text:this.refreshText,
                        iconCls:'refresh_ic',
                        handler: function(btn){
                            win.refreshLog();
                        } 
                    }],
                    items: [{
                        xtype:'textarea',
                        layout:'fit',
                        cls:'geobatch_log',
                        readOnly:false,
                        ref:'log'
                        }
                    ],
                    listeners: {
                        scope: this,
                        afterrender : function(win){
                            win.refreshLog();
                             
                        }
                    },
                    refreshLog: function(){
                        var loadMask = new Ext.LoadMask(win.getEl(), {msg:me.loadingMessage});
                            
                        Ext.Ajax.request({
                            method: 'GET',
                            url: url,
                            bodyStyle:"font-family: monospace;",
                            headers: {
                                'Authorization' : this.auth
                            },
                            scope: this,
                            success: function(response, form, action) {
                                
                                win.log.setValue(response.responseText);
                                loadMask.hide();
                            },
                            failure: function(response, form, action) {
                                loadMask.hide();
                            }
                        });
                        loadMask.show();
                    }
        });
        win.show();
    },
     /**
     *    private: method[deleteConsumer] deletes a consumer
     *      * uuid : the uuid of the consumer
     *      * successCallback: function to call in case of success 
     *      * errorCallback: function to call in case of error
     *      * scope: the scope of the callbacks (optional)
     */
    deleteConsumer: function(uuid,successCallback,errorCallback,scope){
        
        var url = this.geoBatchRestURL + "consumers/" + uuid + "/clean";
        Ext.Ajax.request({
            method: 'PUT',
            url: url,
            headers: {
                'Authorization' : this.auth
            },
            scope: scope || this,
            success: successCallback,
            failure: errorCallback
        });
        
    },
    /**
     *    private: method[clearFinished] deletes all the consumers with SUCCESS or FAIL status
     */
    clearFinished: function(){
        var me =this;
        var count = 0,error=false;
        var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:me.cleanMaskMessage});
        var finish =function(){
            loadMask.hide();
            if(error){
                Ext.Msg.show({
                   msg: this.errorDeleteConsumerText,
                   buttons: Ext.Msg.OK,
                   icon: Ext.MessageBox.ERROR
                });
            }
            me.store.load();
            
            
        }
        var successCallback = function(){
            count--;
            if(count == 0){
                finish();
            }else{
                loadMask.hide();
            }
        };
        var errorCallback = function(){
            count--;
            error = true;
            if(count == 0){
                finish();
            }
        };
        this.store.each(function(rec){
        //count the records to delete
        var status = rec.get('status')
            if( status =='SUCCESS' || status =='FAIL' ){
                count++;
            }
        });
        if(count == 0) return;
        loadMask.show();
        this.store.each(function(rec){
            var status = rec.get('status')
            if( status =='SUCCESS' || status =='FAIL' ){
                me.deleteConsumer(rec.get('uuid'),successCallback,errorCallback,me);
            }
        });
    },
     /**
     *    private: method[showGWCGridWin] show the GWC manage window
     */
    showGWCGridWin:function(){
            
        var w = new Ext.Window({
                iconCls:'gwc_ic',
                title:this.GWCButtonLabel,
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
            items:{
                xtype:'mxp_gwc_grid',
				GWCRestURL:this.GWCRestURL,
                layout:'fit',
                autoScroll:true,
                auth: this.auth,
                autoWidth:true,
                ref:'gwc'
            } 
        });
        w.show();
    },
    /**
     * public: change flow id and load the new list
     * [flowId] string: the id of the flow
     * 
     */
    changeFlowId: function ( flowId ) {
		if(this.mode === 'archived') {
			this.store.currentFilter = flowId+'_*';
			this.store.proxy.api.read.url = this.store.getSearchUrl();
		} else {
			var url = this.geoBatchRestURL + 'flows/' + flowId + '/consumers';
			this.store.proxy.setUrl(url, true);
		}
		
		this.flowId = flowId;
		this.archive.setDisabled(true);
        this.store.load();
    }
    
});

/** api: xtype = mxp_geobatch_consumer_grid */
Ext.reg(mxp.widgets.GeoBatchConsumerGrid.prototype.xtype, mxp.widgets.GeoBatchConsumerGrid);
