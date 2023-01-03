import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'

import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'


import testVertexShader from './shaders/test/vertex.glsl'
import testFragmentShader from './shaders/test/fragment.glsl'


/**
 * Math Util
 */
function map(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function lerp(a, b, t) {
    return a + t * (b - a);
}

function smootherstep(x, a, b) {
    x = x * x * x * (x * (x * 6 - 15) + 10);
    return x * (b - a) + a;
}

/**
 * Debug
 */
const gui = new dat.GUI()

const parameters = {
    materialColor: '#ffeded',
    maxAngle: Math.PI
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()

/**
 * Update all materials
 */
const updateAllMaterials = () => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMapIntensity = 1
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Material
 */

// Textures
const mapTexture = textureLoader.load('/models/LeePerrySmith/color.jpg')
mapTexture.encoding = THREE.sRGBEncoding

const normalTexture = textureLoader.load('/models/LeePerrySmith/normal.jpg')

// Material
const headMaterial = new THREE.MeshStandardMaterial({
    map: mapTexture,
    // color: new THREE.Color(0xff0000),
    normalMap: normalTexture
})

const customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking
})

const customUniforms = {
    uTime: { value: 0 },
    uAngle: { value: 0 }
}

headMaterial.onBeforeCompile = (shader) => {

    shader.uniforms.uTime = customUniforms.uTime;
    shader.uniforms.uAngle = customUniforms.uAngle;

    //COMMON
    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>

        uniform float uTime;
        uniform float uAngle;

        mat2 get2dRotateMatrix(float _angle) {
            return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
        `
    )

    //NORMALS
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>',
        `
      #include <beginnormal_vertex>

      float angle = position.y * uAngle;

      mat2 rotate = get2dRotateMatrix(angle);

      objectNormal.xz = rotate * objectNormal.xz;
      `
    )

    //BEGIN VERTEX
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        `
    vec3 transformed = vec3(position);


    transformed.xz = rotate * transformed.xz;
    `)

    console.log(shader.uniforms)
}


customDepthMaterial.onBeforeCompile = (shader) => {

    shader.uniforms.uTime = customUniforms.uTime;
    shader.uniforms.uAngle = customUniforms.uAngle;

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>

        uniform float uTime;

        mat2 get2dRotateMatrix(float _angle) {
            return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
        `
    )

    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        `
vec3 transformed = vec3(position);

float angle = position.y * uAngle;

 mat2 rotate = get2dRotateMatrix(angle);

transformed.xz = rotate * transformed.xz;
`)

}


/**
 * Models
 */

let headMesh = null

// gltfLoader.load('/models/FlightHelmet/glTF/FlightHelmet.gltf',
//     //success
//     (glTF) => {
//         console.log(glTF)
//         // scene.add(glTF.scene)

//         sceneChildren = [...glTF.scene.children]

//         for (const child of sceneChildren) {
//             child.position.set(0, -0.3, 4)
//             scene.add(child)
//         }
//     },

// )

gltfLoader.load(
    '/models/LeePerrySmith/LeePerrySmith.glb',
    (gltf) => {
        // Model
        const mesh = gltf.scene.children[0]
        mesh.rotation.y = Math.PI * 0.5
        mesh.material = headMaterial
        mesh.customDepthMaterial = customDepthMaterial
        headMesh = mesh
        scene.add(mesh)

        // Update materials
        updateAllMaterials()
    }
)

/**
 * Points
 */
const points = [
    {
        position: new THREE.Vector3(1.55, 0.3, - 0.6),
        element: document.querySelector('.point-0')
    },
    {
        position: new THREE.Vector3(0, 1.8, 5.6),
        element: document.querySelector('.point-1')
    },
    {
        position: new THREE.Vector3(-1.6, - 1.3, - 0.7),
        element: document.querySelector('.point-2')
    }
]

const raycaster = new THREE.Raycaster()

/**
 * Meshes
 */
//Texture
const loader = new THREE.TextureLoader()
const toonTex = loader.load('textures/gradients/3.jpg')
toonTex.magFilter = THREE.NearestFilter
toonTex.minFilter = THREE.NearestFilter

// Meshes
const objDistance = 4
let offsetX = 2

if (sizes.width < 650) {
    offsetX = 0
    console.log("thresh")
} else {
    offsetX = 2
}

// Material
const material = new THREE.RawShaderMaterial({
    vertexShader: testVertexShader,
    fragmentShader: testFragmentShader,
    wireframe: false,
    uniforms: {
        uTime: { value: 0.0 },
        uMouse: { value: { x: null, y: null } },
        uColor1: { value: new THREE.Vector4(1, 0, 0, 1) },
        uColor2: { value: new THREE.Vector4(0, 1, 1, 1) },
        uDiffuse: { value: toonTex },
        uTint: { value: new THREE.Vector4(0, 1, 1, 1) },
        uAngle: { value: 0 }
    }
})

