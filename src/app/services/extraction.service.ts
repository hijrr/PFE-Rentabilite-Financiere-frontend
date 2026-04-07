import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExtractionService {

  constructor(private http: HttpClient) { }

  extractFicheDePaie(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-ficheDePaie/`, formData);
  }

   extractNoteDeFrais(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-noteDeFrais/`, formData);
  }
  extractNoteDeFraisKilometrique(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-noteDeFraisKilometrique/`, formData);
  }
  extractionDonneesPersonnelles(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-infosPersonnel/`, formData);
  }

  extractFicheDePaieZip(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-ficheDePaie-zip/`, formData);
  }

   extractNoteDeFraisZip(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-noteDeFrais-zip/`, formData);
  }
  extractNoteDeFraisKilometriqueZip(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`http://localhost:8000/extract-noteDeFraisKilometrique-zip/`, formData);
  }
}
