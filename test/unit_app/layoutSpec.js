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
  /**
   * LayoutDirectiveCtrl Specs
   * 
   */
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
     it("should have a super object with instance methods", function() {
       expect(ctrl._super.defaultLayout).toEqual(ctrl.defaultLayout);
     });
  });
/**
 * BlockDirectiveCtrl specs
 * 
 */
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
      spyOn(scope, "$watch").andCallThrough();
      ctrl = injector.instantiate(BlockDirectiveCtrl, locals);
      ctrl.init();
    });
  
    it("should instanciate the BlockDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should provide access to its scope", function() {
      expect(ctrl.layoutScope).toEqual(scope);
    });
    
    it("should add reflow watchers for dimensions", function() {
      expect(scope.$watch.argsForCall[0][0]).toEqual("calculateHeight()");
      expect(scope.$watch.argsForCall[1][0]).toEqual("calculateWidth()");
      spyOn(ctrl, "reflow");
      scope.$digest();
      expect(ctrl.reflow).toHaveBeenCalledWith();
      expect(ctrl.reflow.callCount).toBe(2);
      scope.$digest();
      scope.height = 200;
      scope.height = 300;
      scope.$digest();
      expect(ctrl.reflow.callCount).toBe(3);
      scope.height = 200;
      scope.width = 300;
      scope.$digest();
      expect(ctrl.reflow.callCount).toBe(5);
    });
      
    it("should create and configure the transition", function() {
      expect(transService).toHaveBeenCalledWith(scope, element);
      expect(ctrl.transition).toEqual(transition);
      expect(transition.bind).toHaveBeenCalledWith("height", "css-height");
      expect(transition.state.config).toHaveBeenCalledWith("init", {height: 0});
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
      expect(html).toMatch(/overflow(-x)?: hidden/i);
      expect(html).toMatch(/overflow(-y)?: hidden/i);
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
      expect(id).toEqual("child_1");
      expect(scope.children.indexOf(child)).toEqual(0);
      child = scope.$new(true);
      id = ctrl.addChild(child, "testID");
      expect(id).toEqual("testID");
      expect(scope.children.indexOf(child)).toEqual(1);
      expect(scope.childrenByName[id]).toEqual(child);
    });

    it("should add and remove a reflow watcher", function() {
      expect(function(){ctrl.addReflowWatcher()}).toThrow("You can only add a string expression as a reflow watcher");
      scope.$digest();
      spyOn(ctrl, "reflow");
      ctrl.addReflowWatcher("test");
      scope.$digest();
      expect(ctrl.reflow).toHaveBeenCalled();
      scope.$digest();
      scope.test = 123;
      scope.$digest();
      expect(ctrl.reflow.callCount).toEqual(2);
      // remove
      ctrl.removeReflowWatcher("test");
      scope.test = 456;
      scope.$digest();
      expect(ctrl.reflow.callCount).toEqual(2);
    });
    
    it("should have a default layout function", function() {
      var screens = [],
           reflow = ctrl.defaultLayout();
       for (var i=0; i < 5; i++) {
         var screen = jasmine.createSpyObj("screen Spy "+i, ["calculateWidth", "calculateHeight"]);
         screen.calculateWidth.andReturn((i+1)*10);
         screen.calculateHeight.andReturn(100);
         screens.push(screen);
       };
       reflow(screens, scope);
       expect(scope.width).toEqual(50);
       expect(scope.height).toEqual(500);
    });
    
    it("should initialize setting the init transition state and the height reflow watcher", function() {
      expect(transition.state).toHaveBeenCalledWith("init");
    });
    it("should add a calculate width and height function to the scope", function() {
      scope.width = 150;
      scope.height = 200;
      expect(scope.calculateHeight()).toEqual(200);
      expect(scope.calculateWidth()).toEqual(150);
    });
    it("should have a super object with a backup reference to its methods", function() {
      expect(ctrl._super.defaultLayout).toEqual(ctrl.defaultLayout);
    });
  });
  /**
   * ScreenDirectiveCtrl Specs
   * 
   */
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
      scope._screen = _screen;
      ctrl = injector.instantiate(ScreenDirectiveCtrl, locals);
      ctrl.init();
      // // Custom matchers
      // this matcher allows you to pass a function which is called on its matching argument
      this.addMatchers({
          toHaveBeenCalledWithAndTest: toHaveBeenCalledWithAndTest
        });
    });
    
    it("should instanciate the ScreenDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
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
    
    it("should override calculate height and width on the layout scope", function() {
      _screen.height = 123;
      _screen.width = 456;
      expect(_screen.calculateHeight()).toEqual(0);
      expect(_screen.calculateWidth()).toEqual(0);
      spyOn(_screen, "displaying").andReturn(true);
      expect(_screen.calculateHeight()).toEqual(123);
      expect(_screen.calculateWidth()).toEqual(456);
    });
    
    it("should implement a displaying method on the layout scope", function() {
      expect(_screen.displaying()).toBeFalsy();
      _block.currentScreen = name;
      expect(_screen.displaying()).toBeTruthy();
      _block.currentScreen = "somethingElse";
      expect(_screen.displaying()).toBeFalsy();
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
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
  });
  /**
   * OverlayDirectiveCtrl Specs
   * 
   */
  describe("OverlayDirectiveCtrl", function() {
    var ctrl, _overlay, _parent, name;
    beforeEach(function() {
      _overlay = scope.$new(true);
      _overlay.name = name = "testoverlayID";
      scope._parent = _parent = scope.$new(true);
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      spyOn(scope, "$new").andReturn(_overlay);
      ctrl = injector.instantiate(OverlayDirectiveCtrl, locals);
      ctrl.init();
      // // Custom matchers
      this.addMatchers({
          toHaveBeenCalledWithAndTest: toHaveBeenCalledWithAndTest
        });
    });
    it("should instanciate OverlayDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should set the required css formatting", function() {
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/height: 100%/i);
      expect(html).toMatch(/z-index: 100/i);
      expect(html).toMatch(/top: 0px/i);
      expect(html).toMatch(/left: 0px/i);
      expect(html).toMatch(/overflow(-x)?: hidden/i);
      expect(html).toMatch(/overflow(-y)?: hidden/i);
      expect(html).toMatch(/position: absolute/i);
    });
    
    it("should configure the parent scope with a Registry and overlay getter, once", function() {
      var reg = _parent.overlay_register,
          mock = {mock: "scope"};
      expect(_parent.overlay).toEqual(jasmine.any(Function));
      expect(reg.name).toEqual("Overlay Register");
      reg.add("test", mock);
      expect(reg.contains("test")).toBeTruthy();
      expect(reg.get("test")).toEqual(mock);
      reg.clear();
      expect(reg.ids).toEqual([]);
      expect(reg.by_id).toEqual({});
      expect(reg.contains("test")).toBeFalsy();
      _parent.overlay_register.value = "not_clobbered";
      ctrl.init();
      expect(_parent.overlay_register.value).toEqual("not_clobbered");
    });
    
    it("should register it", function() {
      spyOn(_parent.overlay_register, "add");
      ctrl.init();
      expect(_parent.overlay_register.add).toHaveBeenCalledWith(_overlay.name, _overlay);
    });
    
    describe("overlay control", function() {
      var reg;
      beforeEach(function() {
        reg = _parent.overlay_register;
      });
      
      it("should provide access to this overlay scope", function() {
        var mock = {mock: "scope"}
        expect(_parent.overlay()).toEqual(_overlay);
        reg.add("other", mock);
        expect(_parent.overlay("other")).toEqual(mock);
      });
      
      it("should provide access to the current overlay scope by default", function() {
        var mock1 = {mock1: "scope"},
            mock2 = {mock2: "scope"};
        reg.add("test1", mock1);
        reg.add("test2", mock2);
        _parent.currentOverlay = "test2";
        expect(_parent.overlay()).toEqual(mock2);
        _parent.currentOverlay = "test_fail";
        expect(function(){_parent.overlay();}).toThrow("The current overlay value is not a registered overlay name");
      });
      
      it("should throw an error when the overlay name doesnt exist", function() {
        expect(function(){_parent.overlay("FAIL")}).toThrow("Overlay with name'FAIL' not found");
      });
    });
    
    it("should have its layout scope as a property of the contorller instance", function() {
      expect(ctrl.layoutScope).toEqual(_overlay);
    });
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
  });
  /**
   * OverlayPanelDirectiveCtrl Specs
   * 
   */
  describe("OverlayPanelDirectiveCtrl", function() {
    var ctrl, _panel, _overlay;
    beforeEach(function() {
      _overlay = scope.$new(true);
      scope._overlay = _overlay;
      _panel = scope.$new(true);
      spyOn(scope, "$new").andReturn(_panel);
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: {anOverlayPanel: "left"},
        transition: transService
      }
      ctrl = injector.instantiate(OverlayPanelDirectiveCtrl, locals);
    });
    
    it("should instanciate overlay panel directive controller", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should set the required css formatting", function() {
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/position: absolute/i);
      expect(html).toMatch(/display: block/i);
    });
    
    it("should retreive the align value from the attribute", function() {
      expect(_panel.align).toEqual("left");
    });
    
    describe("panel scope resposition", function() {
      beforeEach(function() {
        _panel.width = 100;
        _panel.height = 100;
        _overlay.width = 200;
        _overlay.height = 200;
      });
      
      it("should have a method named reposition", function() {
        expect(angular.isFunction(_panel.reposition)).toBeTruthy();
      });
      
      it("should center the panel", function() {
        _panel.align = "center";
        _panel.reposition();
        expect(_panel.x).toEqual(50);
        expect(_panel.y).toEqual(50);
      });
      
      it("should align left", function() {
        _panel.align = "left";
        _panel.reposition();
        expect(_panel.x).toEqual(0);
        expect(_panel.y).toEqual(50);
      });
      
      it("should align right", function() {
        _panel.align = "right";
         _panel.reposition();
         expect(_panel.x).toEqual(100);
         expect(_panel.y).toEqual(50);        
      });
      
      it("should alignt top", function() {
        _panel.align = "top";
        _panel.reposition();
        expect(_panel.x).toEqual(50);
        expect(_panel.y).toEqual(0);
      });
      
      it("should align bottom", function() {
        _panel.align = "bottom";
        _panel.reposition();
        expect(_panel.x).toEqual(50);
        expect(_panel.y).toEqual(100);
      });
      
      it("should align top left", function() {
        _panel.align = "topleft";
        _panel.reposition();
        expect(_panel.x).toEqual(0);
        expect(_panel.y).toEqual(0);
      });
      
      it("should align top right", function() {
        _panel.align = "topright";
        _panel.reposition();
        expect(_panel.x).toEqual(100);
        expect(_panel.y).toEqual(0);
      });
      
      it("should align bottom left", function() {
        _panel.align = "bottomleft";
        _panel.reposition();
        expect(_panel.x).toEqual(0);
        expect(_panel.y).toEqual(100);
      });
      
      it("should align top right", function() {
        _panel.align = "bottomright";
        _panel.reposition();
        expect(_panel.x).toEqual(100);
        expect(_panel.y).toEqual(100);
      });
    });
  });
});
/**
 * Transition Suites Specs
 * 
 */
