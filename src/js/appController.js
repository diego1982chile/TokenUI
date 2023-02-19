/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your application specific code will go here
 */
define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojknockouttemplateutils', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojarraydataprovider',
        'ojs/ojoffcanvas', 'ojs/ojmodule-element', 'ojs/ojknockout', 'ojs/ojarraytabledatasource','ojs/ojmessages', 'ojs/ojdialog', "ojs/ojformlayout", "ojs/ojbutton", "ojs/ojlabelvalue", "ojs/ojlabel"],
  function(ko, Context, moduleUtils, KnockoutTemplateUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, ResponsiveUtils, ResponsiveKnockoutUtils, ArrayDataProvider, OffcanvasUtils) {

     function ControllerViewModel() {

      this.KnockoutTemplateUtils = KnockoutTemplateUtils;

      // Handle announcements sent when pages change, for Accessibility.
      this.manner = ko.observable('polite');
      this.message = ko.observable();
      announcementHandler = (event) => {
          this.message(event.detail.message);
          this.manner(event.detail.manner);
      };

      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);


      // Media queries for repsonsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

      let navData = [
        { path: '', id: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-information-s' }, redirect: 'login' },
        { path: 'login', id: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-information-s' } }, 
        { path: 'users', id: 'users', detail: { label: 'Users', iconClass: 'oj-ux-ico-bar-chart' } },        
        { path: 'roles', id: 'roles', detail: { label: 'Roles', iconClass: 'oj-ux-ico-bar-chart' } }       
      ];

      // Router setup
      this.router = new CoreRouter(navData, {
        urlAdapter: new UrlParamAdapter()
      });
      
      this.router.beforeStateChange.subscribe( (args) => {
        var state = args.state;
        var accept = args.accept;
        // If we don't want to leave, block navigation
        //if (currentViewmodel.isDirty) {
        console.log(args);
        
        if(state && state.path != 'login') {
            console.log(this);            
            if(this.userLoggedIn && this.userLoggedIn() === "N") {
            //if (currentViewmodel.isDirty) {
                accept(Promise.reject('model is dirty'));
                //alert("Unauthorized resource!");
                var rootViewModel = ko.dataFor(document.getElementById('globalBody'));  
                var msg = "Please login to access this resource";
                rootViewModel.messages([{severity: 'warning', summary: 'Unauthorized resource', detail: msg, autoTimeout: 5000}]);
            }                        
        }          
        //}
      }); 
      
      this.router.sync();

      this.moduleAdapter = new ModuleRouterAdapter(this.router);

      this.selection = new KnockoutRouterAdapter(this.router);

      // Setup the navDataProvider with the routes, excluding the first redirected
      // route.
      //this.navDataProvider = new ArrayDataProvider(navData.slice(1), {keyAttributes: "path"});
      
      this.navDataProvider = new oj.ArrayTableDataSource(navData.slice(0,1), {idAttribute: 'id'});

      // Drawer
      // Close offcanvas on medium and larger screens
      this.mdScreen.subscribe(() => {OffcanvasUtils.close(this.drawerParams);});
      this.drawerParams = {
        displayMode: 'push',
        selector: '#navDrawer',
        content: '#pageContent'
      };
      
      // Called by navigation drawer toggle button and after selection of nav drawer item
      this.toggleDrawer = () => {
        this.navDrawerOn = true;
        return OffcanvasUtils.toggle(this.drawerParams);
      }
     

    // Header            
    // Application Name used in Branding Area
    this.appName = ko.observable("TokenProviderUI");
    // User Info used in Global Navigation area
    this.userLogin = ko.observable("Not yet logged in");

    this.userLoggedIn = ko.observable("N");
    
    this.isAdmin = ko.observable(false);

    this.tokenServiceBaseUrl = ko.observable("https://idp.internal.hhack.cl:8181/TokenService/api/");
      
    this.messages = ko.observableArray();
  
    this.messagesDataprovider = new ArrayDataProvider(this.messages);


    this.authorize = (username, password, token) => { 
        
        let jwtData = token.split('.')[1]
        let decodedJwtJsonData = window.atob(jwtData)
        let decodedJwtData = JSON.parse(decodedJwtJsonData)

        this.isAdmin(decodedJwtData.groups.includes("ADMIN"));
                    
        $.ajaxSetup({
            beforeSend: function (xhr) {                
                xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));                
            }
        });
        this.userLoggedIn("Y");
        
        if(this.isAdmin()) {
            this.navDataProvider.reset(navData.slice(2), {idAttribute: 'id'});                                    
        }        
        else {
            this.navDataProvider.reset(navData.slice(2), {idAttribute: 'id'});                                    
        }
        
        this.router.go({path: 'users'});
        
        //$("#navigation").show();

    }    
      
    $(function() {        
        $(document).ajaxError(function( event, request, settings ) {                
            
            var rootViewModel = ko.dataFor(document.getElementById('globalBody'));  
            var msg;
            
            if(request.status === 401) {                  
                rootViewModel.navDataProvider.reset(navData.slice(0,1), {idAttribute: 'id'});
                rootViewModel.router.go({path: 'login'});   
                rootViewModel.userLogin("Not yet logged in");
                rootViewModel.userLoggedIn("N");
                msg = request.statusText;
            }
            if (!request.status) {
                //ERR_CONNECTION_REFUSED hits this one                
                rootViewModel.router.go({path: 'login'});   
                rootViewModel.userLogin("Not yet logged in");
                rootViewModel.userLoggedIn("N");                      
                msg = 'No connection. Verify Network.';
            } else if (request.status == 404) {
                msg = 'Requested page not found. [404]';
            } else if (request.status == 500) {
                msg = 'Internal Server Error [500].';
            }                        
            
            rootViewModel.messages([{severity: 'error', summary: 'General Error', detail: msg, autoTimeout: 5000}]);                     
        });
    });
    
    this.router.beforeStateChange.subscribe( (args) => {
        var state = args.state;
        var accept = args.accept;
        // If we don't want to leave, block navigation
        //if (currentViewmodel.isDirty) {
        console.log(args);
        
        if(state && state.path == 'login') {            
            this.navDataProvider.reset(navData.slice(0,1), {idAttribute: 'id'});            
            this.userLogin("Not yet logged in");
            this.userLoggedIn("N");                     
        }                  
    });  
      
    this.menuItemAction = (event) => {             
          if (event.target.textContent.trim() === "Sign Out") {
              this.userLogin("Not yet logged in");                                                            
              this.isAdmin = ko.observable(false);
              this.navDataProvider.reset(navData.slice(0,1), {idAttribute: 'id'});                                             
              this.router.go({path: 'login'});   
              //$("#navigation").hide();
          }
     }
      

      // Footer
      this.footerLinks = [
        {name: 'About Forevision', linkId: 'aboutOracle', linkTarget:'http://www.oracle.com/us/corporate/index.html#menu-about'},
        { name: "Contact Us", id: "contactUs", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },       
      ];
     }
     // release the application bootstrap busy state
     Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    

     return new ControllerViewModel();
  }
                    
          
);
