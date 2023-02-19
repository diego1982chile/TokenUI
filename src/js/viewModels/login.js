/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 * @ignore
 */
/*
 * Your incidents ViewModel code goes here
 */
define(["knockout",                  
        "ojs/ojasyncvalidator-regexp",
        "ojs/ojdialog",        
        "ojs/ojarraydataprovider",
        "ojs/ojselectcombobox",        
        "ojs/ojselectsingle",        
        "ojs/ojlabel", 
        "ojs/ojlabelvalue",
        "ojs/ojformlayout",         
        "ojs/ojbutton", 
        "ojs/ojinputtext",         
        "ojs/ojlistitemlayout",
        'ojs/ojknockout-validation'        
    ],
 function(ko, AsyncRegExpValidator, ArrayDataProvider, parameters) {

    function LoginViewModel() {      
                  
        this.connected = () => {                                     
        };
        
        var self = this;
        // Below are a set of the ViewModel methods invoked by the oj-module component.
        // Please reference the oj-module jsDoc for additional information. 
        
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        
        self.baseUrl = rootViewModel.tokenServiceBaseUrl();
        
        self.user = ko.observable();
        
        self.password = ko.observable();   
        
        self.newUser = ko.observable();
        
        self.newPassword = ko.observable();
        
        self.emailPatternValidator = ko.observableArray([
            new AsyncRegExpValidator({
                pattern: "[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*",
                hint: "enter a valid email format",
                messageDetail: "Not a valid email format",
            }),
        ]);
        
        // currentCancelBehaviorOpt tracks the current cancel behavior option.
        self.currentCancelBehaviorOpt = ko.observable("icon");
                
        self.openDialog = function(event, data) {                        
            document.getElementById("dialog1").open();                 
        }                
        
        self.signIn = function (event, data) {
                                 
            let element3 = document.getElementById("user");
            let element4 = document.getElementById("password");
                                            
               
            element3.validate().then((result3) => {

                element4.validate().then((result4) => {

                    if (result3 === "valid" && result4 === "valid") {
                        // submit the form would go here
                        //alert("everything is valid; submit the form");   
                        
                        var user = {};
            
                        user.username = self.user();
                        user.password = self.password();    
                        
                        $.ajax({                    
                            type: "POST",
                            url: self.baseUrl + "auth",                                        
                            dataType: "json",      
                            data: JSON.stringify(user),			  		 
                            //crossDomain: true,
                            contentType : "application/json",                    
                            success: function(jwt) {
                                rootViewModel.userLogin(self.user());                                                                                                   
                                rootViewModel.authorize(user.username, user.password,jwt.token);                                  
                            },
                            error: function (request, status, error) {                                
                                console.log(request);                                                
                            },                                  
                        });                                                       
                    }

                });
            });
                                                
        }
        
        self.submitUser = function (event, data) {
                                 
            let element3 = document.getElementById("newUser");
            let element4 = document.getElementById("newPassword");                        
                                                           
            element3.validate().then((result3) => {

                element4.validate().then((result4) => {

                    if (result3 === "valid" && result4 === "valid") {
                        // submit the form would go here
                        //alert("everything is valid; submit the form");
                        var user = {};
            
                        user.username = self.newUser();
                        user.password = self.newPassword();                        

                        console.log(JSON.stringify(user));

                        $.ajax({                    
                            type: "POST",
                            url: ko.dataFor(document.getElementById('globalBody')).serviceContext + "/users/new",                                        
                            dataType: "json",      
                            data: JSON.stringify(user),			  		 
                            //crossDomain: true,
                            contentType : "application/json",                    
                            success: function() {                    
                                alert("Registro grabado correctamente");
                                document.getElementById("dialog1").close();                 
                            },
                            error: function (request, status, error) {                                
                                alert(error);                          
                            },                                  
                        });
                        
                    }

                });
            });
                                                
        }
        
        this.userValid = ko.observable("invalidHidden");                
      
    }
    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return LoginViewModel;    
 });
