import { Component, ElementRef, ViewChild, OnInit, NgZone } from '@angular/core';
import { ChatbotServiceService } from 'src/app/services/chatbot-service.service';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  id: string;
  isSystem?: boolean;
  isMemoryLimit?: boolean;
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  private recognition: any;

  memoryLimitReached  = false;
  isChatOpen          = false;
  userMessage         = '';
  messages: Message[] = [];
  isTyping            = false;
  isListening         = false;
  showClearConfirm    = false;
private manualLangSelected = false;
  currentLang: 'fr' | 'en' | 'ar' = 'fr';
  voiceLang: 'fr-FR' | 'en-US' | 'ar-SA' = 'fr-FR';

  conversationHistory: HistoryEntry[] = [];

  // 10 tours = 20 entrées (1 user + 1 bot par tour)
  private readonly MAX_HISTORY = 20;

  constructor(private chatbotService: ChatbotServiceService,private ngZone: NgZone  ) {}

  ngOnInit() {
    this.messages.push({
      sender: 'bot',
      text: "👋 Bonjour ! Je suis **Elzei AI Assistant**.\nPosez vos questions sur les projets, consultants, factures ou la plateforme.",
      timestamp: new Date(),
      id: this.generateId()
    });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 6);
  }

  // ===== LANGUE =====
 setVoiceLang(lang: 'fr-FR' | 'en-US' | 'ar-SA') {
  this.voiceLang = lang;
  const map: any = { 'fr-FR': 'fr', 'en-US': 'en', 'ar-SA': 'ar' };
  this.currentLang = map[lang];
  this.manualLangSelected = true;  // ← l'utilisateur a choisi manuellement
}
 updateLangFromBackend(lang: string) {
  // Si l'utilisateur a choisi une langue manuellement → ne pas écraser
  if (this.manualLangSelected) return;

  // Sinon → auto-détection depuis le backend
  if (lang.startsWith('ar')) {
    this.currentLang = 'ar';
    this.voiceLang = 'ar-SA';
  } else if (lang.startsWith('en')) {
    this.currentLang = 'en';
    this.voiceLang = 'en-US';
  } else {
    this.currentLang = 'fr';
    this.voiceLang = 'fr-FR';
  }
}

  get inputPlaceholder(): string {
    const map = {
      fr: 'Posez votre question…',
      en: 'Ask your question…',
      ar: 'اكتب سؤالك…'
    };
    return map[this.currentLang];
  }

  get inputBlockedPlaceholder(): string {
    const map = {
      fr: 'Limite atteinte — démarrez une nouvelle conversation',
      en: 'Limit reached — start a new conversation',
      ar: 'تم الوصول للحد — ابدأ محادثة جديدة'
    };
    return map[this.currentLang];
  }

  get isRTL(): boolean {
    return this.currentLang === 'ar';
  }

  get suggestions() {
    const langs: any = {
      fr: [
        { icon: 'fa-building',   text: 'Présentation Elzei', query: "Qu'est-ce qu'Elzei Consulting ?" },
        { icon: 'fa-briefcase',  text: 'Nos services',        query: 'Quels services proposez-vous ?' },
        { icon: 'fa-map',        text: 'Navigation du site',  query: 'Comment naviguer sur le site ?' },
        { icon: 'fa-chart-line', text: 'KPIs & métriques',    query: 'Quels sont les KPIs disponibles ?' },
        { icon: 'fa-envelope',   text: 'Contact équipe',       query: "Comment contacter l'équipe ?" },
        { icon: 'fa-chart-bar',  text: 'Stats globales',       query: 'Donne-moi les statistiques globales' }
      ],
      en: [
        { icon: 'fa-building',   text: 'About Elzei',         query: 'What is Elzei Consulting?' },
        { icon: 'fa-briefcase',  text: 'Our services',         query: 'What services do you offer?' },
        { icon: 'fa-map',        text: 'Site navigation',      query: 'How to navigate the site?' },
        { icon: 'fa-chart-line', text: 'KPIs & metrics',       query: 'What KPIs are available?' },
        { icon: 'fa-envelope',   text: 'Contact team',         query: 'How to contact the team?' },
        { icon: 'fa-chart-bar',  text: 'Global stats',         query: 'Give me global statistics' }
      ],
      ar: [
        { icon: 'fa-building',   text: 'عن Elzei',             query: 'ما هي شركة Elzei Consulting؟' },
        { icon: 'fa-briefcase',  text: 'خدماتنا',              query: 'ما هي الخدمات التي تقدمونها؟' },
        { icon: 'fa-map',        text: 'التنقل في الموقع',      query: 'كيف أتنقل في الموقع؟' },
        { icon: 'fa-chart-line', text: 'مؤشرات الأداء',        query: 'ما هي مؤشرات الأداء المتاحة؟' },
        { icon: 'fa-envelope',   text: 'التواصل مع الفريق',     query: 'كيف أتواصل مع الفريق؟' },
        { icon: 'fa-chart-bar',  text: 'الإحصائيات العامة',    query: 'أعطني الإحصائيات العامة' }
      ]
    };
    return langs[this.currentLang];
  }

  // ===== NAVIGATION =====
  openChat() {
    this.isChatOpen = true;
    setTimeout(() => this.scrollToBottom(), 150);
  }

  closeChat() {
    this.isChatOpen = false;
    this.showClearConfirm = false;
  }

  askClearConfirm() {
    this.showClearConfirm = true;
  }

  cancelClear() {
    this.showClearConfirm = false;
  }

  clearConversation() {
    this.showClearConfirm   = false;
    this.conversationHistory = [];
    this.messages            = [];
    this.memoryLimitReached  = false;  // ← débloquer l'input
    this.manualLangSelected  = false;

    const resetMsg: any = {
      fr: "🔄 Nouvelle conversation démarrée. Comment puis-je vous aider ?",
      en: "🔄 New conversation started. How can I help you?",
      ar: "🔄 بدأت محادثة جديدة. كيف يمكنني مساعدتك؟"
    };

    this.messages.push({
      sender: 'bot',
      text: resetMsg[this.currentLang] || resetMsg['fr'],
      timestamp: new Date(),
      id: this.generateId()
    });
  }

  // ===== ENVOI MESSAGE =====
  sendMessage() {
    if (!this.userMessage.trim() || this.isTyping) return;
    if (this.memoryLimitReached) return;  // bloqué si limite atteinte

    const userText = this.userMessage.trim();

    this.messages.push({
      sender: 'user',
      text: userText,
      timestamp: new Date(),
      id: this.generateId()
    });

    this.conversationHistory.push({ role: 'user', content: userText });

    // ← SUPPRIMÉ : le slice(-20) silencieux
    // On laisse grossir jusqu'à MAX_HISTORY puis on bloque proprement

    this.userMessage = '';
    this.scrollToBottom();
    this.isTyping = true;

    this.chatbotService.sendMessage(
      userText,
      this.conversationHistory,
      this.currentLang         // ← langue forcée envoyée au backend
    ).subscribe({
      next: (res) => {
        this.isTyping = false;
        if (res.lang) this.updateLangFromBackend(res.lang);

        this.messages.push({
          sender: 'bot',
          text: res.response,
          timestamp: new Date(),
          id: this.generateId()
        });

        this.conversationHistory.push({
          role: 'assistant',
          content: res.response
        });

        this.scrollToBottom();

        // ← FIX PRINCIPAL : vérification côté front après ajout bot
        // >= MAX_HISTORY = 10 tours complets (20 entrées)
        if (this.conversationHistory.length >= this.MAX_HISTORY) {
          this.triggerMemoryWarning();
        }
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

  // ===== LIMITE MÉMOIRE =====
  triggerMemoryWarning() {
    const msgs: any = {
      fr: "⚠️ Limite de mémoire atteinte (10 échanges). Pour continuer dans de bonnes conditions, démarrez une nouvelle conversation.",
      en: "⚠️ Memory limit reached (10 exchanges). For best results, please start a new conversation.",
      ar: "⚠️ تم الوصول إلى حد الذاكرة (10 محادثات). للحصول على أفضل النتائج، يرجى بدء محادثة جديدة."
    };

    this.messages.push({
      sender: 'bot',
      text: msgs[this.currentLang] || msgs['fr'],
      timestamp: new Date(),
      id: this.generateId(),
      isSystem: true,
      isMemoryLimit: true
    });

    this.memoryLimitReached = true;
    this.scrollToBottom();
  }

  // ===== ACTIONS =====
  sendSuggestion(text: string) {
    this.userMessage = text;
    this.sendMessage();
  }

  copyMessage(text: string) {
    const plain = text.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(plain).catch(err => console.error('Erreur copie:', err));
  }

  replyToMessage(text: string) {
    const plain = text.replace(/<[^>]*>/g, '').substring(0, 60);
    const prefix: any = {
      fr: `À propos de : "${plain}" — `,
      en: `About: "${plain}" — `,
      ar: `بخصوص: "${plain}" — `
    };
    this.userMessage = prefix[this.currentLang] || prefix['fr'];
    setTimeout(() => {
      const inputEl = document.querySelector('.chat-input input') as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
      }
    }, 100);
  }

  // ===== RENDU =====
  renderMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="md-ul">$1</ul>')
      .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
      .replace(/\n\n/g, '</p><p class="md-p">')
      .replace(/\n/g, '<br>');
  }

  // ===== VOIX =====
// ===== VOIX =====
startVoice() {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Reconnaissance vocale non supportée sur ce navigateur.");
    return;
  }

  this.recognition = new SpeechRecognition();
  this.recognition.lang          = this.voiceLang;
  this.recognition.interimResults = true;
  this.recognition.continuous     = true;

  this.isListening = true;
  this.userMessage = '';

  let finalTranscript = '';

  this.recognition.onresult = (event: any) => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    this.ngZone.run(() => {
      this.userMessage = finalTranscript + interimTranscript;
      // ← scroll l'input vers le dernier mot après mise à jour
      this.scrollInputToEnd();
    });
  };

  this.recognition.onerror = (event: any) => {
    this.ngZone.run(() => {
      this.isListening = false;
    });
  };

  this.recognition.onend = () => {
    if (this.isListening) {
      this.recognition.start();
    }
  };

  this.recognition.start();
}

