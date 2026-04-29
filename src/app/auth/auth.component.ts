import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';


interface LoginResponse {
  access_token: string;
  token_type: string;
}
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit {

 currentWordIndex = 0;

  loginForm :FormGroup=new FormGroup({
    username : new FormControl('',[Validators.required]),
    password : new FormControl('',[Validators.required,Validators.minLength(4)])
  });
  constructor(private http: HttpClient,private router: Router,private authService: AuthService) { }
 private loggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isLoggedIn$ = this.loggedIn.asObservable();


  ngOnInit(): void {
    setInterval(() => {
      this.rotateWord();
    }, 3000);


  }
rotateWord() {
    const words = document.querySelectorAll('.word');
    if (words.length) {
      words[this.currentWordIndex].classList.remove('active');
      this.currentWordIndex++;
      if (this.currentWordIndex >= words.length) {
           this.currentWordIndex = 0;
        }
      words[this.currentWordIndex].classList.add('active');
    }}



  loginUser() {
  const formData = this.loginForm.value;

  this.http.post<LoginResponse>('http://localhost:8000/login', formData)
    .subscribe({
      next: (response) => {
        this.authService.login(response.access_token);

        Swal.fire({
          icon: 'success',
          title: 'Connexion réussie',
          text: 'Bienvenue 👋',
          timer: 1500,
          showConfirmButton: false
        });

        this.router.navigate(['/Accueil']);
      },

      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur de connexion',
          text: 'Username ou mot de passe incorrect'
        });

        console.log("Erreur de connexion", err);
      }
    });
}
  get username(){
    return this.loginForm.get('username');
  }
  get password(){
    return this.loginForm.get('password');
  }
}
