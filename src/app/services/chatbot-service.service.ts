import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}
@Injectable({
  providedIn: 'root'
})

export class ChatbotServiceService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: HistoryEntry[] = [], forcedLang?: string): Observable<any> {
    return this.http.post<any>('http://localhost:8000/chat', { message,  history, forced_lang: forcedLang || null });
  }
}
