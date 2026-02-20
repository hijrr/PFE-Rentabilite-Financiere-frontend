import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';


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
  constructor(private http: HttpClient) { }


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



  loginUser(){
    const formData = this.loginForm.value;
     this.http.post<LoginResponse>('http://localhost:8000/login', formData)
    .subscribe({
      next: (response) => {
        console.log("Connexion réussie", response);
         localStorage.setItem('token', response.access_token);
      },      error: (err) => {
        console.log("Erreur de connexion", err);
      }
    });
    console.log(this.loginForm.value);
  }
  get username(){
    return this.loginForm.get('username');
  }
  get password(){
    return this.loginForm.get('password');
  }

}
