import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ChatbotServiceService } from 'src/app/services/chatbot-service.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
private recognition: any;
  isChatOpen = false;
  userMessage = '';
  messages: any[] = [];
  isTyping = false;
  isListening = false;

  constructor(private chatbotService: ChatbotServiceService) {}

  ngOnInit() {
    this.messages.push({
      sender: 'bot',
      text: "👋 Bonjour ! Je suis Elzei AI Assistant. Vous pouvez écrire ou parler.",
      timestamp: new Date(),
      id: this.generateId()
    });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 6);
  }

  openChat() {
    this.isChatOpen = true;
    this.scrollToBottom();
  }

  closeChat() {
    this.isChatOpen = false;
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    const userMsgObj = {
      sender: 'user',
      text: this.userMessage,
      timestamp: new Date(),
      id: this.generateId()
    };
    this.messages.push(userMsgObj);
    const userMessageText = this.userMessage;
    this.userMessage = '';
    this.scrollToBottom();

    this.isTyping = true;

    this.chatbotService.sendMessage(userMessageText).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: res.response,
          timestamp: new Date(),
          id: this.generateId()
        });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: "❌ Désolé, une erreur s'est produite. Veuillez réessayer.",
          timestamp: new Date(),
          id: this.generateId()
        });
        this.scrollToBottom();
      }
    });
  }

  copyMessage(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Optionnel : un petit toast ou feedback visuel
      console.log('Message copié');
    }).catch(err => console.error('Erreur copie:', err));
  }

  replyToMessage(text: string) {
    this.userMessage = `Réponse à : "${text.substring(0, 50)}" `;
    this.scrollToInput();
  }

  private scrollToInput() {
    setTimeout(() => {
      const inputEl = document.querySelector('.chat-input input') as HTMLInputElement;
      if (inputEl) inputEl.focus();
    }, 100);
  }

  startVoice() {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Reconnaissance vocale non supportée");
    return;
  }

  this.recognition = new SpeechRecognition();

  this.recognition.lang = navigator.language || 'fr-FR';
  this.recognition.interimResults = true;
  this.recognition.continuous = false;

  this.isListening = true;

  let finalTranscript = '';

  this.recognition.onresult = (event: any) => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    this.userMessage = finalTranscript + interimTranscript;
  };

  this.recognition.onerror = () => {
    this.isListening = false;
  };

  this.recognition.onend = () => {
    this.isListening = false;
  };

  this.recognition.start();
}
stopVoice() {
  if (this.recognition) {
    this.recognition.stop(); // 🔴 STOP micro
    this.isListening = false;
  }
}
  private scrollToBottom() {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 100);
  }

  formatTime(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return `Aujourd'hui ${this.formatTime(d)}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Hier ${this.formatTime(d)}`;
    return `${d.toLocaleDateString()} ${this.formatTime(d)}`;
  }
}
