<template>
    <v-card v-if="assay && originalPeptideTrust">
        <v-card-title>
            {{ assay.getName() }}
        </v-card-title>
        <v-card-subtitle class="pb-0">
            Analysis summary
        </v-card-subtitle>
        <v-card-text>
            <v-container fluid class="pt-0">
                <v-row>
                    <v-col class="d-flex flex-column" sm="12" lg="6">
                        <div class="d-flex flex-row flex-grow-1 align-center">
                            <div>
                                <!-- eslint-disable-next-line -->
                                <svg width="175px" height="175px" viewBox="0 0 96 79" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;"><g><path d="M18.509,36.7c-0.869,0 -1.687,-0.328 -2.314,-0.952c-0.609,-0.613 -0.957,-1.43 -0.957,-2.315c0,-0.854 0.348,-1.706 0.957,-2.313c1.216,-1.218 3.407,-1.218 4.625,0.015c0.61,0.592 0.958,1.444 0.958,2.298c0,0.886 -0.33,1.702 -0.958,2.315c-0.608,0.624 -1.441,0.952 -2.311,0.952Z" style="fill-rule:nonzero;stroke:rgba(0,0,0,0.7);stroke-width:0.3px;"/><path d="M57.744,47.243c-1.567,-0.906 -2.122,-2.905 -1.235,-4.471l0.017,0c0.21,-0.363 0.47,-0.679 0.801,-0.938c-0.331,-0.104 -0.628,-0.262 -0.906,-0.487l-0.017,0c-0.956,-0.73 -1.391,-1.897 -1.252,-3.011c-0.729,1.029 -2.018,1.566 -3.338,1.286c-1.428,-0.295 -2.453,-1.511 -2.574,-2.902c-0.489,1.358 -1.845,2.262 -3.357,2.123c-1.756,-0.139 -3.061,-1.651 -2.975,-3.39c-0.382,0.296 -0.815,0.501 -1.321,0.623c-1.756,0.384 -3.511,-0.729 -3.895,-2.503c-0.382,-1.758 0.731,-3.497 2.487,-3.897l0.034,0c-1.322,-0.347 -2.332,-1.495 -2.453,-2.922c-0.085,-1.199 0.488,-2.296 1.409,-2.938c-1.147,0.086 -2.293,-0.417 -2.97,-1.426c-0.731,-1.097 -0.731,-2.469 -0.09,-3.514c-0.99,0.576 -2.242,0.626 -3.304,0.019c-0.085,-0.072 -0.19,-0.124 -0.277,-0.194c-0.07,0.366 -0.209,0.734 -0.417,1.081c-0.73,1.27 -2.192,1.844 -3.548,1.528c1.165,0.907 1.6,2.541 0.956,3.951c-0.697,1.492 -2.387,2.222 -3.915,1.754c1.234,1.115 1.443,3.026 0.416,4.383c-1.094,1.443 -3.147,1.74 -4.59,0.662c-1.443,-1.096 -1.723,-3.148 -0.643,-4.593c0.849,-1.13 2.293,-1.548 3.564,-1.165c-1.026,-0.939 -1.39,-2.453 -0.765,-3.79c0.659,-1.427 2.226,-2.157 3.703,-1.811c-1.286,-0.993 -1.65,-2.816 -0.799,-4.244c0.903,-1.548 2.922,-2.067 4.468,-1.147c0.086,0.051 0.176,0.105 0.263,0.156c0.068,-0.346 0.19,-0.713 0.381,-1.042c0.902,-1.567 2.905,-2.106 4.471,-1.199c1.564,0.903 2.104,2.903 1.197,4.469c-0.015,0.018 -0.015,0.035 -0.032,0.052c1.478,-0.87 3.408,-0.452 4.381,0.991c0.992,1.478 0.609,3.496 -0.852,4.505l0.019,0c1.792,-0.14 3.375,1.215 3.494,3.026c0.14,1.652 -1.008,3.111 -2.591,3.441c1.167,0.295 2.122,1.22 2.383,2.47c0.069,0.278 0.089,0.557 0.089,0.835c0.625,-0.486 1.423,-0.764 2.293,-0.676c1.601,0.14 2.835,1.406 2.974,2.954c0.557,-1.493 2.141,-2.418 3.757,-2.068c1.669,0.365 2.782,1.948 2.557,3.617c0.02,-0.019 0.037,-0.051 0.052,-0.068c1.097,-1.444 3.149,-1.723 4.592,-0.629c1.426,1.098 1.705,3.15 0.608,4.592c-0.155,0.209 -0.347,0.402 -0.557,0.575c0.175,0.052 0.366,0.139 0.541,0.244c1.562,0.886 2.119,2.889 1.216,4.452c-0.592,1.061 -1.705,1.653 -2.836,1.653c-0.552,0.001 -1.11,-0.122 -1.614,-0.417Z" style="fill-rule:nonzero;stroke:#000;stroke-width:0.3px;"/><path d="M54.977,52.408c-0.87,0 -1.704,-0.351 -2.312,-0.958c-0.608,-0.623 -0.955,-1.444 -0.955,-2.313c0,-0.868 0.347,-1.705 0.955,-2.314c1.2,-1.215 3.409,-1.23 4.625,0c0.61,0.609 0.959,1.446 0.959,2.314c0,0.869 -0.331,1.69 -0.959,2.313c-0.608,0.607 -1.443,0.958 -2.313,0.958Z" style="fill-rule:nonzero;stroke:#000;stroke-width:0.3px;"/></g><path d="M79.936,62.388c-0.749,-1.651 -0.018,-3.581 1.635,-4.327c0.73,-0.331 1.529,-0.368 2.242,-0.16c-0.556,-0.676 -0.851,-1.599 -0.729,-2.537c0.191,-1.376 1.2,-2.418 2.47,-2.732c-1.356,-0.032 -2.591,-0.901 -3.044,-2.278l0.018,0c-0.471,-1.422 0.121,-2.955 1.322,-3.734c-1.443,0.589 -3.163,0.066 -4.018,-1.306c-0.941,-1.551 -0.471,-3.566 1.079,-4.505c0.276,-0.177 0.589,-0.315 0.902,-0.384c-0.154,-0.089 -0.294,-0.19 -0.415,-0.297c-1.393,-1.164 -1.566,-3.233 -0.401,-4.625l0,0.016c1.166,-1.391 3.235,-1.563 4.608,-0.4c1.39,1.164 1.567,3.217 0.401,4.609c-0.453,0.542 -1.044,0.904 -1.688,1.061c0.436,0.261 0.799,0.628 1.077,1.08c0.94,1.512 0.487,3.493 -0.993,4.468c0.072,-0.035 0.142,-0.069 0.228,-0.084c1.723,-0.56 3.566,0.382 4.121,2.104c0.54,1.719 -0.398,3.562 -2.118,4.122c-0.072,0.015 -0.159,0.049 -0.228,0.071c0.123,0 0.245,0 0.384,0.032c1.773,0.242 3.024,1.896 2.782,3.669c-0.244,1.788 -1.897,3.043 -3.688,2.799c-0.156,-0.018 -0.312,-0.05 -0.451,-0.102c0.173,0.225 0.348,0.487 0.469,0.765c0.732,1.633 0,3.581 -1.635,4.312c-0.453,0.19 -0.903,0.297 -1.356,0.297c-1.235,0 -2.436,-0.714 -2.974,-1.934Zm5.928,-27.042c-1.199,-1.356 -1.059,-3.409 0.278,-4.607c0.905,-0.802 2.106,-1.008 3.166,-0.664c-0.468,-0.522 -0.782,-1.216 -0.834,-1.965c-0.069,-0.888 0.227,-1.703 0.747,-2.331c-1.025,0.452 -2.261,0.384 -3.252,-0.33c-1.216,-0.888 -1.651,-2.435 -1.148,-3.775c-0.763,1.237 -2.277,1.862 -3.738,1.427c-1.461,-0.435 -2.384,-1.793 -2.332,-3.234c-0.329,1.389 -1.546,2.449 -3.044,2.521c-1.337,0.066 -2.52,-0.68 -3.077,-1.81c0.156,1.185 -0.346,2.401 -1.391,3.114c-1.479,1.042 -3.514,0.658 -4.542,-0.818c-1.022,-1.495 -0.658,-3.529 0.837,-4.556c1.479,-1.025 3.513,-0.644 4.539,0.836c0.104,0.14 0.176,0.257 0.245,0.398c-0.018,-0.085 -0.018,-0.19 -0.018,-0.28c-0.089,-1.806 1.305,-3.339 3.112,-3.424l0,0.017c1.81,-0.088 3.321,1.305 3.408,3.111c0.02,0.088 0.02,0.177 0.02,0.261c0,-0.066 0.017,-0.139 0.049,-0.206c0.508,-1.723 2.332,-2.715 4.072,-2.191c1.721,0.502 2.713,2.331 2.19,4.069c-0.018,0.068 -0.035,0.139 -0.069,0.19c0.052,-0.069 0.104,-0.14 0.156,-0.228c1.062,-1.461 3.097,-1.79 4.559,-0.73c1.46,1.062 1.807,3.115 0.748,4.558c-0.055,0.068 -0.106,0.14 -0.159,0.192c0.35,-0.158 0.73,-0.263 1.112,-0.281c1.812,-0.122 3.375,1.22 3.497,3.028c0.139,1.81 -1.218,3.373 -3.025,3.494c-0.435,0.039 -0.854,-0.015 -1.234,-0.155c0,0.016 0.015,0.034 0.034,0.034c1.182,1.358 1.06,3.427 -0.297,4.628c-0.624,0.541 -1.389,0.817 -2.156,0.817c-0.905,0.003 -1.808,-0.381 -2.453,-1.11Z" style="fill-rule:nonzero;stroke:#010202;stroke-width:0.31px;"/><path d="M57.169,77.331c-1.757,-0.473 -2.782,-2.277 -2.295,-4.02c0.035,-0.122 0.069,-0.243 0.121,-0.366c-0.019,0.04 -0.052,0.089 -0.086,0.123c-1.008,1.496 -3.061,1.877 -4.54,0.852c-1.497,-1.024 -1.879,-3.062 -0.853,-4.536c1.027,-1.498 3.062,-1.877 4.557,-0.853c1.287,0.885 1.739,2.52 1.183,3.929c0.729,-1.198 2.21,-1.827 3.634,-1.443c0.541,0.156 1.01,0.436 1.376,0.78c0.034,-0.379 0.14,-0.762 0.313,-1.146c0.713,-1.46 2.347,-2.155 3.861,-1.72c-1.497,-0.592 -2.386,-2.211 -1.982,-3.827c0.433,-1.755 2.208,-2.816 3.963,-2.383c1.758,0.418 2.819,2.19 2.384,3.947c-0.419,1.755 -2.191,2.816 -3.948,2.401c-0.052,-0.019 -0.086,-0.038 -0.14,-0.038c0.07,0.02 0.156,0.058 0.226,0.09c1.634,0.781 2.315,2.748 1.53,4.365c-0.783,1.634 -2.729,2.315 -4.363,1.531c-0.315,-0.139 -0.59,-0.35 -0.817,-0.556c-0.017,0.188 -0.053,0.379 -0.106,0.572c-0.397,1.46 -1.722,2.415 -3.165,2.415c-0.278,0.001 -0.575,-0.031 -0.853,-0.117Zm-12.276,-7.81c-1.324,-1.235 -1.395,-3.304 -0.16,-4.628c1.218,-1.319 3.287,-1.408 4.61,-0.171c1.321,1.216 1.41,3.284 0.174,4.623c-0.645,0.696 -1.514,1.045 -2.398,1.045c-0.802,0 -1.586,-0.294 -2.226,-0.869Zm-4.906,-5.479c-0.573,-0.903 -0.662,-1.982 -0.312,-2.901c-0.75,0.485 -1.672,0.693 -2.608,0.466c-1.518,-0.346 -2.524,-1.703 -2.505,-3.2c-0.243,1.535 -1.567,2.734 -3.167,2.767c-1.72,0.032 -3.165,-1.27 -3.319,-2.954c0.085,1.702 -1.168,3.217 -2.87,3.422c-1.81,0.229 -3.428,-1.06 -3.653,-2.851c-0.21,-1.79 1.06,-3.426 2.851,-3.634c1.811,-0.21 3.427,1.06 3.653,2.851l0,0.09l0,-0.123c-0.036,-1.812 1.39,-3.305 3.199,-3.342c1.81,-0.032 3.307,1.396 3.34,3.203l0,0.104c0.019,-0.087 0.036,-0.173 0.053,-0.263c0.416,-1.755 2.172,-2.834 3.93,-2.418l0,-0.016c1.756,0.419 2.853,2.188 2.436,3.948c-0.034,0.121 -0.07,0.245 -0.122,0.367c0.016,0 0.051,-0.021 0.069,-0.037c1.514,-0.974 3.547,-0.538 4.522,0.972c0.973,1.518 0.539,3.55 -0.976,4.524c-0.557,0.347 -1.165,0.522 -1.772,0.522c-1.081,0 -2.124,-0.523 -2.749,-1.497Zm26.349,-1.36c-1.774,-0.346 -2.94,-2.068 -2.593,-3.823c0.348,-1.774 2.07,-2.938 3.844,-2.592c1.773,0.349 2.923,2.069 2.574,3.827c-0.296,1.563 -1.669,2.662 -3.201,2.662c-0.207,0 -0.416,-0.036 -0.624,-0.074Z" style="fill-rule:nonzero;stroke:#010202;stroke-width:0.31px;"/><path d="M73.015,33.521c-1.793,-0.229 -3.062,-1.861 -2.835,-3.653c0.226,-1.793 1.859,-3.063 3.651,-2.836c1.792,0.229 3.062,1.862 2.836,3.653c-0.21,1.653 -1.617,2.854 -3.236,2.854c-0.139,-0.001 -0.278,-0.001 -0.416,-0.018Zm-6.784,-1.238c-1.755,-0.4 -2.853,-2.156 -2.453,-3.912c0.403,-1.757 2.158,-2.851 3.915,-2.453c1.756,0.4 2.853,2.14 2.453,3.913c-0.349,1.515 -1.688,2.541 -3.186,2.541c-0.243,0 -0.487,-0.034 -0.729,-0.089Zm-6.713,-1.947c-1.688,-0.645 -2.539,-2.541 -1.913,-4.225c0.035,-0.055 0.053,-0.088 0.069,-0.139c-0.122,0.156 -0.262,0.312 -0.417,0.452c-1.355,1.183 -3.426,1.042 -4.627,-0.295c-1.183,-1.359 -1.06,-3.427 0.295,-4.627c0.312,-0.278 0.663,-0.469 1.01,-0.607c-1.495,-0.923 -2.001,-2.853 -1.132,-4.402c0.47,-0.814 1.22,-1.355 2.071,-1.565c-0.768,-0.275 -1.425,-0.833 -1.811,-1.635c-0.556,-1.093 -0.417,-2.363 0.246,-3.305c-1.01,0.73 -2.402,0.854 -3.566,0.176c-1.564,-0.906 -2.087,-2.903 -1.183,-4.47c0.901,-1.566 2.905,-2.088 4.47,-1.181c1.565,0.903 2.086,2.903 1.183,4.466c-0.051,0.088 -0.088,0.156 -0.14,0.228c0.14,-0.105 0.313,-0.208 0.47,-0.278c1.634,-0.799 3.582,-0.14 4.384,1.477c0.798,1.618 0.139,3.583 -1.48,4.382c-0.225,0.106 -0.451,0.193 -0.676,0.245c0.174,0.055 0.33,0.139 0.486,0.227c1.581,0.887 2.122,2.887 1.234,4.45c-0.383,0.697 -1.01,1.203 -1.703,1.466c0.278,0.155 0.538,0.362 0.764,0.624c0.853,0.993 1.026,2.33 0.54,3.462c0.853,-1.097 2.364,-1.566 3.737,-1.043c1.688,0.626 2.54,2.521 1.898,4.209c-0.488,1.306 -1.739,2.119 -3.062,2.119c-0.383,-0.003 -0.765,-0.071 -1.147,-0.211Z" style="fill-rule:nonzero;stroke:#010202;stroke-width:0.31px;"/><path d="M11.778,47.901l0,-0.136c-0.019,0.102 -0.036,0.208 -0.051,0.312c-0.385,1.773 -2.123,2.888 -3.897,2.504c-1.755,-0.401 -2.887,-2.141 -2.503,-3.896c0.034,-0.14 0.068,-0.262 0.121,-0.384c-0.348,0.177 -0.713,0.296 -1.112,0.35c-1.791,0.243 -3.445,-1.027 -3.67,-2.819c-0.225,-1.791 1.026,-3.423 2.817,-3.651c0.189,-0.034 0.382,-0.034 0.574,-0.034c-0.053,-0.019 -0.124,-0.034 -0.173,-0.051c-1.704,-0.63 -2.558,-2.522 -1.931,-4.208l-0.019,0c0.626,-1.69 2.523,-2.561 4.208,-1.932c0.073,0.017 0.158,0.05 0.227,0.086c-0.032,-0.018 -0.069,-0.036 -0.086,-0.052c-1.529,-0.976 -1.966,-2.994 -0.991,-4.504c0.575,-0.92 1.53,-1.443 2.539,-1.515c-0.122,-0.102 -0.226,-0.207 -0.329,-0.313c-0.958,-1.025 -1.132,-2.485 -0.573,-3.668c-0.296,0.087 -0.628,0.139 -0.959,0.139c-1.807,0.017 -3.286,-1.443 -3.286,-3.253c0,-1.808 1.461,-3.268 3.271,-3.285c0.156,0 0.311,0.017 0.487,0.034c-0.072,-0.017 -0.123,-0.034 -0.176,-0.068c-1.65,-0.713 -2.416,-2.629 -1.704,-4.297c0.713,-1.65 2.646,-2.417 4.297,-1.704c0.069,0.034 0.139,0.071 0.208,0.104c-0.053,-0.034 -0.121,-0.071 -0.175,-0.122c-1.494,-1.01 -1.878,-3.045 -0.87,-4.539c1.01,-1.497 3.043,-1.877 4.541,-0.869c0.052,0.034 0.104,0.085 0.158,0.123c-0.088,-0.089 -0.158,-0.177 -0.244,-0.261c-1.132,-1.411 -0.939,-3.463 0.469,-4.611c1.392,-1.147 3.443,-0.941 4.591,0.469c1.149,1.394 0.938,3.446 -0.45,4.594c-1.202,0.974 -2.889,0.974 -4.07,0.068c1.114,1.08 1.321,2.836 0.416,4.173c-0.94,1.376 -2.747,1.811 -4.191,1.06c1.39,0.836 1.983,2.576 1.322,4.107l0,0.017c-0.591,1.372 -2.052,2.14 -3.478,1.93c1.251,0.452 2.139,1.655 2.139,3.061c0,0.506 -0.105,0.991 -0.332,1.426c1.166,-0.346 2.488,-0.05 3.375,0.887c1.234,1.321 1.165,3.394 -0.158,4.626c-0.572,0.541 -1.287,0.836 -2.033,0.887c1.303,1.026 1.636,2.887 0.713,4.313l0.017,0c-0.886,1.394 -2.66,1.881 -4.104,1.22c1.32,0.78 1.932,2.436 1.375,3.929c-0.507,1.375 -1.829,2.208 -3.219,2.141c1.182,0.363 2.121,1.392 2.294,2.714c0.072,0.518 0,1.025 -0.156,1.493c0.663,-0.346 1.444,-0.484 2.228,-0.31c1.513,0.327 2.557,1.648 2.573,3.126c0.192,-1.543 1.443,-2.781 3.042,-2.865c1.81,-0.124 3.358,1.249 3.478,3.059c0.106,1.81 -1.269,3.356 -3.077,3.463c-0.071,0 -0.122,0.015 -0.19,0.015c-1.726,-0.004 -3.17,-1.344 -3.273,-3.083Zm6.537,-0.434c-0.312,-1.791 0.889,-3.479 2.681,-3.773c1.773,-0.313 3.461,0.888 3.773,2.68c0.296,1.772 -0.904,3.46 -2.678,3.773c-0.192,0.033 -0.365,0.033 -0.539,0.033c-1.583,0 -2.959,-1.11 -3.237,-2.713Zm6.454,-1.112c-0.417,-1.755 0.679,-3.532 2.436,-3.946c1.757,-0.418 3.512,0.676 3.932,2.433c0.416,1.756 -0.664,3.515 -2.42,3.928c-0.262,0.072 -0.521,0.09 -0.763,0.09c-1.481,-0.001 -2.82,-1.009 -3.185,-2.505Zm6.399,-1.479c-0.54,-1.737 0.419,-3.565 2.159,-4.105c1.721,-0.521 3.548,0.435 4.084,2.156c0.541,1.724 -0.433,3.568 -2.156,4.104c-0.314,0.087 -0.642,0.137 -0.973,0.137c-1.391,0 -2.678,-0.901 -3.114,-2.292Z" style="fill-rule:nonzero;stroke:#010202;stroke-width:0.31px;"/></svg>
                            </div>
                            <div class="flex-grow-1 d-flex align-start flex-column ml-12">
                                <div class="title">Metaproteomics sample</div>
                                <div class="subtitle-1">
                                    {{ originalPeptideTrust.matchedPeptides }} peptides found,
                                    {{ originalPeptideTrust.searchedPeptides }} peptides in assay
                                </div>
                                <div>
                                    <span v-if="!filteredPeptideTrust">
                                        Applying filter...
                                    </span>
                                    <span v-else-if="isFilterApplied">
                                        {{ filteredPeptideTrust.matchedPeptides }} peptides in current selection
                                    </span>
                                    <span v-else>
                                        No filter applied
                                    </span>
                                </div>
                                <div class="subtitle-2">Last analysed on {{ getHumanReadableAssayDate() }}</div>

                                <!-- Show information about the validity status of this assay's cache -->
                                <div>
                                    <div v-if="cacheValidityLoading" class="d-flex justify-center">
                                        <span class="text--secondary">
                                            Checking cache validity...
                                        </span>
                                    </div>
                                    <div v-else-if="cacheIsValid">
                                        <span>Analysis is up-to-date, no need to restart the analysis.</span>
                                    </div>
                                    <div v-else>
                                        <span class="red--text">
                                            Something about the selected analysis source changed since the last time
                                            this assay has been analysed. Restart the analysis for these changes to
                                            come to effect.
                                        </span>
                                    </div>
                                </div>
                                <!-- Show currently selected analysis source and possibility to change it -->
                                <div>
                                    <v-progress-circular v-if="sourcesLoading"></v-progress-circular>
                                    <v-edit-dialog v-else large save-text="Change" @save="updateAnalysisSource()">
                                        <div>
                                            <v-icon small class="mr-1">mdi-web</v-icon>
                                            <span class="mr-1">{{ analysisSourceDescription }}</span>
                                            <a>(Click to change)</a>
                                        </div>
                                        <template v-slot:input>
                                            <analysis-source-select
                                                v-model="currentAnalysisSource"
                                                :items="renderableSources"
                                                class="my-6">
                                            </analysis-source-select>
                                        </template>
                                    </v-edit-dialog>
                                </div>
                            </div>
                        </div>
                        <search-settings-form
                            :horizontal="true"
                            :equate-il.sync="equateIl"
                            :filter-duplicates.sync="filterDuplicates"
                            :missing-cleavage.sync="missedCleavage">
                        </search-settings-form>

                        <div class="d-flex justify-center align-center mt-4">
                            <tooltip message="Reanalyse this assay">
                                <v-btn
                                    :disabled="sourcesLoading || !analysisReady || (cacheIsValid && !isDirty)"
                                    color="primary"
                                    @click="update()"
                                    class="mr-2"
                                >
                                    Update
                                </v-btn>
                            </tooltip>
                        </div>
                    </v-col>

                    <v-col sm="12" lg="6">
                        <peptide-summary-table :assay="assay" />
                        <div class="d-flex justify-center">

                            <export-results-button :assay="assay" button-text="Export results" />
                        </div>
                    </v-col>
                </v-row>
            </v-container>
        </v-card-text>
    </v-card>
    <v-card v-else>
        <v-card-text class="d-flex justify-center align-center">
            <v-progress-circular :size="70" :width="7" color="primary" indeterminate></v-progress-circular>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

