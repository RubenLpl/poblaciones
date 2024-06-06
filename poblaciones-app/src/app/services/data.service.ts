import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'https://restcountries.com/v3.1/all';

  constructor(private http: HttpClient) {}

  // Método para obtener la lista de países desde la API
  getCountries(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      retry(3), // Reintentar la solicitud hasta 3 veces en caso de error
      catchError(this.handleError) // Manejar errores
    );
  }

  // Método para agrupar los datos de los países por continente
  groupByContinent(data: any): { [key: string]: number } {
    const continents: { [key: string]: number } = {}; // Objeto para almacenar las poblaciones por continente

    // Iterar sobre la lista de países
    data.forEach((country: any) => {
      const continent = country.region; // Obtener el continente del país
      if (!continents[continent]) {
        continents[continent] = 0; // Inicializar el contador de población si no existe
      }
      continents[continent] += country.population; // Sumar la población del país al continente correspondiente
    });

    return continents; // Devolver el objeto con las poblaciones por continente
  }

  // Método privado para manejar errores en las solicitudes HTTP
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error); // Loguear el error en la consola
    return throwError(
      () => new Error('Something bad happened; please try again later.') // Devolver un observable con un error
    );
  }
}