// ← AJOUTER cette méthode
private scrollInputToEnd() {
  setTimeout(() => {
    const inputEl = document.querySelector('.chat-input input') as HTMLInputElement;
    if (inputEl) {
      // Déplace le curseur à la fin du texte
      inputEl.scrollLeft = inputEl.scrollWidth;
      // Place aussi le curseur à la fin
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    }
  }, 0);
}
  stopVoice() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // ===== SCROLL =====
  private scrollToBottom() {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop =
          this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 100);
  }

  // ===== DATES =====
  formatTime(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();

    const labels: any = {
      fr: { today: "Aujourd'hui", yesterday: 'Hier' },
      en: { today: 'Today',       yesterday: 'Yesterday' },
      ar: { today: 'اليوم',       yesterday: 'أمس' }
    };
    const l = labels[this.currentLang] || labels['fr'];

    if (d.toDateString() === today.toDateString())
      return `${l.today} ${this.formatTime(d)}`;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString())
      return `${l.yesterday} ${this.formatTime(d)}`;

    return `${d.toLocaleDateString()} ${this.formatTime(d)}`;
  }

  // ===== GETTERS =====
  get conversationLength(): number {
    return Math.floor(this.conversationHistory.length / 2);
  }

  get memoryPercent(): number {
    return Math.min(100, Math.round(
      (this.conversationHistory.length / this.MAX_HISTORY) * 100
    ));
  }
}