const toonMat = new THREE.MeshToonMaterial({ color: 0xff0000, gradientMap: toonTex })
const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    toonMat
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    toonMat
)

const sectionMeshes = [mesh1, mesh2, mesh3]

mesh1.position.y = -objDistance * 0
mesh2.position.y = -objDistance * 1
mesh3.position.y = -objDistance * 2

mesh1.position.x = offsetX
mesh2.position.x = -offsetX
mesh3.position.x = offsetX

// scene.add(mesh1, mesh2, mesh3)

// sectionMeshes.forEach(mesh => {
//     mesh.material.color.set('0xff0000')
// })


/**
 * Particles
 */
//Geo
const particlesCount = 200
const positions = new Float32Array(particlesCount * 3)

for (let i = 0; i < particlesCount; i++) {
    //add offset to get xyz
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = objDistance * 0.5 - Math.random() * objDistance * sectionMeshes.length
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
}

const particlesGeo = new THREE.BufferGeometry()
particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

//Material
const particlesMat = new THREE.PointsMaterial({
    color: parameters.materialColor,
    sizeAttenuation: true,
    size: 0.03
})

//Points
const particles = new THREE.Points(particlesGeo, particlesMat)

// scene.add(particles)
/**
 * Gui
 */

gui.add(parameters, 'maxAngle', Math.PI, 2 * Math.PI).onChange((newAngle) => {
    if (angle && angle > newAngle) {
        angle = map(scrollY, 0, totalScrollHeight, 0, parameters.maxAngle)
    }
})
// .addColor(parameters, 'materialColor')
// .onChange(() => {
//     toonMat.color.set(parameters.materialColor)
//     particlesMat.color.set(parameters.materialColor)
// })


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)


/**
 * resize
 */

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight


    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
//Group
const camGroup = new THREE.Group()
// scene.add(camGroup)
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 14
// camGroup.add(camera)
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
let scrollY = window.scrollY
let currentSection = 0
let totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight
let angle = map(scrollY, 0, totalScrollHeight, 0, parameters.maxAngle)

window.addEventListener("scroll", () => {
    scrollY = window.scrollY

    // console.log(scrollY, totalScrollHeight)

    angle = map(scrollY, 0, totalScrollHeight, 0, parameters.maxAngle)


    const newSection = Math.round(scrollY / sizes.height)

    // if (currentSection !== newSection) {
    //     currentSection = newSection
    //     const currentObject = sectionMeshes[currentSection]

    //     console.log(currentObject.material.color)
    //     gsap.to(
    //         currentObject.rotation,
    //         {
    //             duration: 1.5,
    //             ease: 'power2.inOut',
    //             x: '+= 6',
    //             y: '+=3'
    //         }
    //     )

    // }
})

/**
 * Cursor
 */
const cursor = {
    x: 0,
    y: 0
}

window.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX / sizes.width - 0.5
    cursor.y = e.clientY / sizes.height - 0.5
})
/**
 * Animate
 */
const clock = new THREE.Clock()
let prevTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const dTime = elapsedTime - prevTime
    prevTime = elapsedTime

    //Animate camera
    //camera.position.y = - scrollY / sizes.height * objDistance
    mesh1.rotation.x = angle

    if (headMesh !== null) {
        headMesh.rotation.y = angle

        customUniforms.uAngle.value = angle * 0.5
    }


    //Shader
    material.uniforms.uAngle.value = angle

    const parallaxX = cursor.x * 0.5
    const parallaxY = -cursor.y * 0.5

    camera.position.x += (parallaxX - camera.position.x) * 4 * dTime
    camera.position.y += (parallaxY - camera.position.y) * 4 * dTime

    // Go through each point
    for (const point of points) {
        // console.log(point)
        const screenPosition = point.position.clone()
        screenPosition.project(camera)

        raycaster.setFromCamera(screenPosition, camera)
        const intersects = raycaster.intersectObjects(scene.children, true)

        //Show point if no intersection
        if (intersects.length === 0) {
            point.element.classList.add('visible')
        }
        else {
            console.log(intersects)
            // point.element.classList.remove('visible')
            const intersectionDistance = intersects[0].distance
            const pointDistance = point.position.distanceTo(camera.position)

            if (intersectionDistance < pointDistance) {
                point.element.classList.remove('visible')
            }
            else {
                point.element.classList.add('visible')
            }
        }

        const translateX = (parallaxX + screenPosition.x * sizes.width * 0.5)
        const translateY = - parallaxY - screenPosition.y * sizes.height * 0.5
        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
        // console.log(translateX)

        // console.log(screenPosition.x)
    }

    //Anim Meshes
    // sectionMeshes.forEach(mesh => {
    //     mesh.rotation.x += dTime * 0.1
    //     mesh.rotation.y += dTime * 0.2
    // })

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()