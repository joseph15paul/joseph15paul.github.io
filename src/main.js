import { SolarCalculator } from './solar.js';
import { VisualController } from './visuals.js';

document.addEventListener('DOMContentLoaded', () => {
    const solar = new SolarCalculator();
    const visuals = new VisualController();

    visuals.init();

    // Loop
    function tick() {
        const { diff, solarNoon } = solar.getTimeToNextSolarNoon();

        // Format time
        // diff is in ms
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((absDiff % (1000 * 60)) / 1000);
        const ms = Math.floor((absDiff % 1000));

        const pad = (n) => n.toString().padStart(2, '0');
        const padMs = (n) => n.toString().padStart(3, '0');

        const timeStr = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
        const msStr = padMs(ms);

        // Update precise text
        let label = "ORBITAL ALIGNMENT IN";
        if (diff < 0) label = "ALIGNMENT PASSED"; // Should handle tomorrow logic though

        visuals.updateDisplay(timeStr, msStr, label);

        requestAnimationFrame(tick);
    }

    tick();
});
