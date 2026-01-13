/**
 * Solar Noon Calculator for Angamaly, Kerala
 * Location: 10.1960° N, 76.3860° E
 * Standard Meridian (India): 82.5° E
 */

export class SolarCalculator {
    constructor() {
        this.latitude = 10.1960;
        this.longitude = 76.3860;
        this.standardMeridian = 82.5; // IST
        this.latRad = this.latitude * (Math.PI / 180);
    }

    getEquationOfTime(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
        const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
        return eot;
    }

    getSolarNoon(date) {
        const longDiff = this.standardMeridian - this.longitude;
        const geoCorrection = longDiff * 4;
        const eqt = this.getEquationOfTime(date);
        const totalCorrectionMinutes = geoCorrection - eqt;

        const solarNoon = new Date(date);
        solarNoon.setHours(12, 0, 0, 0);
        solarNoon.setMinutes(solarNoon.getMinutes() + Math.floor(totalCorrectionMinutes));
        solarNoon.setSeconds(solarNoon.getSeconds() + (totalCorrectionMinutes % 1) * 60);

        return solarNoon;
    }

    getTimeToNextSolarNoon() {
        const now = new Date();
        let solarNoon = this.getSolarNoon(now);
        if (now > solarNoon) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            solarNoon = this.getSolarNoon(tomorrow);
        }
        const diff = solarNoon - now;
        return { diff, solarNoon };
    }

    /**
     * Calculates Solar Azimuth and Elevation
     */
    getSolarPosition() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));

        // Declination (delta)
        // delta = 23.45 * sin(360/365 * (d - 81))
        const degToRad = Math.PI / 180;
        const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * degToRad);
        const declRad = declination * degToRad;

        // Hour Angle (H)
        // Solar Time
        const eqt = this.getEquationOfTime(now);
        const longDiff = this.standardMeridian - this.longitude; // Degrees
        // Local Standard Time (decimal hours)
        const lst = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        // Solar Time = LST - (longDiff / 15) + EqT/60
        // Wait, 4 min per degree = 1 hour per 15 degrees.
        // If local is West of Meridian (-diff), Solar time is earlier (minus).
        // Correct: Solar Time = Standard Time + (LocalLong - StandardMeridian)/15 + EqT/60
        // (76.386 - 82.5) is negative.

        const solarTime = lst + (this.longitude - this.standardMeridian) / 15 + eqt / 60;

        // Hour Angle: 15deg per hour from noon (12).
        const hourAngle = (solarTime - 12) * 15;
        const haRad = hourAngle * degToRad;

        // Elevation (alpha)
        // sin(alpha) = sin(lat)*sin(delta) + cos(lat)*cos(delta)*cos(HA)
        const sinElev = Math.sin(this.latRad) * Math.sin(declRad) +
            Math.cos(this.latRad) * Math.cos(declRad) * Math.cos(haRad);
        const elevation = Math.asin(sinElev) / degToRad;

        // Azimuth (theta)
        // cos(theta) = (sin(delta) * cos(lat) - cos(delta) * sin(lat) * cos(HA)) / cos(alpha)
        // Note: Azimuth formula varies by convention (N=0 vs S=0). This usually gives from South.
        // Let's use cleaner one:
        // cos(Z) = (sin(dec) - sin(lat)sin(alt)) / (cos(lat)cos(alt))

        const cosAz = (Math.sin(declRad) - Math.sin(this.latRad) * Math.sin(Math.asin(sinElev))) /
            (Math.cos(this.latRad) * Math.cos(Math.asin(sinElev)));

        let azimuth = Math.acos(Math.min(Math.max(cosAz, -1), 1)) / degToRad;

        // Correct based on Hour Angle
        if (hourAngle > 0) {
            azimuth = 360 - azimuth;
        }

        return {
            azimuth: azimuth.toFixed(2),
            elevation: elevation.toFixed(2),
            declination: declination.toFixed(2)
        };
    }
}
