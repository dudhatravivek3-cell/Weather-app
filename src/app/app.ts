import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  minTemp: number;
  maxTemp: number;
  description: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  cloudCoverage: number;
  latitude: number;
  longitude: number;
  timezone: string;
  windDirection: number;
  clouds: number;
  cloudCoveragePercentage: number;
  dateTime: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('weather-app');

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  weather = signal<WeatherData>({
    location: 'Surat',
    country: 'IN',
    temperature: 31.8,
    feelsLike: 36.2,
    minTemp: 31.8,
    maxTemp: 31.8,
    description: 'Overcast Clouds',
    humidity: 59,
    pressure: 1008,
    windSpeed: 6.22,
    visibility: 10,
    sunrise: '05:59 AM',
    sunset: '07:22 PM',
    cloudCoverage: 100,
    latitude: 21.1667,
    longitude: 72.8333,
    timezone: 'GMT +5:30',
    windDirection: 231,
    clouds: 100,
    cloudCoveragePercentage: 100,
    dateTime: 'Mon, 08 Jun • 10:13 AM'
  });

  ngOnInit() {
    this.detectLocationAndLoadWeather();
  }

  detectLocationAndLoadWeather() {
    if (navigator.geolocation) {
      this.loading.set(true);
      this.error.set(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.fetchWeatherByCoords(lat, lon);
        },
        (error) => {
          console.warn('Geolocation permission denied or timed out. Falling back to Surat.', error);
          this.searchCity('Surat');
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    } else {
      console.warn('Geolocation is not supported by this browser. Falling back to Surat.');
      this.searchCity('Surat');
    }
  }

  async fetchWeatherByCoords(lat: number, lon: number) {
    this.loading.set(true);
    this.error.set(null);

    const appid = 'f00c38e0279b7bc85480c3fe775d518c';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appid}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to retrieve weather details for your location.');
      }

      const data = await response.json();
      this.mapAndSetWeatherData(data);
    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'Could not fetch weather for your coordinates. Defaulting to Surat.');
      this.searchCity('Surat');
    } finally {
      this.loading.set(false);
    }
  }

  async searchCity(city: string) {
    if (!city || city.trim() === '') return;

    this.loading.set(true);
    this.error.set(null);

    const appid = 'f00c38e0279b7bc85480c3fe775d518c';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${appid}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`City "${city}" not found. Please try another city.`);
        } else {
          throw new Error('Failed to retrieve weather details. Please try again.');
        }
      }

      const data = await response.json();
      this.mapAndSetWeatherData(data);
    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'An unexpected error occurred.');
    } finally {
      this.loading.set(false);
    }
  }

  private mapAndSetWeatherData(data: any) {
    const mappedData: WeatherData = {
      location: data.name,
      country: data.sys.country || '',
      temperature: Math.round(data.main.temp * 10) / 10,
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      minTemp: Math.round(data.main.temp_min * 10) / 10,
      maxTemp: Math.round(data.main.temp_max * 10) / 10,
      description: this.capitalizeWords(data.weather[0]?.description || ''),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      visibility: data.visibility / 1000, // convert meters to km
      sunrise: this.formatTime(data.sys.sunrise, data.timezone),
      sunset: this.formatTime(data.sys.sunset, data.timezone),
      cloudCoverage: data.clouds.all,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
      timezone: this.formatTimezone(data.timezone),
      windDirection: data.wind.deg,
      clouds: data.clouds.all,
      cloudCoveragePercentage: data.clouds.all,
      dateTime: this.formatDateTime(data.dt, data.timezone)
    };

    this.weather.set(mappedData);
  }

  private capitalizeWords(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatTimezone(offsetInSeconds: number): string {
    const hours = Math.floor(Math.abs(offsetInSeconds) / 3600);
    const minutes = Math.floor((Math.abs(offsetInSeconds) % 3600) / 60);
    const sign = offsetInSeconds >= 0 ? '+' : '-';
    const paddedMinutes = minutes.toString().padStart(2, '0');
    return `GMT ${sign}${hours}:${paddedMinutes}`;
  }

  private formatTime(unixTimestamp: number, timezoneOffset: number): string {
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${ampm}`;
  }

  private formatDateTime(unixTimestamp: number, timezoneOffset: number): string {
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = weekdays[date.getUTCDay()];
    const dayNum = date.getUTCDate().toString().padStart(2, '0');
    const monthName = months[date.getUTCMonth()];

    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${dayName}, ${dayNum} ${monthName} • ${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${ampm}`;
  }
}
