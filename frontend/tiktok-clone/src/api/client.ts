import axios from "axios";

// Maak een Axios-instantie aan met een standaard basis-URL en headers
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
// Wordt uitgevoerd vóór elke API-aanvraag
api.interceptors.request.use((config) => {
  // Haal het access token op uit localStorage
  const token = localStorage.getItem("access_token");

  // Voeg het token toe aan de Authorization-header indien aanwezig
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor
// Wordt uitgevoerd na elke API-respons
api.interceptors.response.use(
  // Bij een succesvolle respons wordt deze gewoon teruggegeven
  (res) => res,

  // Bij een fout wordt deze functie uitgevoerd
  async (err) => {
    const orig = err.config; // Bewaar de oorspronkelijke aanvraag

    // Controleer of de fout een 401 (Unauthorized) is
    // en voorkom een oneindige herhaal-lus met _retry
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;

      try {
        // Haal het refresh token op
        const refresh = localStorage.getItem("refresh_token");

        // Vraag een nieuw access token aan via de refresh-endpoint
        const { data } = await axios.post(
          "http://localhost:8000/api/auth/token/refresh/",
          { refresh }
        );

        // Sla het nieuwe access token op
        localStorage.setItem("access_token", data.access);

        // Voeg het nieuwe token toe aan de oorspronkelijke aanvraag
        orig.headers.Authorization = `Bearer ${data.access}`;

        // Voer de oorspronkelijke aanvraag opnieuw uit
        return api(orig);
      } catch {
        // Als refreshen mislukt:
        // verwijder alle opgeslagen tokens en stuur de gebruiker naar de loginpagina
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    // Geef andere fouten door aan de code die de aanvraag heeft uitgevoerd
    return Promise.reject(err);
  }
);

// Exporteer de Axios-instantie zodat deze overal gebruikt kan worden
export default api;