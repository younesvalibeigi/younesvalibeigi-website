#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * initShader   :   Initialize Beeler-Reuter Variables 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Fri 30 Aug 2019 12:34:59 (EDT)
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float;

/*------------------------------------------------------------------------
 * Interface variables 
 *------------------------------------------------------------------------
 */
in vec2 pixPos ;

layout (location = 0 )  out vec4 o_col_0 ;
layout (location = 1 )  out vec4 o_col_1 ;

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    vec4 red = vec4(0.) ;

    o_col_0 = red ;
    o_col_1 = red ;

    return ;
}