describe("Transition Suites", function() {
  /**
   * Slidey Transition Suite Specs
   * 
   */
  describe("SlideyTransitionSuite", function() {
    var suite, registerSpy, MockSuite, trans;
    beforeEach(function() {
      trans = {};
      registerSpy = jasmine.createSpy("Register Spy").andCallFake(function(prop, func){
        trans[prop] = func;
      });
      MockSuite = function () {
        this.register = registerSpy;
        BeSlideyTransitionSuite.apply(this);
      }
    });
    it("should register slidey transition properties", function() {
      suite = new MockSuite();
      expect(registerSpy).toHaveBeenCalledWith("slidey-x",jasmine.any(Function));
      expect(registerSpy).toHaveBeenCalledWith("slidey-y",jasmine.any(Function));
      expect(registerSpy).toHaveBeenCalledWith("slidey-width",jasmine.any(Function));
      expect(registerSpy).toHaveBeenCalledWith("slidey-height",jasmine.any(Function));
      expect(registerSpy).toHaveBeenCalledWith("slidey-opacity",jasmine.any(Function));
      // expect(registerSpy).toHaveBeenCalledWithAndTest("slidey-hidden",function(val){ return angular.isFunction(val)});
    });
    it("should refuse invalid values", function() {
      suite = new MockSuite();
      var allArgs = registerSpy.argsForCall;
      angular.forEach(allArgs, function(args, key){
        args[1](null);
        args[1]({});
        args[1]([]);
        args[1](function(){});
        args[1](undefined);
        args[1](NaN);
        args[1](true);
        args[1](false);
      });
      expect(suite.props).toEqual({});
    });
    it("should add 'px' to bare num values on some transition properties", function() {
      suite = new MockSuite();
      trans["slidey-x"](123);
      trans["slidey-y"](123);
      trans["slidey-width"](123);
      trans["slidey-height"](123);
      expect(suite.props).toEqual({ left : '123px', 
                                    top : '123px', 
                                    width : '123px', 
                                    height : '123px' });
    });
    it("should accept 0 as a value", function() {
      suite = new MockSuite();
      trans["slidey-x"](0);
      trans["slidey-y"](0);
      trans["slidey-width"](0);
      trans["slidey-height"](0);
      expect(suite.props).toEqual({ left : '0px', 
                                    top : '0px', 
                                    width : '0px', 
                                    height : '0px' });
    });
    it("should pass on string values unmolested to some transition properties", function() {
      suite = new MockSuite();
      trans["slidey-x"]("abc");
      trans["slidey-y"]("abc");
      trans["slidey-width"]("abc");
      trans["slidey-height"]("abc");
      expect(suite.props).toEqual({ left : "abc", 
                                    top : "abc", 
                                    width : "abc", 
                                    height : "abc" });
    });
    it("should refuse an invalid number value to opacity", function() {
      suite = new MockSuite();
      trans["slidey-opacity"]("abc");
      expect(suite.props).toEqual({});
      trans["slidey-opacity"]("0.4");
      expect(suite.props).toEqual({opacity : '0.4'});
      trans["slidey-opacity"](0.5);
      expect(suite.props).toEqual({opacity : 0.5});
      trans["slidey-opacity"]("4%");
      expect(suite.props).toEqual({opacity : 0.5});
    });
  });
});

//////////////////
// UTILS 
//////////////////
// Custom Matcher Function
var toHaveBeenCalledWithAndTest = function(){
  var spy = this.actual,
             expected = Array.prototype.slice.call(arguments),
             allArgs = spy.argsForCall,
             args,
             arg,
             match = false;
   for (var i=0; i < allArgs.length; i++) {
     args = allArgs[i];
     if(args.length == expected.length){
       for (var j=0; j < args.length; j++) {
         arg = args[j];
         if(angular.isFunction(expected[j])){
           match = (expected[j])(arg);
         } else {
           match = angular.equals(arg, expected[j]); 
         }
         if(!match) break;
       };
     }
     if(match) break;
   };
  this.message = function(){
            return "expected "+spy.identity+" to have been called with type "+expected+
                   " but it was called with the following: "+allArgs;
          }
  return match;
}