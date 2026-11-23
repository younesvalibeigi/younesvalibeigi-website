/* ==========================================================================
   3D cellular automaton of a heart (WebGL2, volume ray casting on the GPU).

   Original program: Abouzar Kaboudian's Abubu framework, with the block
   additions. Changes made for the website:
     - the control panel is placed beside the canvas (not floating)
     - "Double-click does" menu, so blocks can be placed without Shift (phones)
     - "Clear blocks" button
     - mouse-wheel zoom is off by default, so the page can still scroll
     - starts running with one wave, and pauses while off screen
   Edit the numbers in Environment() to change the model.
   ========================================================================== */
define([    'require',
            'SimPage',
            'shader!vertShader.vert',
            'shader!crdtShader.frag',
            'shader!initShader.frag',
            'shader!compShader.frag',
            'shader!clickShader.frag',
            'Abubu/Abubu',
            'image!./structure.png',
            ],
function(   require,
            SimPage,
            vertShader,
            crdtShader,
            initShader,
            compShader,
            clickShader,
            Abubu,
            structure,
            ){
"use strict" ;

var params ;        /* parameters = env         */
var env ;           /* environmental variables  */
var gui ;

/*========================================================================
 * createGui()  : the bar beside the canvas
 *========================================================================
 */
function createGui(){
    env.gui = new Abubu.Gui();
    gui = env.gui.addPanel({ width : 260, autoPlace : false }) ;
    SimPage.mountPanel(gui) ;

    gui.mdlPrmFldr = gui.addFolder( 'Model Parameters' ) ;
    env.gui.addCoefficients( gui.mdlPrmFldr, env, ['radius', 'threshold'],
            [env.comp1, env.comp2], {min:0}) ;

    gui.dispFldr = gui.addFolder('Display');
    gui.dispFldr.add( env, 'colormap', Abubu.getColormapList() )
        .onChange( function(){
            env.vrc.setColormap(env.colormap);
            env.vrc.render() ;
        } ).name('Colormap') ;
    gui.dispFldr.add(env, 'alphaCorrection').name('Alpha Correction').
        min(0.003).max(1.0).onChange(function(){
            env.vrc.setAlphaCorrection( env.alphaCorrection ) ;
        } ) ;
    gui.dispFldr.add(env, 'structural_alpha').min(0).max(1.).step(0.001)
        .onChange(function(){
            env.vrc.structural_alpha = env.structural_alpha ;
        } ) ;
    gui.dispFldr.add(env, 'noSteps').name('Number of Steps').
        min(30).max(200).step(1).onChange(function(){
            env.vrc.setNoSteps(env.noSteps) ;
        } ) ;
    gui.dispFldr.add(env, 'lightShift').step(0.05).onChange(function(){
        env.vrc.setLightShift( env.lightShift) ;
    } ) ;
    gui.dispFldr.add(env, 'skip').min(1).max(300).step(1) ;
    gui.dispFldr.add(env, 'wheelZoom').name('Wheel zoom').onChange(function(){
        env.vrc.controler.lockZoom( !env.wheelZoom ) ;
    } ) ;
    gui.dispFldr.open() ;

    gui.drawFldr = gui.addFolder('Draw') ;
    gui.drawFldr.add(env, 'dblMode', ['Stimulate', 'Place block']).name('double-click does') ;
    gui.drawFldr.add(env, 'clickRadius').min(0.02).max(0.5).step(0.01).name('brush size').onChange(function(){
        env.click.uniforms.clickRadius.value = env.clickRadius ;
    } ) ;
    gui.drawFldr.add(env, 'clearBlocks').name('Clear blocks') ;
    gui.drawFldr.open() ;

    gui.smlPrmFldr = gui.addFolder('Simulation') ;
    gui.smlPrmFldr.add( env, 'time').listen() ;
    gui.smlPrmFldr.add( env, 'initialize').name('Initialize Solution') ;
    gui.smlPrmFldr.add( env, 'solve' ).name('Solve/Pause') ;
    gui.smlPrmFldr.open() ;
}

/*========================================================================
 * Environment : structure that holds all global variables
 *========================================================================
 */
function Environment(){
    this.mx         = 16 ;
    this.my         = 8 ;

    this.domainResolution   = [128,128,this.mx*this.my] ;
    this.width      = this.domainResolution[0]*this.mx ;
    this.height     = this.domainResolution[1]*this.my ;

    this.domainSize = this.domainResolution ;
    this.psize      = 0.5 ;
    this.threshold  = 0.4 ;
    this.radius     = 2. ;

    this.minVlt     = 0.25 ;
    this.maxVlt     = 1.0 ;

    this.dt         = 1.0 ;
    this.time       = 0 ;

    /* Display Parameters       */
    this.colormap    =   'rainbowHotSpring';
    this.dispWidth   =   512 ;
    this.dispHeight  =   512 ;
    this.skip        =   1 ;
    this.timeWindow  =   1000 ;

    this.clickRadius = 0.1 ;
    this.alphaCorrection = 0.19 ;
    this.structural_alpha = 1.0 ;
    this.noSteps    = 120 ;
    this.lightShift = 1.2 ;

    this.dblMode    = 'Stimulate' ;     // what a double-click does: 'Stimulate' or 'Place block'
    this.wheelZoom  = false ;

    this.running    = true ;
    this.visible    = true ;
    this.solve      = function(){
        this.running = !this.running ;
    }
}

/*------------------------------------------------------------------------
 * random table : small random shifts of each cell, and the block flag
 *------------------------------------------------------------------------
 */
function randomTable(w,h){
    var table = new Float32Array( w*h*4) ;
    var idx = 0 ;
    for(var j=0; j<w; j++){
        for(var i=0 ; i <h; i++){
            table[idx++] = env.psize*Abubu.random()-0.5*env.psize ;
            table[idx++] = env.psize*Abubu.random()-0.5*env.psize ;
            table[idx++] = env.psize*Abubu.random()-0.5*env.psize ;
            table[idx++] = 1. ;     // a = 1: tissue is excitable (0 would be a block)
        }
    }
    return table ;
}

/*========================================================================
 * loadWebGL
 *========================================================================
 */
function loadWebGL()
{
    env = new Environment() ;
    params = env ;

    var canvas_1 = document.getElementById("canvas_1") ;
    canvas_1.width = env.dispWidth ;
    canvas_1.height= env.dispHeight ;

    /* full phase-field texture (the heart's shape) */
    env.fphaseTxt = new Abubu.ImageTexture(structure) ;
    env.width = params.fphaseTxt.width ;
    env.height= params.fphaseTxt.height ;

    env.stats = SimPage.noStats ;

/*------------------------------------------------------------------------
 * coordinates
 *------------------------------------------------------------------------
 */
    env.crdtTxt  = new Abubu.FloatRenderTarget( env.width, env.height ) ;
    env.coordinator  = new Abubu.Solver( {
        vertexShader    : vertShader.value ,
        fragmentShader  : crdtShader.value ,
        uniforms : {
            mx : { type : 'f', value : env.mx } ,
            my : { type : 'f', value : env.my } ,
        } ,
        renderTargets : { crdt : { location : 0, target : env.crdtTxt } } ,
    } ) ;
    env.coordinator.render() ;

/*------------------------------------------------------------------------
 * textures of calculation
 *------------------------------------------------------------------------
 */
    env.ftxt  = new Abubu.Float32Texture( env.width, env.height ) ;
    env.stxt  = new Abubu.Float32Texture( env.width, env.height ) ;
    env.itxt  = new Abubu.Float32Texture( env.width, env.height,
            {data:randomTable(env.width, env.height) }) ;
    env.itxts = new Abubu.Float32Texture( env.width, env.height ) ;

/*------------------------------------------------------------------------
 * init
 *------------------------------------------------------------------------
 */
    env.init = new Abubu.Solver({
        fragmentShader : initShader,
        renderTargets: {
            o_col_0 : { location : 0, target : env.ftxt } ,
            o_col_1 : { location : 1, target : env.stxt } ,
        }
    } ) ;
    env.init.render() ;

    env.initialize = function(){
        env.time = 0. ;
        env.init.render() ;
    } ;

/*------------------------------------------------------------------------
 * comp1 and comp2 : two time steps per pass
 *------------------------------------------------------------------------
 */
    env.compUniforms    = function(_inTxt){
        this.in_txt     = { type : 't' , value : _inTxt } ;
        this.in_itxt    = { type : 't' , value : env.itxt } ;
        this.domainResolution = { type : 'v3', value : env.domainResolution } ;
        this.domainSize = { type : 'v3', value : env.domainSize } ;
        this.mx         = { type : 'f' , value : env.mx } ;
        this.my         = { type : 'f' , value : env.my } ;
        this.crdtTxt    = { type : 't' , value : env.crdtTxt } ;
        this.phaseTxt   = { type : 't' , value : env.fphaseTxt } ;
        this.radius     = { type : 'f' , value : env.radius } ;
        this.threshold  = { type : 'f' , value : env.threshold } ;
    } ;
    env.compTargets = function(_outTxt){
        this.out_txt    = { location: 0, target: _outTxt } ;
    } ;

    env.comp1Uniforms   = new env.compUniforms( env.ftxt) ;
    env.comp1Targets    = new env.compTargets(  env.stxt) ;
    env.comp2Uniforms   = new env.compUniforms( env.stxt) ;
    env.comp2Targets    = new env.compTargets(  env.ftxt) ;

    env.comp1 = new Abubu.Solver({
        vertexShader : vertShader.value , fragmentShader : compShader.value ,
        uniforms : env.comp1Uniforms , renderTargets : env.comp1Targets , clear : false ,
    } ) ;
    env.comp2 = new Abubu.Solver({
        vertexShader : vertShader.value , fragmentShader : compShader.value ,
        uniforms : env.comp2Uniforms , renderTargets : env.comp2Targets , clear : false ,
    } ) ;

/*------------------------------------------------------------------------
 * VolumeRayCaster : draws the 3D heart
 *------------------------------------------------------------------------
 */
    env.vrc = new Abubu.VolumeRayCaster({
        target          : env.ftxt ,
        phaseField      : env.fphaseTxt,
        canvas          : canvas_1,
        channel         : 'r' ,
        threshold       : env.minVlt,
        noSteps         : env.noSteps,
        mx              : env.mx,
        my              : env.my ,
        minValue        : env.minVlt ,
        maxValue        : env.maxVlt ,
        pointLights     : [ 3,3,3,  -3,-3,-3,  10,10,10,  -10,-10,10 ],
        lightShift      : env.lightShift ,
        floodLights     : [],
        alphaCorrection : env.alphaCorrection ,
        colorbar        : true ,
        colormap        : env.colormap,
        unit            : ''
    } ) ;
    env.vrc.addMessage( 'Cellular Automata', 0.5, 0.05,
        { font: "italic 11pt Arial", style: "#000000", align : "center" } ) ;
    env.vrc.initForeground() ;
    env.vrc.controler.lockZoom( !env.wheelZoom ) ;

/*------------------------------------------------------------------------
 * click : stimulate, place a block, or clear all blocks
 *------------------------------------------------------------------------
 */
    env.click = new Abubu.Solver({
        vertexShader    :   vertShader.value,
        fragmentShader  :   clickShader.value ,
        uniforms    :{
            clickCoordinates : { type : 't', value : env.vrc.clickCoordinates } ,
            clickRadius : { type : 'f', value : env.clickRadius } ,
            clickValue  : { type : 'f', value : 1. } ,
            crdtTxt     : { type : 't', value : env.crdtTxt } ,
            phaseTxt    : { type : 't', value : env.fphaseTxt } ,
            target      : { type : 't', value : env.ftxt } ,
            in_itxt     : { type : 't', value : env.itxt } ,
            shiftClick  : { type : 'b', value : false } ,
            clearBlocks : { type : 'b', value : false } ,
        } ,
        renderTargets:{
            FragColor : { location : 0, target : env.stxt } ,
            out_itxt  : { location : 1, target : env.itxts } ,
        },
    } ) ;
    env.copyClickValues = new Abubu.Copy( env.stxt,  env.ftxt ) ;
    env.copyClickItxt   = new Abubu.Copy( env.itxts, env.itxt ) ;

    // place a stimulus (block = false) or a block (block = true) where the screen position points
    env.applyClick = function(position, block){
        env.vrc.updateClickPosition(position) ;
        env.click.uniforms.shiftClick.value = block ;
        env.click.render() ;
        env.copyClickValues.render() ;
        env.copyClickItxt.render() ;
    } ;
    env.clearBlocks = function(){
        env.click.uniforms.clearBlocks.value = true ;
        env.click.render() ;
        env.copyClickItxt.render() ;
        env.click.uniforms.clearBlocks.value = false ;
    } ;

/*------------------------------------------------------------------------
 * mouse
 *   drag               rotate (built into the ray caster)
 *   Ctrl/Cmd + move    stimulate along the path
 *   double-click       stimulate (or place a block, see the Draw menu)
 *   Shift + click      place a block
 *------------------------------------------------------------------------
 */
    var stimulate = function(e){ env.applyClick(e.position, false) ; } ;
    env.ctrlClick = new Abubu.CtrlClickListener( canvas_1, stimulate, { mousemove : true } ) ;
    env.cmndClick = new Abubu.CommandClickListener( canvas_1, stimulate, { mousemove : true } ) ;
    env.dbleClick = new Abubu.DoubleClickListener( canvas_1, function(e){
        env.applyClick(e.position, env.dblMode === 'Place block') ;
    } ) ;
    env.shiftClick = new Abubu.ShiftClickListener( canvas_1, function(e){
        env.applyClick(e.position, true) ;
    } ) ;

    // the wheel only zooms when "Wheel zoom" is on; otherwise it scrolls the page as usual
    canvas_1.addEventListener('wheel', function(e){
        if (env.wheelZoom) e.preventDefault() ;
    }, { passive : false } ) ;

/*------------------------------------------------------------------------
 * rendering function
 *------------------------------------------------------------------------
 */
    env.render = function(){
        if (env.visible){
            if (env.running){
                for(var i=0; i<env.skip; i++){
                    env.comp1.render() ;
                    env.comp2.render() ;
                    env.time += env.dt*2.0 ;
                }
            }
            env.vrc.render() ;
        }
        requestAnimationFrame(env.render) ;
    } ;

    createGui() ;
    SimPage.watchVisible(canvas_1, function(v){ env.visible = v ; } ) ;
    SimPage.reportHeight() ;
    env.render() ;

    // one starting wave, so there is something to see
    setTimeout(function(){ env.applyClick([0.42, 0.45], false) ; }, 700 ) ;

    document.env = env;
}

loadWebGL() ;
} ) ;
