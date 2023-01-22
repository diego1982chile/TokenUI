/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['knockout',         
        'ojs/ojarraydataprovider',     
        "ojs/ojlistdataproviderview",  
        "ojs/ojdataprovider",
        'ojs/ojinputtext',                
        'ojs/ojbufferingdataprovider',        
        'ojs/ojarraytabledatasource',                
        'ojs/ojtable',
        "ojs/ojbutton", 
        "ojs/ojformlayout",
        "ojs/ojselectcombobox"
        ],
 function(ko, ArrayDataProvider, ListDataProviderView, ojdataprovider_1) {
     
    function DashboardViewModel() {
        // Below are a set of the ViewModel methods invoked by the oj-module component.
        // Please reference the oj-module jsDoc for additional information.

        var self = this;
        
        self.filter = ko.observable("");                 
        
        self.editRow = ko.observable();
        
        self.data = ko.observableArray();
        
        self.newUsername = ko.observable();
        
        self.newPassword = ko.observable();
        
        self.roleArray = ko.observableArray();
        
        self.newRoles = ko.observableArray();
        
        self.roles = ko.computed(function () { 
                        
            var roles = [];                        
                        
            $.getJSON(ko.dataFor(document.getElementById('globalBody')).tokenServiceBaseUrl() + "roles").
                then(function (data) {                       
                  
                  data.forEach(role => {
                      r = {};
                      r.label = role.rolename;
                      r.value = role.id;
                      roles.push(r)
                  });                                                      
                  
                  self.roleArray(roles);                         
            });                                                        

            return new ArrayDataProvider(
                roles,
                {idAttribute: 'id'}
            );                

        });

        self.datasource = ko.computed(function () {                        
          
            $.getJSON(ko.dataFor(document.getElementById('globalBody')).tokenServiceBaseUrl() + "users").
                then(function (users) {                                        
                    self.data(users);                                        
            });             
            
            let filterCriterion = null;                        

            if (self.filter() && self.filter() != "") {
                filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                    filterDef: { text: self.filter() }                    
                });
                console.log(filterCriterion);
            }                        
                       
            const arrayDataProvider = new ArrayDataProvider(
                self.data,
                {idAttribute: 'id'}
            ); 
    
            //console.log(self.data());

            return new ListDataProviderView(arrayDataProvider, 
                                            {filterCriterion: filterCriterion},
                                            );
            
            /*
            self.datasource = new BufferingDataProvider(new oj.ArrayDataProvider(
                self.data,
                {idAttribute: 'id'}
            )); 
            */                                          
            
        });             
        
        self.editedData = ko.observable("");
        
        self.beforeRowEditListener = (event) => {
              self.cancelEdit = false;
              const rowContext = event.detail.rowContext;
              //console.log(rowContext.status);
              //console.log(self.data()[rowContext.status.rowIndex]);
              
              //console.log("rowContext.status = " + JSON.stringify(rowContext.status));
              //console.log("self.data() = " + JSON.stringify(self.data()));
              
              self.getById(rowContext.status.rowKey)
              
              self.originalData = Object.assign({}, self.getById(rowContext.status.rowKey));
              self.rowData = Object.assign({}, self.getById(rowContext.status.rowKey));             
              
              //self.newRoles(self.getRolesById(rowContext.status.rowKey));
              
              //self.originalData = Object.assign({}, rowContext.item.data);
              //self.rowData = Object.assign({}, rowContext.item.data);
              
              console.log(self.rowData);
        };
        
        // handle validation of editable components and when edit has been cancelled
        self.beforeRowEditEndListener = (event) => {
            console.log(event);
            self.editedData("");            
            const detail = event.detail; 
            if (!detail.cancelEdit && !self.cancelEdit) {
                if (self.hasValidationErrorInRow(document.getElementById("table"))) {
                    event.preventDefault();
                }
                else {
                    if (self.isRowDataUpdated()) {
                        const key = detail.rowContext.status.rowIndex;
                        self.submitRow(key);
                    }
                }
            }
        };
        
        self.submitRow = (key) => {                                       
                 
            console.log(key);                        
            
            var roles = [];
            
            self.rowData.roles.forEach(r => {
                if(!r.id) {
                    var role = {};
                    role.id = r;
                    role.rolename = r;
                    roles.push(role);
                }                
            }); 
            
            self.rowData.roles = roles;

            $.ajax({                    
              type: "POST",
              url: ko.dataFor(document.getElementById('globalBody')).tokenServiceBaseUrl() + "users/save",                                        
              dataType: "json",      
              data: JSON.stringify(self.rowData),			  		 
              //crossDomain: true,
              contentType : "application/json",                    
              success: function() {                    
                    var msg = "Record has been succesfuly saved";
                    ko.dataFor(document.getElementById('globalBody')).messages([{severity: 'info', summary: 'Succesfuly Saved', detail: msg, autoTimeout: 5000}]);
                    var val = $("#filter").val();
                    $("#filter").val(" ");
                    $("#filter").val(val);
              },
              error: function (request, status, error) {
                    alert(request.responseText);                          
              },                                  
            });
                                                                           
        };
        
        self.isRowDataUpdated = () => {
            const propNames = Object.getOwnPropertyNames(self.rowData);
            for (let i = 0; i < propNames.length; i++) {
                if (self.rowData[propNames[i]] !== self.originalData[propNames[i]]) {
                    return true;
                }
            }
            return false;
        };
        
        // checking for validity of editables inside a row
        // return false if one of them is considered as invalid
        self.hasValidationErrorInRow = (table) => {
            const editables = table.querySelectorAll(".editable");
            for (let i = 0; i < editables.length; i++) {
                const editable = editables.item(i);
                /*
                editable.validate();
                // Table does not currently support editables with async validators
                // so treating editable with 'pending' state as invalid
                if (editable.valid !== "valid") {
                    return true;
                }
                */
            }
            return false;
        };
        
        self.handleUpdate = (event, context) => {
            //console.log(context);
            self.editRow({ rowKey: context.row.id });
        };
        
        self.handleDone = () => {
            self.editRow({ rowKey: null });
        };
        
        self.getItemText = function (itemContext) {
            return itemContext.data.rolename;
        };
        
        self.displayRoles = function (data) {
            var roles = [];
            data.forEach(role => roles.push(role.rolename));            
            return roles.toString();
        };
        
        self.handleCancel = () => {                                                                 
            
            var txt;
            var r = confirm("¿Está seguro que desea eliminar el registro?");
            
            if (r == true) {
                self.deleteRow(self.rowData.id);
            } else {              
                self.cancelEdit = true;
                self.editRow({ rowKey: null });    
            }                        
        };
        
        self.handleValueChanged = () => {
            self.filter(document.getElementById("filter").rawValue);
        };
        
        self.getById = (id) => {                      
            
            var toReturn; 
                 
            $(self.data()).each(function(key,value) {                                 
                
                if(value.id === id) {                    
                    toReturn = value;
                    return false;
                }                
            });
            
            return toReturn;
                                                                           
        };
        
        self.getRolesById = (id) => {                      
            
            var toReturn = []; 
            var roles = [];
            
            $(self.getById(id)).each(function(key, value) {                 
                value.roles.forEach(r => {                                                    
                    roles.push(r.rolename)
                });  
            });                        
                 
            $(self.roleArray()).each(function(key, value) {                                                                
                if(roles.includes(value.value)) {                                        
                    role = {};
                    role.rolename = value.value;
                    role.id = value.value;
                    toReturn.push(role);                    
                }                
            });
    
            return toReturn;
                                                                           
        };
        
        self.deleteRow = (key) => {                                       
                 
            console.log(key);

            $.ajax({                    
              type: "DELETE",
              url: ko.dataFor(document.getElementById('globalBody')).tokenServiceBaseUrl() + "users/delete/" + key,                                        
              //dataType: "json",                    
              //crossDomain: true,
              contentType : "application/json",                    
              success: function() {                                        
                    var msg = "Record has been succesfuly deleted";                    
                    ko.dataFor(document.getElementById('globalBody')).messages([{severity: 'info', summary: 'Succesfuly Deleted', detail: msg, autoTimeout: 5000}]);                    
                    var val = $("#filter").val();
                    $("#filter").val(" ");
                    self.sleep(100).then(() => {   
                        $("#filter").val(val);
                    }); 
              },
              error: function (request, status, error) {                             
              },                                  
            });                                                                           
        };
        
        self.openDialog = function(event, data) {                        
            document.getElementById("dialog1").open();                 
        }  
        
        self.sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        self.createParameter = function (event, data) {
            
            let element1 = document.getElementById("username");            
            
            let element2 = document.getElementById("password");
            
            let element3 = document.getElementById("roles");
            
            element1.validate().then((result1) => {
                
                element2.validate().then((result2) => {
                    
                    element3.validate().then((result3) => {
               
                        if (result1 === "valid" && result2 === "valid" 
                                && result3 === "valid") {

                            var user = {};

                            user.username = self.newUsername();
                            user.password = self.newPassword();                            
                            
                            var roles = [];

                            self.newRoles().forEach(r => {                                
                                var role = {};
                                role.rolename = r;
                                role.id = r;
                                roles.push(role)
                            });        
                            
                            user.roles = roles;                                                        

                            $.ajax({                    
                                type: "POST",
                                url: ko.dataFor(document.getElementById('globalBody')).tokenServiceBaseUrl() + "users/save",                                        
                                dataType: "json",      
                                data: JSON.stringify(user),			  		 
                                //crossDomain: true,
                                contentType : "application/json",                    
                                success: function() {                    
                                    var msg = "Record has been succesfuly saved";
                                    ko.dataFor(document.getElementById('globalBody')).messages([{severity: 'info', summary: 'Succesfuly Saved', detail: msg, autoTimeout: 5000}]);
                                    document.getElementById("dialog1").close();    
                                    var val = $("#filter").val();
                                    $("#filter").val(" ");
                                    $("#filter").val(val);
                                    self.newUsername(null);
                                    self.newPassword(null);
                                    self.newRoles([]);
                                },
                                error: function (request, status, error) {                                                           
                                },                                  
                            });
                        }     
                    });
                });
            });

        }                            
                                                        
    }
    
    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel;
  }
);
