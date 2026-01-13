import anime from '../anime.min.js';

export class VisualController {
    constructor() {
        this.initElements();
        this.warpActive = false;
        this.baseTimeScale = 1;
    }

    initElements() {
        this.world = document.querySelector('.world');
        this.bgContainer = document.querySelector('.layer-rain');
        this.dialContainer = document.querySelector('.layer-rings');
        this.hudAzimuth = document.querySelector('.hud-azimuth .value');
        this.hudElevation = document.querySelector('.hud-elevation .value');
        this.timeDisplay = document.querySelector('.time-display');
        this.dateDisplay = document.querySelector('.date-display');
        this.sun = document.querySelector('.sun-central');
    }

    init() {
        this.createDataRain();
        this.createChronoRings();
        this.initParallax();
        this.initWarp();
        this.introAnimation();
        this.initGlitchText();
    }

    createDataRain() {
        // Reduced density for performance in 3D
        const w = window.innerWidth;
        const h = window.innerHeight;
        const total = 150;

        this.bgContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < total; i++) {
            const el = document.createElement('div');
            el.className = 'rain-char absolute text-[#7B2CBF] opacity-40 text-xs font-mono';
            const chars = '01SunMoonMarsVenusJupiter∞∆∇';
            el.innerText = chars.charAt(Math.floor(Math.random() * chars.length));

            el.style.left = `${Math.random() * 100}%`;
            el.style.top = `${Math.random() * 100}%`;
            el.style.transform = `translateZ(${Math.random() * 200 - 100}px)`; // varied depth

            fragment.appendChild(el);
        }
        this.bgContainer.appendChild(fragment);

