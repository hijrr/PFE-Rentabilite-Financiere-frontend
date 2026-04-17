import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotServiceService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<any> {
  return this.http.post<{response: string}>( 'http://localhost:8000/chat', { message: message });
}
}
