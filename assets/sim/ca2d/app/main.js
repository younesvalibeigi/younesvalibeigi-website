/* ==========================================================================
   2D cellular automaton of cardiac tissue (WebGL2, runs on the GPU).

   Original program: Abouzar Kaboudian's Abubu framework, with the click and
   block additions. Changes made for the website:
     - the control panel is placed beside the canvas (not floating)
     - mouse and touch both work (pointer events)
     - "Draw" menu, so blocks can be placed without the Shift key (phones)
     - "Clear blocks" button
     - starts running with one wave, and pauses while off screen
   Edit the numbers in `env` below to change the model.
   ========================================================================== */
define(['Abubu/Abubu',
        'SimPage',
        'shader!compShader.frag',
        'shader!clickShader.frag',
        'shader!initShader.frag'],
function (Abubu, SimPage, myFragmentShader, clickShader, initShader) {

"use strict" ;

var env = {
    // model parameters ..................................................
    threshold    : 0.25 ,
    radius       : 4. ,
    Lx           : 256 ,
    rOfBlock     : 100. ,

    clickRadius  : 0.1 ,
    psize        : .5 ,

    // domain size .......................................................
    width   : 256 ,   // pixels
    height  : 256 ,
    running : true ,
    visible : true ,
    skip    : 1 ,
    colormap: 'rainbowHotSpring',
    drawMode: 'Stimulate',           // or 'Place block'
    solve   : function(){ env.running = !env.running ; }
} ;
window.env = env ;

/*========================================================================
 * Graphical user interface (the bar beside the canvas)
 *========================================================================
 */
function createGUI(){
    var gui = new Abubu.Gui() ;
    var pnl = gui.addPanel({ width : 260, autoPlace : false }) ;
    SimPage.mountPanel(pnl) ;

    var prm = pnl.addFolder('Model Parameters') ;
    prm.coefs = gui.addCoefficients( prm, env, ['radius','threshold', 'Lx'], [env.compute1, env.compute2] ) ;
    prm.open() ;

    var dsp = pnl.addFolder('Display') ;
    dsp.add(env, 'colormap', Abubu.getColormapList()).onChange(function(){
        env.disp1.colormap = env.colormap ;
    } ) ;
    dsp.add(env, 'skip').min(1).step(1).name('steps per frame') ;
    dsp.open() ;

    var drw = pnl.addFolder('Draw') ;
    drw.add(env, 'drawMode', ['Stimulate', 'Place block']).name('drag does') ;
    drw.add(env, 'clickRadius').min(0.01).max(0.4).step(0.01).name('brush size').onChange(function(){
        env.clickSol.uniforms.clickRadius.value = env.clickRadius ;
    } ) ;
    drw.add(env, 'clearBlocks').name('Clear blocks') ;
    drw.open() ;

    pnl.add(env, 'initialize').name('Initialize') ;
    pnl.add(env, 'solve').name('Solve/Pause') ;
}

/*========================================================================
 * Main function
 *========================================================================
 */
function loadWebGL(){
    env.stats = SimPage.noStats ;

/*------------------------------------------------------------------------
 * random table : [x shift, y shift, block flag (1 = tissue), unused]
 *------------------------------------------------------------------------
 */
    function randomTable(w,h){
        var table = new Float32Array( w*h*4) ;
        var idx = 0 ;
        for(var j=0; j<w; j++){
            for(var i=0 ; i <h; i++){
                table[idx++] = env.psize*Abubu.random()-0.5*env.psize ;
                table[idx++] = env.psize*Abubu.random()-0.5*env.psize ;
                table[idx++] = 1. ;
                table[idx++] = 0. ;
            }
        }
        return table ;
    }

    env.canvas_1 = document.getElementById('canvas_1') ;

/*------------------------------------------------------------------------
 * textures
 *------------------------------------------------------------------------
 */
    var table = randomTable(env.width, env.height) ;
    env.itxt  = new Abubu.Float32Texture(env.width,env.height,{data:table}) ;
    env.itxts = new Abubu.Float32Texture(env.width,env.height) ;
    env.ftxt  = new Abubu.Float32RTexture(env.width,env.height) ;
    env.stxt  = new Abubu.Float32RTexture(env.width,env.height) ;

/*------------------------------------------------------------------------
 * initialization
 *------------------------------------------------------------------------
 */
    env.initSol = new Abubu.Solver({
        fragmentShader : initShader,
        renderTargets: {
            o_col_0 : { location : 0, target : env.ftxt } ,
            o_col_1 : { location : 1, target : env.stxt } ,
        }
    } ) ;
    env.initSol.render() ;

    env.initialize = function(){
        env.initSol.render() ;
        env.time = 0. ;
    } ;

/*------------------------------------------------------------------------
 * click : stimulate, place a block, or clear all blocks
 *------------------------------------------------------------------------
 */
    env.clickSol = new Abubu.Solver({
        fragmentShader: clickShader ,
        uniforms : {
            in_txt  : { type : 't', value : env.ftxt } ,
            in_itxt : { type : 't', value : env.itxt } ,
            clickPosition      : { type : 'v2', value : [0,0] } ,
            clickShiftPosition : { type : 'v2', value : [0,0] } ,
            clickRadius : { type : 'f', value : env.clickRadius } ,
            shiftClick  : { type : 'b', value : false } ,
            clearBlocks : { type : 'b', value : false } ,
        } ,
        renderTargets: {
            out_txt  : { location : 0, target : env.stxt } ,
            out_itxt : { location : 1, target : env.itxts }
        }
    } ) ;
    env.copy  = new Abubu.Copy( env.stxt,  env.ftxt ) ;
    env.copy2 = new Abubu.Copy( env.itxts, env.itxt ) ;
    env.clicker = function(){
        env.clickSol.render() ;
        env.copy.render() ;
        env.copy2.render() ;
    } ;
    env.clearBlocks = function(){
        env.clickSol.uniforms.clearBlocks.value = true ;
        env.clicker() ;
        env.clickSol.uniforms.clearBlocks.value = false ;
    } ;

    // Mouse, touch and pen through pointer events. Dragging stimulates (or places
    // a block, depending on the Draw menu). Holding Shift does the other one.
    var dragging = false ;
    function act(e){
        var r  = env.canvas_1.getBoundingClientRect() ;
        var uv = [ (e.clientX - r.left)/r.width, 1. - (e.clientY - r.top)/r.height ] ;
        var block = (env.drawMode === 'Place block') !== e.shiftKey ;
        var u = env.clickSol.uniforms ;
        if (block){
            u.clickShiftPosition.value = uv ;
            u.shiftClick.value = true ;
        }else{
            u.clickPosition.value = uv ;
            u.shiftClick.value = false ;
        }
        env.clicker() ;
    }
    env.canvas_1.addEventListener('pointerdown', function(e){
        dragging = true ;
        try { env.canvas_1.setPointerCapture(e.pointerId) ; } catch(err){}
        act(e) ;
    } ) ;
    env.canvas_1.addEventListener('pointermove', function(e){ if (dragging) act(e) ; } ) ;
    ['pointerup', 'pointercancel'].forEach(function(n){
        env.canvas_1.addEventListener(n, function(){ dragging = false ; } ) ;
    } ) ;

/*------------------------------------------------------------------------
 * compute solvers : two steps per pass, ping-ponging between textures
 *------------------------------------------------------------------------
 */
    var ComputeUniforms = function(_inTxt){
        this.in_txt     = { type : 's', value : _inTxt } ;
        this.in_itxt    = { type : 's', value : env.itxt } ;
        this.radius     = { type : 'f', value : env.radius } ;
        this.threshold  = { type : 'f', value : env.threshold } ;
        this.Lx         = { type : 'f', value : env.Lx } ;
        return this ;
    } ;
    env.compute1 = new Abubu.Solver({
        fragmentShader : myFragmentShader,
        uniforms : new ComputeUniforms( env.ftxt ) ,
        renderTargets : { out_txt : { location : 0, target : env.stxt } }
    } ) ;
    env.compute2 = new Abubu.Solver({
        fragmentShader : myFragmentShader,
        uniforms : new ComputeUniforms( env.stxt ) ,
        renderTargets : { out_txt : { location : 0, target : env.ftxt } }
    } ) ;
    env.step = function(){
        env.compute1.render() ;
        env.compute2.render() ;
    } ;

/*------------------------------------------------------------------------
 * display
 *------------------------------------------------------------------------
 */
    env.disp1 = new Abubu.Plot2D({
        target : env.ftxt ,
        channel : 'r' ,
        minValue : 0. ,
        enableMinColor : true ,     // below the minimum, show a fixed color ...
        minColor : [1,1,1],         // ... white
        maxValue : 1.,
        colormap : env.colormap,
        canvas : env.canvas_1,
    } ) ;
    env.disp1.init() ;

    env.render = function(){
        if (env.visible){
            if (env.running){
                for(var i=0 ; i<env.skip ; i++){ env.step() ; }
            }
            env.disp1.render() ;
        }
        requestAnimationFrame(env.render) ;
    } ;

    createGUI() ;
    SimPage.watchVisible(env.canvas_1, function(v){ env.visible = v ; } ) ;
    SimPage.reportHeight() ;

    // one starting wave from the left edge, so there is something to see
    env.clickSol.uniforms.clickPosition.value = [0.06, 0.5] ;
    env.clickSol.uniforms.clickRadius.value   = 0.07 ;
    env.clicker() ;
    env.clickSol.uniforms.clickRadius.value   = env.clickRadius ;

    env.render() ;
}

loadWebGL() ;
}) ;
