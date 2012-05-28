'use strict';

/* Jasmine Specs for Layout controllers */ 
describe("layout component", function() {
  var scope,
      element,
      attrs,
      transService,
      transition,
      augmentCtrl,
      injector; 
  beforeEach(inject(function($rootScope, $injector) {
    scope = $rootScope.$new();
    injector = $injector;
    transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
    transition.state.config = jasmine.createSpy("Transition State Config Spy");
    transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
    attrs = {withController: "SomeController"};
    augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
    // document.createElement needed for IE7, for some reason
    element = angular.element(document.createElement("div"));
  }));
  
  describe("LayoutDirectiveCtrl", function() {
    var ctrl;
    beforeEach(function() {
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      ctrl = injector.instantiate(LayoutDirectiveCtrl, locals);
      ctrl.init();
    });
    
    it("should instanciate the LayoutDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should create and configure the transition object", function() {
      expect(transService).toHaveBeenCalledWith(scope, element);
      expect(ctrl.transition).toEqual(transition);
      expect(transition.state.config).toHaveBeenCalledWith("init", {height: 0});
      expect(transition.bind).toHaveBeenCalledWith("height", "css-height" );
    });
    
    it("should set the required css formatting", function() {
      // hack to get IE7 to play nice
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/position: relative/i);
    });
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
      
      it("should add a child scope", function() {
        var block1 = scope.$new(true),
            block2 = scope.$new(true);
        ctrl.addChild(block1);
        expect(scope.children.indexOf(block1)).toEqual(0);
        ctrl.addChild(block2);
        expect(scope.children.indexOf(block2)).toEqual(1);
      });
    
    it("should have a default reflow function which lays out a set of blocks one after another", function() {
       var blocks = [],
           reflow = ctrl.defaultLayout();
       for (var i=0; i < 5; i++) {
         var block = jasmine.createSpyObj("Block Spy "+i, ["calculateWidth", "calculateHeight"]);
         block.calculateWidth.andReturn((i+1)*10);
         block.calculateHeight.andReturn(100);
         blocks.push(block);
       };
       reflow(blocks, scope);
       expect(scope.height).toEqual(100*blocks.length);
       expect(scope.width).toEqual(10*blocks.length);
     });
         
     it("should set the layout function", function() {
        var blks = [],
            newFlow = function(blocks, scope){
              angular.forEach(blocks, function(block, ind){
                block.height = 123;
              });
              scope.abc = 123;
            };
        for (var i=0; i < 3; i++) {
          blks.push(scope.$new(true));
          ctrl.addChild(blks[i]);
        };
        ctrl.layout(newFlow);
        ctrl.layout();
        scope.$digest();
        angular.forEach(blks, function(blk){
          expect(blk.height).toEqual(123)
        })
        expect(scope.abc).toEqual(123);
      });
     it("should only trigger a reflow once despite multiple calls", function() {
       var flowSpy = jasmine.createSpy("Reflow Spy");
       ctrl.layout(flowSpy);
       ctrl.layout();
       ctrl.layout();
       ctrl.layout();
       scope.$digest();
       scope.$digest();
       expect(flowSpy.callCount).toEqual(1);
     });
  });

  describe("BlockDirectiveCtrl", function() {
    var ctrl, reflowSpy;
    beforeEach(function() {
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      ctrl = injector.instantiate(BlockDirectiveCtrl, locals);
      ctrl.init();
    });
  
    it("should instanciate the BlockDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should provide access to the scope through a scope property", function() {
      expect(ctrl.scope).toEqual(scope);
    });
      
    it("should create and configure the transition", function() {
      expect(transService).toHaveBeenCalledWith(scope, element);
      expect(ctrl.transition).toEqual(transition);
      expect(transition.state.config).toHaveBeenCalledWith("init", {height: 0});
      expect(transition.bind).toHaveBeenCalledWith({ height: "css-height",
                                                     y: "css-y", 
                                                     opacity: "css-opacity" });
    });
      
    it("should set the required css formatting", function() {
      // hack to get IE7 to play nice
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/position: absolute/i);
    });
    
    it("should augment the controller", function() {
     expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                               ctrl,
                                               { $scope: scope, 
                                                 $element: element, 
                                                 $attrs: attrs, 
                                                 $trans: transition });
    });
    
    it("should add a child returning an id", function() {
      var child = scope.$new(true),
          id;
      id = ctrl.addChild(child);
      expect(id).toEqual("0");
      expect(scope.children.indexOf(child)).toEqual(0);
      child = scope.$new(true);
      id = ctrl.addChild(child, "testID");
      expect(id).toEqual("testID");
      expect(scope.children.indexOf(child)).toEqual(1);
      expect(scope.childrenByName[id]).toEqual(child);
    });

    it("should add and remove a reflow watcher", function() {
      expect(function(){ctrl.addReflowWatcher()}).toThrow("You can only add a string expression as a reflow watcher");
      spyOn(ctrl, "triggerReflow");
      ctrl.addReflowWatcher("test");
      scope.$digest();
      expect(ctrl.triggerReflow).toHaveBeenCalled();
      scope.$digest();
      scope.test = 123;
      scope.$digest();
      expect(ctrl.triggerReflow.callCount).toEqual(2);
      // remove
      ctrl.removeReflowWatcher("test");
      scope.test = 456;
      scope.$digest();
      expect(ctrl.triggerReflow.callCount).toEqual(2);
    });
    
    it("should have a default layout function", function() {
      var screens = [],
           reflow = ctrl.defaultLayout();
       for (var i=0; i < 5; i++) {
         var screen = jasmine.createSpyObj("screen Spy "+i, ["calculateWidth", "calculateHeight"]);
         screen.calculateWidth.andReturn(100);
         screen.calculateHeight.andReturn((i+1)*10);
         screens.push(screen);
       };
       reflow(screens, scope);
       expect(scope.width).toEqual(100*screens.length);
       expect(scope.height).toEqual(10*screens.length);
    });
    
    it("should initialize setting the init transition state and the height reflow watcher", function() {
      spyOn(ctrl, "addReflowWatcher");
      ctrl.init();
      expect(transition.state).toHaveBeenCalledWith("init");
      expect(ctrl.addReflowWatcher).toHaveBeenCalledWith("calculateHeight()");
      expect(ctrl.addReflowWatcher).toHaveBeenCalledWith("calculateWidth()");
    });
    
    it("should add methods to the scope", function() {
      scope.show();
      expect(transition.state).toHaveBeenCalledWith("show");
      scope.hide();
      expect(transition.state).toHaveBeenCalledWith("hide");
      scope.height = 100;
      scope.width = 200;
      expect(scope.calculateHeight()).toEqual(100);
      expect(scope.calculateWidth()).toEqual(200);
    });
  });
  describe("ScreenDirectiveCtrl", function() {
    var ctrl, _screen, _block, name;
    beforeEach(function() {
      _screen = scope.$new(true);
      _screen.name = name = "testScreenID";
      _screen.height = 300;
      // block = jasmine.createSpyObj("Block Controller Spy", ["showScreen", "screenHeight"]);
      scope._block = _block = scope.$new(true);
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      spyOn(scope, "$new").andReturn(_screen);
      ctrl = injector.instantiate(ScreenDirectiveCtrl, locals);
      ctrl.init();
    });
    
    it("should instanciate the ScreenDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should create and configure the transitions", function() {
      var args;
      expect(transService).toHaveBeenCalledWith(_screen, element);
      expect(ctrl.transition).toEqual(transition);
      expect(transition.bind).toHaveBeenCalledWith({ hidden: "css-hidden" });
      // transition state config
      spyOn(ctrl, "transitionInComplete");
      spyOn(ctrl, "transitionOutComplete");
      args = transition.state.config.argsForCall;
      expect(args[0]).toEqual(["init", {hidden: true}]);
      expect((args[1]).slice(0,2)).toEqual(["show", {hidden: false}]);
      expect((args[2]).slice(0,2)).toEqual(["hide", {hidden: true}]);
      expect(ctrl.transitionInComplete).not.toHaveBeenCalled();
      expect(ctrl.transitionOutComplete).not.toHaveBeenCalled();
      (args[1][2]["onComplete"])();
      expect(ctrl.transitionInComplete).toHaveBeenCalled();
      (args[2][2]["onComplete"])();
      expect(ctrl.transitionOutComplete).toHaveBeenCalled();
    });
    
    it("should set the required css formatting", function() {
      // hack to get test to pass IE7
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/display: block/i);
      expect(html).toMatch(/position: absolute/i);
    });
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
    
    it("should create an isolated scope for the screen api", function() {
      expect(scope.$new).toHaveBeenCalledWith(true);
      expect(scope._screen).toEqual(_screen);
    });
    
    it("should add a show method to the screen api", function() {
      expect(angular.isFunction(scope._screen.show)).toBeTruthy();
      _screen.show();
      expect(_block.currentScreen).toEqual(name)
      _screen.show("someOtherID");
      expect(_block.currentScreen).toEqual("someOtherID");
    });
    
    it("should add a hide method to the screen api", function() {
      expect(angular.isFunction(scope._screen.hide)).toBeTruthy();
      _screen.show();
      expect(_block.currentScreen).toEqual(name)
      _screen.hide();
      expect(_block.currentScreen).toBeNull();
    });
    
    it("should have transition functions which broadcast events", function() {
      spyOn(scope, "$broadcast");
      ctrl.transitionIn();
      expect(transition.state).toHaveBeenCalledWith("show");
      expect(scope.$broadcast).toHaveBeenCalledWith("transitioningIn");
      ctrl.transitionInComplete();
      expect(scope.$broadcast).toHaveBeenCalledWith("transitionedIn");
      ctrl.transitionOut();
      expect(transition.state).toHaveBeenCalledWith("hide");
      expect(scope.$broadcast).toHaveBeenCalledWith("transitioningOut");
      ctrl.transitionOutComplete();
      expect(scope.$broadcast).toHaveBeenCalledWith("transitionedOut");
    });
  });
});
describe("Transition Suites", function() {
  describe("SlideyTransitionSuite", function() {
    
  });
});