        this.rainAnim = anime({
            targets: '.rain-char',
            opacity: [
                { value: [0, 0.4], easing: 'easeOutSine', duration: 500 },
                { value: 0, easing: 'easeInOutQuad', duration: 1200 }
            ],
            translateY: [
                { value: -50, duration: 0 },
                { value: 50, duration: 2000 }
            ],
            delay: anime.stagger(50),
            loop: true,
            autoplay: true
        });
    }

    createChronoRings() {
        // Create individual rings in separate Z-planes
        // We will create multiple SVGs or Divs.
        const ns = "http://www.w3.org/2000/svg";
        const depths = [0, 20, 40, 60, 80];

        const ringDefs = [
            { r: 100, dash: [40, 10], width: 2, color: '#7B2CBF', duration: 8000, dir: 'normal', z: 0 },
            { r: 150, dash: [100, 20], width: 4, color: '#FFD700', duration: 12000, dir: 'reverse', z: 30 },
            { r: 200, dash: [5, 5], width: 1, color: '#7B2CBF', duration: 20000, dir: 'normal', z: 60 },
            { r: 280, dash: [200, 100], width: 8, color: '#090909', stroke: '#333', duration: 6000, dir: 'alternate', z: 90 },
            { r: 350, dash: [2, 10], width: 15, color: '#FFD700', duration: 4000, dir: 'normal', opacity: 0.2, z: 120 },
        ];

        this.ringAnims = [];

        ringDefs.forEach((ring, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center';
            // We use JS transform for Z separation because Tailwind doesn't have arbitrary translateZ utilities by default easily? 
            // Actually inline style is fine.
            // wrapper.style.transform = `translate(-50%, -50%) translateZ(${ring.z}px)`; 
            // Note: Mixing tailwind transform with inline transform can be tricky.
            // Let's use a nested SVG.

            wrapper.style.width = '800px';
            wrapper.style.height = '800px';
            wrapper.style.transform = `translate3d(-50%, -50%, ${ring.z}px)`;
            wrapper.style.pointerEvents = 'none';

            const svg = document.createElementNS(ns, "svg");
            svg.setAttribute("viewBox", "0 0 800 800");
            svg.setAttribute("class", "w-full h-full");

            const circle = document.createElementNS(ns, "circle");
            circle.setAttribute("cx", "400");
            circle.setAttribute("cy", "400");
            circle.setAttribute("r", ring.r);
            circle.setAttribute("fill", "none");
            circle.setAttribute("stroke", ring.color);
            circle.setAttribute("stroke-width", ring.width);
            circle.setAttribute("stroke-dasharray", ring.dash.join(','));
            if (ring.opacity) circle.setAttribute("opacity", ring.opacity);

            svg.appendChild(circle);
            wrapper.appendChild(svg);
            this.dialContainer.appendChild(wrapper);

            const anim = anime({
                targets: circle,
                rotate: ring.dir === 'reverse' ? '-1turn' : '1turn',
                duration: ring.duration,
                loop: true,
                easing: 'linear',
                direction: ring.dir === 'alternate' ? 'alternate' : 'normal'
            });
            this.ringAnims.push(anim);
        });
    }

    initParallax() {
        document.addEventListener('mousemove', (e) => {
            if (this.warpActive) return; // Disable parallax during warp

            const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            anime({
                targets: this.world,
                rotateX: -y * 10, // Max 10deg tilt
                rotateY: x * 10,
                easing: 'easeOutQuad',
                duration: 100
            });
        });
    }

    initWarp() {
        const startWarp = () => {
            this.warpActive = true;
            document.body.style.cursor = 'wait';

            // Speed up rain
            // Anime.js doesn't support changing duration on the fly easily for running animations without restart or tick manipulation.
            // But we can use 'update' callback or just restart with new params.
            // Simplest is to restart with faster params.

            // Warp Effect on World
            anime({
                targets: this.world,
                scale: 0.8,
                rotateX: 0,
                rotateY: 0,
                duration: 1000,
                easing: 'easeInQuad'
            });

            // Speed up rings
            this.ringAnims.forEach(anim => {
                anim.pause();
                // Create new generic object to drive tick? No, anime.js v3 has .timeScale? 
                // No, it doesn't. 
                // We'll just re-animate with shorter duration.
                anime({
                    targets: anim.animatables[0].target,
                    rotate: '+=2turn',
                    duration: 1000,
                    easing: 'easeInExpo'
                });
            });

            // Rain Accel
            anime.remove('.rain-char');
            anime({
                targets: '.rain-char',
                opacity: 0.8,
                translateY: 200,
                duration: 200,
                delay: anime.stagger(10),
                loop: true,
                easing: 'linear'
            });
        };

        const endWarp = () => {
            this.warpActive = false;
            document.body.style.cursor = 'none';

            anime({
                targets: this.world,
                scale: 1,
                duration: 1500,
                easing: 'easeOutElastic(1, .5)'
            });

            // Restore Rings
            this.dialContainer.innerHTML = '';
            this.createChronoRings(); // Re-init normal speed

            // Restore Rain
            this.createDataRain();
        };

        document.addEventListener('mousedown', startWarp);
        document.addEventListener('mouseup', endWarp);
        document.addEventListener('touchstart', startWarp);
        document.addEventListener('touchend', endWarp);
    }

    introAnimation() {
        anime({
            targets: '.layer-rings div',
            scale: [0, 1],
            opacity: [0, 1],
            translateZ: (el, i) => [0, i * 30], // Expand outwards in Z
            duration: 2500,
            delay: anime.stagger(200),
            easing: 'easeOutElastic(1, .8)'
        });
    }

    initGlitchText() {
        const targets = ['.hud-azimuth .label', '.hud-elevation .label', '.date-display'];
        // Simple text scramble/reveal could go here
    }

    updateDisplay(timeStr, msStr, labelText, azimuth, elevation) {
        this.timeDisplay.innerHTML = `${timeStr}<span class="text-xs ml-2 text-gray-500">${msStr}</span>`;
        this.dateDisplay.innerText = labelText;

        this.hudAzimuth.innerText = azimuth + "°";
        this.hudElevation.innerText = elevation + "°";

        // Pulse Sun logic based on seconds (can trigger on update)
        // This is called constantly, so use CSS animation or simple sine wave on opacity/shadow
        const ms = new Date().getMilliseconds();
        const pulse = 1 + Math.sin(ms * 0.006) * 0.1;
        if (this.sun) this.sun.style.transform = `translate(-50%, -50%) scale(${pulse})`;
    }
}
