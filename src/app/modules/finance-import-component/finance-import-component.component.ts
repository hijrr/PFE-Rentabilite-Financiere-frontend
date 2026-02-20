import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-finance-import-component',
  templateUrl: './finance-import-component.component.html',
  styleUrls: ['./finance-import-component.component.css']
})
export class FinanceImportComponentComponent implements OnInit {

 fichePaieFile: File | null = null;
  noteFraisFile: File | null = null;

  fichePaieError = '';
  noteFraisError = '';

  maxSize = 5 * 1024 * 1024; // 5MB

  validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

  onFichePaieSelected(event: any) {
    const file = event.target.files[0];

    if (file && this.validateFile(file)) {
      this.fichePaieFile = file;
    } else {
      this.fichePaieError = 'Fichier invalide (max 5MB)';
      this.fichePaieFile = null;
    }
  }

  onNoteFraisSelected(event: any) {
    const file = event.target.files[0];//tab de fichiers dima

    if (file && this.validateFile(file)) {
      this.noteFraisFile = file;
    } else {
      this.noteFraisError = 'Fichier invalide (max 5MB)';
      this.noteFraisFile = null;
    }
  }

  validateFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return (!!extension &&//bech trajaaa true wala false
      this.validExtensions.includes(extension) &&
      file.size <= this.maxSize
    );
  }

  onSubmit() {
    if (!this.fichePaieFile || !this.noteFraisFile) {
      alert('Veuillez importer les deux fichiers');
      return;
    }

    alert('Fichiers prêts à être envoyés');
    console.log(this.fichePaieFile);
    console.log(this.noteFraisFile);
  }

  resetForm() {
    this.fichePaieFile = null;
    this.noteFraisFile = null;
    this.fichePaieError = '';
    this.noteFraisError = '';
  }
  constructor() { }

  ngOnInit(): void {
  }

}
