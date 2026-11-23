#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * clickShader  :   shades the click
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Thu 24 Aug 2017 02:34:52 PM EDT
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
#include precision.glsl

/*------------------------------------------------------------------------
 * Interface Variables
 *------------------------------------------------------------------------
 */
in      vec2        pixPos ;

uniform sampler2D   clickCoordinates ;
uniform sampler2D   target ;
uniform float       clickRadius ;
uniform float        clickValue ;
uniform sampler2D   crdtTxt ;
uniform sampler2D   phaseTxt ;
uniform sampler2D   in_itxt;
uniform bool        shiftClick;
uniform bool        clearBlocks;     // Website: removes every block

/*------------------------------------------------------------------------
 * output variables
 *------------------------------------------------------------------------
 */
layout (location=0) out vec4 FragColor ;

layout (location=1) out vec4 out_itxt ;

/*========================================================================
 * main body of the shader
 *========================================================================
 */
void main(){
    vec4    clickCrdt   = texture(clickCoordinates, vec2(0.5,0.5) );
    vec3    pixCrdt     = texture( crdtTxt, pixPos ).rgb ;
    vec4    inColor     = texture( target, pixPos ) ;
    vec4    itxt        = texture( in_itxt, pixPos ) ; // Younes added
    float   phase       = texture(phaseTxt, pixPos ).r ;

    FragColor = inColor ;
    out_itxt  = itxt ;                                   // you will add this too

    /*if ( (phase >0.99 ) &&
        ( length( clickCrdt.xyz- pixCrdt) < clickRadius ) &&
        ( clickCrdt.a >0.5 )){
        FragColor.r = clickValue ;
    }*/

    bool inside = (phase > 0.99) &&
              (length(clickCrdt.xyz - pixCrdt) < clickRadius) &&
              (clickCrdt.a > 0.5);

    if (clearBlocks){
        out_itxt.a = 1.0;
    }else if (shiftClick){
        if (inside){
            out_itxt.a = 0.0;
        }
    }else{
        if (inside){
            FragColor.r = clickValue;
        }
    }
}
