import * as THREE from "three";

import GUI from "lil-gui";

import { gsap } from "gsap";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader, RGBELoader } from "three/examples/jsm/Addons.js";

import overlayVertexShader from "./overlay/vertex.glsl";
import overlayFragmentShader from "./overlay/fragment.glsl";

// Setup

// ------------ gui -------------------
/**
 * @description Debug UI - lil-ui
 */
const gui = new GUI({
  width: 340,
  title: "Tweak It",
  closeFolders: false,
});

/**
 * @description gui parmeters
 */
const parameters = {
  //
  "rotate model": 0,
  // default is 1 I think
  "envMapIntensity for every material of model": 1,
  // backgroundBluriness: 0.2,
  backgroundBluriness: 0,
  // backgroundIntensity: 5,
  backgroundIntensity: 1,
};

gui.close();

const realisticRendering = gui.addFolder("Realistic Rendering");
realisticRendering.close();

const overlayFolder = gui.addFolder("Overlay");
overlayFolder.close();

gui.addColor({ randomColor: "" }, "randomColor");

// -------------------------------------------------------------
// -------------------------------------------------------------

//------------ canvas settings -----------
/**
 * @description canvas settings
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
// ----------------------------------------

const canvas: HTMLCanvasElement | null = document.querySelector("canvas.webgl");

if (canvas) {
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------

  // ------- Scene
  const scene = new THREE.Scene();

  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------- Overlay --------------------------------------------
  // --------------------------------------------------------------

  const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);

  const overlayMaterial = new THREE.ShaderMaterial({
    // wireframe: true,
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,

    transparent: true,
    uniforms: {
      uAlpha: {
        // value: 0.5
        value: 1,
      },
    },
    // todo: need to research what this does
    // depthWrite: false,
    // depthTest: false,
  });

  const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);

  scene.add(overlay);

  overlayFolder
    .add(overlayMaterial.uniforms.uAlpha, "value")
    .min(0)
    .max(1)
    .step(0.01)
    .name("overlayAlpha")
    .onChange(() => {
      // I think I don't need this
      // overlayMaterial.needsUpdate = true;
      // works without it
    });

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // ---- loaders and loading manager -------

  const loading_bar: HTMLDivElement | null =
    document.querySelector(".loading-bar");

  /**
   * @description loaders and LoadingManager
   */

  const loadingManager = new THREE.LoadingManager(
    () => {
      gsap.delayedCall(0.5, () => {
        if (loading_bar) {
          loading_bar.classList.add("ended");

          loading_bar.style.transform = "";
          gsap.to(overlayMaterial.uniforms.uAlpha, { value: 0, duration: 3 });
        }
      });

      //
    },
    /**
     *
     * @param _ of the asset
     * @param loaded how much assets were loaded
     * @param total total number of assets to load
     */
    (_, loaded, total) => {
      const progressRatio = loaded / total;
      // console.log(`progressRatio: ${progressRatio}`);

      if (loading_bar) {
        loading_bar.style.setProperty("--progress", `${progressRatio}`);
      }

      if (loaded === total) {
        console.log("All assets loaded");
      }
    },
    () => {
      // onError
      console.log("Error with loading (loading manager)");
    }
  );
  // we just pass manager in instatioations of loaders
  const gltfLoader = new GLTFLoader(loadingManager);

  const rgbeLoader = new RGBELoader(loadingManager);

  // const cubeTextureLoader = new THREE.CubeTextureLoader();
  // const textureLoader = new THREE.TextureLoader();

  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------------------------------------------------------------
  // --------------------------------------------------------------

  scene.backgroundBlurriness = parameters.backgroundBluriness;
  scene.backgroundIntensity = parameters.backgroundIntensity;
  //
  realisticRendering
    .add(parameters, "backgroundBluriness")
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val: number) => {
      scene.backgroundBlurriness = val;
    });
  realisticRendering
    .add(parameters, "backgroundIntensity")
    .min(1)
    .max(10)
    .step(0.1)
    .onChange((val: number) => {
      scene.backgroundIntensity = val;
    });

  //

  function setEnvironmentMapForMaterialsOfModel(envMap: THREE.DataTexture) {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          child.material instanceof THREE.MeshStandardMaterial &&
          !(child.geometry instanceof THREE.TorusKnotGeometry)
        ) {
          child.material.envMap = envMap;
          child.material.envMapIntensity =
            parameters["envMapIntensity for every material of model"];

          // shadows
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });
  }

  realisticRendering
    .add(parameters, "envMapIntensity for every material of model")
    .min(1)
    .max(10)
    .step(0.001)
    .onChange(updateAllMaterials);

  /**
   * @description Update All Materials
   */
  function updateAllMaterials() {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          child.material instanceof THREE.MeshStandardMaterial &&
          !(child.geometry instanceof THREE.TorusKnotGeometry)
        ) {
          // we can now define setting intensity with
          // gui

          child.material.envMapIntensity =
            parameters["envMapIntensity for every material of model"];
          child.material.needsUpdate = true;
        }
      }
    });
  }

  // -------- Camera -------------------------------
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.set(4, 1, -4);
  scene.add(camera);

  //------------------------------------------------
  //------------------------------------------------
  //------------------------------------------------
  //------------------------------------------------
  // ----------    ENVIRONMENT MAP

  // we write this

  /**
   * @description HDR (RGBE) equirectangular
   */
  rgbeLoader.load(
    "/textures/environmentMaps/underpass/2k.hdr",
    (environmentMap) => {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = environmentMap;

      gltfLoader.load("/models/cyber_helmet/cyber_helmet.glb", (gltf) => {
        console.log("model loaded");
        gltf.scene.scale.setScalar(10);
        gltf.scene.position.y = -1;

        gui
          .add(parameters, "rotate model")
          .onChange((a: number) => {
            gltf.scene.rotation.y = Math.PI * a;
          })
          .min(0)
          .max(2);

        scene.add(gltf.scene);

        setEnvironmentMapForMaterialsOfModel(environmentMap);
      });
    }
    // I'll remove these for now since I don't need them
    // we are already doing stuff in loading manager
    /* () => {
      console.log("loading hdri progressing");
    },
    (err) => {
      console.log("HDRI not loaded");
      console.error(err);
    } */
  );
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------

  // ----------------------------------------------
  // ----------------------------------------------
  // Meshes, Geometries, Materials
  // ----------------------------------------------
  // ----------------------------------------------

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // ------------------------- LIGHTS ----------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  /**
   * @description Directional light
   */
  const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
  directionalLight.position.set(-4, 6.5, 2.5);
  scene.add(directionalLight);

  // add this before adding helper
  directionalLight.shadow.camera.far = 15;

  directionalLight.shadow.mapSize.set(1024, 1024);

  const directionalLightCameraHelper = new THREE.CameraHelper(
    directionalLight.shadow.camera
  );

  directionalLight.castShadow = true;

  directionalLight.target.position.set(0, 2, 0);
  directionalLight.target.updateWorldMatrix(true, true);

  directionalLightCameraHelper.visible = false;

  scene.add(directionalLightCameraHelper);

  realisticRendering.add(directionalLight, "castShadow");

  realisticRendering
    .add(directionalLight, "intensity")
    .min(0)
    .max(10)
    .step(0.001)
    .name("directLightIntensity");
  realisticRendering
    .add(directionalLight.position, "x")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighX");
  realisticRendering
    .add(directionalLight.position, "y")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighY");
  realisticRendering
    .add(directionalLight.position, "z")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighZ");

  realisticRendering
    .add(directionalLight.target.position, "x")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighTargetPositionX")
    .onChange(() => {
      directionalLight.target.updateWorldMatrix(true, true);
    });

  realisticRendering
    .add(directionalLight.target.position, "y")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighTargetPositionY")
    .onChange(() => {
      directionalLight.target.updateWorldMatrix(true, true);
    });

  realisticRendering
    .add(directionalLight.target.position, "z")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighTargetPositionZ")
    .onChange(() => {
      directionalLight.target.updateWorldMatrix(true, true);
    });

  realisticRendering
    .add(directionalLight.shadow.camera, "far")
    .min(-10)
    .max(20)
    .step(0.001)
    .name("directLighShadowCameraFar")
    .onChange(() => {
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    });

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------

  // -------- Controls and helpers

  const orbit_controls = new OrbitControls(camera, canvas);
  orbit_controls.enableDamping = true;

  // ----------------------------------------------
  // ----------------------------------------------

  // -------------- RENDERER
  // ----------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    //To make the edges of the objects more smooth (we are setting this in this lesson)
    antialias: true,
    alpha: true,
  });

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // maybe this should be only inside       tick

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // -------------- SHADOWS ----------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ------------- TONE MAPPING ------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 3;

  realisticRendering.add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  });
  realisticRendering
    .add(renderer, "toneMappingExposure")
    .min(0)
    .max(10)
    .step(0.001);

  // ---------------------------------------------------------
  // Our custom passes

  // ----------

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // needs to be last but before SMAA

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  /**
   * Event Listeners
   */

  window.addEventListener("resize", (e: UIEvent) => {
    console.log("resizing");
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    //
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "h") {
      gui.show(gui._hidden);
    }
  });

  const mouse = new THREE.Vector2();
  window.addEventListener("mousemove", (_event) => {
    mouse.x = (_event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(_event.clientY / sizes.height) * 2 + 1;

    // console.log({ mouse });
  });

  /* window.addEventListener("dblclick", () => {
    console.log("double click");

    // handling safari
    const fullscreenElement =
      // @ts-ignore webkit
      document.fullscreenElement || document.webkitFullScreenElement;
    //

    // if (!document.fullscreenElement) {
    if (!fullscreenElement) {
      if (canvas.requestFullscreen) {
        // go fullscreen
        canvas.requestFullscreen();

        // @ts-ignore webkit
      } else if (canvas.webkitRequestFullScreen) {
        // @ts-ignore webkit
        canvas.webkitRequestFullScreen();
      }
    } else {
      // @ts-ignore
      if (document.exitFullscreen) {
        document.exitFullscreen();

        // @ts-ignore webkit
      } else if (document.webkitExitFullscreen) {
        // @ts-ignore webkit
        document.webkitExitFullscreen();
      }
    }
  }); */

  // ---------------------- TICK -----------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------

  const clock = new THREE.Clock();

  /**
   * @description tick
   */
  function tick() {
    // for dumping to work
    orbit_controls.update();

    // so instead of this
    renderer.render(scene, camera);

    window.requestAnimationFrame(tick);
  }

  tick();
}