import {
    ProteomicsAssay,
    CountTable,
    Peptide,
    SearchSettingsForm,
    SearchConfiguration,
    PeptideTrust,
    Pept2DataCommunicator,
    NetworkConfiguration,
    Tooltip, Study, Assay, OnlineAnalysisSource, AnalysisSource
} from "unipept-web-components";

import PeptideSummaryTable from "@/components/analysis/PeptideSummaryTable.vue";
import MetadataCommunicator from "@/logic/communication/metadata/MetadataCommunicator";
import StorageMetadataManager from "@/logic/filesystem/metadata/StorageMetadataManager";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import CachedOnlineAnalysisSource from "@/logic/communication/analysis/CachedOnlineAnalysisSource";
import CachedCustomDbAnalysisSource from "@/logic/communication/analysis/CachedCustomDbAnalysisSource";
import { RenderableAnalysisSource } from "@/components/assay/AnalysisSourceSelect.vue";
import AnalysisSourceSelect from "@/components/assay/AnalysisSourceSelect.vue";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import ExportResultsButton from "@/components/analysis/ExportResultsButton.vue";

@Component({
    components: { PeptideSummaryTable, SearchSettingsForm, ExportResultsButton, Tooltip, AnalysisSourceSelect }
})
export default class AnalysisSummary extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;

    private equateIl = true;
    private filterDuplicates = true;
    private missedCleavage = false;

    private originalEquateIl = true;
    private originalFilterDuplicates = true;
    private originalMissedCleavage = false;

    private analysisSource: AnalysisSource = null;
    private originalAnalysisSource: AnalysisSource = null;
    private sourcesLoading: boolean = true;

    private originalAnalysisSourceName = "";

    private currentAnalysisSource: RenderableAnalysisSource = null;
    private renderableSources: RenderableAnalysisSource[] = [];

    private cacheIsValid = true;
    // We are currently still checking if the provided cache is valid or not...
    private cacheValidityLoading = true;

    private searchConfigIsValid = true;

    get originalPeptideTrust(): PeptideTrust {
        return this.$store.getters.assayData(this.assay)?.originalData?.trust;
    }

    get filteredPeptideTrust(): PeptideTrust {
        return this.$store.getters.assayData(this.assay)?.filteredData?.trust;
    }

    get isFilterApplied(): boolean {
        return this.$store.getters.assayData(this.assay)?.filterId !== 1;
    }

    get endpoint(): string {
        return NetworkConfiguration.BASE_URL;
    }

    get analysisReady(): boolean {
        return this.$store.getters.assayData(this.assay)?.analysisReady;
    }

    // Did something change about the settings selected by the user in comparison to the current settings?
    get isDirty(): boolean {
        return this.originalEquateIl !== this.equateIl ||
            this.originalFilterDuplicates !== this.filterDuplicates ||
            this.originalMissedCleavage !== this.missedCleavage ||
            this.originalAnalysisSourceName !== this.currentAnalysisSource.title
    }

    get isOnlineAnalysisSource(): boolean {
        return this.analysisSource instanceof CachedOnlineAnalysisSource ||
            this.analysisSource instanceof OnlineAnalysisSource;
    }

    get analysisSourceDescription(): string {
        const analysisSource = this.analysisSource;
        if (this.isOnlineAnalysisSource) {
            return `${(analysisSource as OnlineAnalysisSource).endpoint} - online`;
        } else {
            return `${(analysisSource as CachedCustomDbAnalysisSource).customDatabase.name} - local database`;
        }
    }

    private async created() {
        this.sourcesLoading = true;
        const configMng = new ConfigurationManager();
        const config = await configMng.readConfiguration();

        for (const endpoint of config.endpoints) {
            this.renderableSources.push({
                type: "online",
                title: `Online service (${endpoint})`,
                subtitle: endpoint
            });
        }

        for (const dbInfo of (this.$store.getters["customDatabases/databases"] as CustomDatabase[])) {
            if (dbInfo.ready) {
                this.renderableSources.push({
                    type: "local",
                    title: dbInfo.name,
                    subtitle: `${dbInfo.entries} UniProtKB-entries`
                });
            }
        }

        this.onAssayChanged();
        this.checkCacheValidity();
        this.sourcesLoading = false;
    }

    @Watch("assay")
    private onAssayChanged() {
        if (this.assay) {
            const config = this.assay.getSearchConfiguration();
            this.equateIl = config.equateIl;
            this.filterDuplicates = config.filterDuplicates;
            this.missedCleavage = config.enableMissingCleavageHandling;

            this.originalEquateIl = config.equateIl;
            this.originalFilterDuplicates = config.filterDuplicates;
            this.originalMissedCleavage = config.enableMissingCleavageHandling;

            this.analysisSource = this.assay.getAnalysisSource();
            this.originalAnalysisSource = this.analysisSource;

            if (
                this.analysisSource instanceof OnlineAnalysisSource ||
                this.analysisSource instanceof CachedOnlineAnalysisSource
            ) {
                this.currentAnalysisSource = {
                    type: "online",
                    title: `Online service (${this.analysisSource.endpoint})`,
                    subtitle: this.analysisSource.endpoint
                }
            } else {
                const customDb = (this.analysisSource as CachedCustomDbAnalysisSource).customDatabase;

                this.currentAnalysisSource = {
                    type: "local",
                    title: customDb.name,
                    subtitle: `${customDb.entries} UniProtKB-entries`
                }
            }

            this.originalAnalysisSourceName = this.currentAnalysisSource.title;
        }
    }

    private async checkCacheValidity(): Promise<void> {
        this.cacheValidityLoading = true;
        const metadataMng = new StorageMetadataManager(
            this.$store.getters.dbManager,
            this.$store.getters.projectLocation,
            this.$store
        );
        const metadata = await metadataMng.readMetadata(this.assay);

        if (metadata) {
            this.cacheIsValid = await this.assay
                .getAnalysisSource()
                .verifyEquality(await metadata.analysisSource.computeFingerprint());
        } else {
            this.cacheIsValid = false;
        }

        this.cacheValidityLoading = false;
    }

    private async updateAnalysisSource(): Promise<void> {
        if (this.currentAnalysisSource.type === "online") {
            this.analysisSource = new CachedOnlineAnalysisSource(
                this.currentAnalysisSource.subtitle,
                this.assay,
                this.$store.getters.dbManager,
                this.$store.getters.projectLocation,
                this.$store
            );
        } else {
            const configMng = new ConfigurationManager();
            const config = await configMng.readConfiguration();

            this.analysisSource = new CachedCustomDbAnalysisSource(
                this.assay,
                this.$store.getters.dbManager,
                this.$store.getters["customDatabases/database"](this.currentAnalysisSource.title),
                config.customDbStorageLocation,
                this.$store.getters.projectLocation,
                this.$store
            );
        }
    }

    private update() {
        const config = new SearchConfiguration(this.equateIl, this.filterDuplicates, this.missedCleavage);
        this.assay.setSearchConfiguration(config);

        this.assay.setAnalysisSource(this.analysisSource);

        // We need to retrieve the name of the study with which this assay is associated to be able to write data to the
        // filesystem.
        const study = this.$store.getters.studies.filter(
            (s: Study) => s.getAssays().some(
                (a: Assay) => a.getId() === this.assay.getId()
            )
        )[0];

        const assayWriter = new AssayFileSystemDataWriter(
            `${this.$store.getters.projectLocation}/${study.getName()}`,
            this.$store.getters.dbManager,
            study,
            this.$store.getters.projectLocation,
            this.$store
        );
        this.assay.accept(assayWriter);

        this.$store.dispatch("analyseAssay", this.assay);
    }

    private getHumanReadableAssayDate(): string {
        const date = this.assay.getDate();
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ]

        return `${months[date.getMonth()]} ${date.getDate()} at ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
}
</script>

<style scoped>
    .alert {
        color: #F44336;
    }
</style>
