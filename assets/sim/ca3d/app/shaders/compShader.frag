#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * compShader   :   Beeler-Reuter Compute Shader
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 26 Jul 2017 10:36:21 AM EDT
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float;
precision highp int ;

/*------------------------------------------------------------------------
 * Interface variables 
 *------------------------------------------------------------------------
 */
in vec2 pixPos ;

uniform sampler2D   in_txt ; // Cell voltages
uniform sampler2D   in_itxt ; // perturbations
uniform float radius, threshold ;

uniform vec3        domainResolution ;  // res. in x,y, z 
uniform vec3        domainSize ;        // physical size in x,y,z
uniform float       mx , my ;           /* number of sub images in
                                           horizontal and vertical
                                           direction of the data structure
                                        */

uniform sampler2D   crdtTxt ;   /* returns physical coordinate of each
                                   pixel */
uniform sampler2D   phaseTxt ;  /* return 1. with tissue and zero
                                   otherwise */

// Output of the shader ..................................................
layout (location = 0 )  out vec4 out_txt ;

/*========================================================================
 * Texture3D
 *========================================================================
 */
vec4 Texture3D( sampler2D S, vec3 texCoord )
{
    vec4    vColor1, vColor2 ;
    float   x, y ;
    float   wd = mx*my - 1.0 ;

    float zSliceNo  = floor( texCoord.z*mx*my) ;

    x = texCoord.x / mx ;
    y = texCoord.y / my ;

    x += (mod(zSliceNo,mx)/mx) ;
    y += floor((wd-zSliceNo)/ mx )/my ;

    vColor1 = texture( S,  vec2(x,y) ) ;

    zSliceNo = ceil( texCoord.z*mx*my) ;

    x = texCoord.x / mx ;
    y = texCoord.y / my ;

    x += (mod(zSliceNo,mx)/mx) ;
    y += floor((wd-zSliceNo)/ mx )/my ;
    vColor2 = texture( S,  vec2(x,y) ) ;

    return mix(
        vColor2,
        vColor1,
        zSliceNo/(mx*my)-texCoord.z
    ) ;
}

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    vec3 DX = domainSize/domainResolution ;
    float dx  = DX.x ;
    float dy  = DX.y ;
    float dz  = DX.z ;

/*------------------------------------------------------------------------
 * center of pixel and unit vectors
 *------------------------------------------------------------------------
 */
    vec3 cc = texture( crdtTxt, pixPos ).xyz ;
    vec3 ii = vec3(1.,0.,0.)/domainResolution ;
    vec3 jj = vec3(0.,1.,0.)/domainResolution ;
    vec3 kk = vec3(0.,0.,1.)/domainResolution ;

/*------------------------------------------------------------------------
 * reading from textures
 *------------------------------------------------------------------------
 */
    vec4    phasVal = texture( phaseTxt, pixPos ) ;

    vec4 C = texture(in_txt , pixPos ) ;
    float   ifBlock = texture(in_itxt, pixPos).a ; // Younes addeed

    if (phasVal.r <0.9){
        out_txt = C ;
        return ;
    }
    

    // Younes added
    if (ifBlock < 0.5){
        C.r = -1.0;
        out_txt = C;
        return;
    }
    
    vec3    pert = texture(in_itxt, pixPos ).xyz ;
    vec3    cellCoord = cc*domainSize + pert ;

    if(C.r < 0.05){
        float aliveNeighbors = 0.;
        float deadNeighbors = 0.;

        int m = int(round(radius/dx)) ;
        int n = int(round(radius/dy)) ;
        int l = int(round(radius/dz)) ;
        for (int i=-m; i<(m+1) ;i++){
            for (int j=-n; j<(n+1); j++ ){
                for (int k=-l; k<(l+1); k++ ){
                    vec3 currPos =  cc+float(i)*ii+float(j)*jj+float(k)*kk ;
                    bool tissue = (Texture3D(phaseTxt, currPos).r>0.9) ;
                    float reachBlock = Texture3D(in_itxt, currPos).a; // Younes added
                    if (tissue && reachBlock > 0.5){      //* No block
                        float voltage = Texture3D(in_txt,currPos).r ; //texture
                        pert = Texture3D(in_itxt,currPos).xyz ;

                        vec3 compCellCoord= currPos*domainSize + pert ;//physical

                        float distance = length(cellCoord-compCellCoord) ;
                        if(distance<radius){
                            if ( (voltage >0.7) && (voltage<0.99) ){
                                aliveNeighbors+=1.;
                            }else{
                                deadNeighbors+=1.;
                            }
                        }
                    }else{
                        currPos = cc-float(i)*ii-float(j)*jj-float(k)*kk ;  //* mirroring
                        float voltage = Texture3D(in_txt,currPos).r ; //texture
                        pert = Texture3D(in_itxt,currPos).xyz ;

                        vec3 compCellCoord= currPos*domainSize + pert ;//physical

                        float distance = length(cellCoord-compCellCoord) ;
                        if(distance<radius){
                            if ( (voltage >0.7) && (voltage<0.99) ){
                                aliveNeighbors+=1.;
                            }else{
                                deadNeighbors+=1.;
                            }
                        }
                    }
                }
            }
        }

            

        if ((aliveNeighbors/deadNeighbors)>threshold){
            C.r = C.r + 0.95;
        }else{
            C.r = 0.;
        }
    }else{ 
        C.r = C.r - 0.051;
    }

    out_txt = C ;

    return ;
}
