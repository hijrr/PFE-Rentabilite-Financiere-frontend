import { ExtractionService } from 'src/app/services/extraction.service';
import { Salarie, SalarieServiceService } from './../../services/salarie-service.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {  FormControl, FormGroup, Validators } from '@angular/forms';
import { ClientService } from 'src/app/services/client.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-gestion-salaries',
  templateUrl: './gestion-salaries.component.html',
  styleUrls: ['./gestion-salaries.component.css']
})
export class GestionSalariesComponent implements OnInit {
  salaries: Salarie[] = [];
  showModal = false;
  modalMode: string = 'add';
  selectedSalarie: any = null;

  roles: string[] = [
  'Développeur',
  'Chef de projet',
  'Designer',
  'Commercial',
  'Data',
  'DevOps',
  'Product Owner'
];
filteredSalaries: Salarie[] = [];
searchText: string = '';
selectedRole: string = '';
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;

  // KPI
  totalSalaries: number = 0;
  tjmMoyen: number = 0;
  isLoading = false;
  isLoadingSalaries = false;

  salarieForm: FormGroup= new FormGroup({
     username:new FormControl( ['', Validators.required]),
      role: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.email, Validators.required]),
      tjm: new FormControl(0, [ Validators.min(0)]),
      adresse:new FormControl(''),
      date_entree: new FormControl(null, Validators.required),
      num_securite_sociale:new FormControl(0, Validators.required)
    });
  constructor(private salarieService: SalarieServiceService,private clientService: ClientService,private ExtractionService: ExtractionService) {}
    // Formulaire sans le champ id

  ngOnInit(): void {
    this.loadSalaries();
  }

  loadSalaries(): void {
     this.isLoadingSalaries = true;
    this.salarieService.getSalaries().subscribe({
      next: (data) => {
        this.salaries = data || [];
        this.isLoadingSalaries = false;
        this.filterSalaries();
        this.calculerKPIs();
        console.log('Salariés chargés:', this.salaries);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

    // Calcul des KPI
  calculerKPIs(): void {
    this.totalSalaries = this.filteredSalaries.length; // ✅ nombre visible après filtre

  if (this.totalSalaries > 0) {
    const totalTJM = this.filteredSalaries.reduce((sum, s) => sum + (s.tjm || 0), 0);
    this.tjmMoyen = Math.round(totalTJM / this.totalSalaries);
  } else {
    this.tjmMoyen = 0;
  }
  }
filterSalaries(): void {
  this.filteredSalaries = this.salaries.filter(s => {
    const search = this.searchText.toLowerCase();

    // Vérifie si le texte recherché correspond à username, client ou tjm
    const matchesName = s.username.toLowerCase().includes(search);
    const matchesClient = s.email ? s.email.toLowerCase().includes(search) : false;
    const matchesTjm = s.tjm !== null && s.tjm !== undefined ? s.tjm.toString().includes(search) : false;

    const matchesRole = this.selectedRole ? s.role === this.selectedRole : true;

    return matchesRole && (matchesName || matchesClient || matchesTjm);
  });
  this.currentPage = 1;
  this.updatePagination();
  this.calculerKPIs();
}
 // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSalaries.length / this.itemsPerPage);
  }

  get paginatedSalaries(): Salarie[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSalaries.slice(start, end);
  }

  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Nombre de pages autour de la page courante

    if (total <= 7) {
      // Si moins de 7 pages, afficher toutes
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);

      // Calculer la plage autour de la page courante
      let start = Math.max(2, current - delta);
      let end = Math.min(total - 1, current + delta);

      // Ajouter ellipse si nécessaire avant la plage
      if (start > 2) {
        pages.push('...');
      }

      // Ajouter les pages de la plage
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Ajouter ellipse si nécessaire après la plage
      if (end < total - 1) {
        pages.push('...');
      }

      // Toujours afficher la dernière page
      if (total > 1) {
        pages.push(total);
      }
    }

    return pages;
  }

  getPaginationStart(): number {
    return this.filteredSalaries.length > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredSalaries.length);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number') {
      this.changePage(page);
    }
  }
onSearchTextChange(): void {
  this.filterSalaries();
}

onRoleChange(): void {
  this.filterSalaries();
}

  // Ouvrir le modal en mode ajout
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedSalarie = null;
    this.salarieForm.reset({
      username: '',
      role: '',
      projet: '',
      email: '',
      tjm: 0,
      adresse:'',
      num_securite_sociale:'',
      date_entree: null
    });
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Ouvrir le modal en mode édition
  openEditModal(s: any): void {
    this.modalMode = 'edit';
    this.selectedSalarie = s;
    console.log(s);
    this.salarieForm.patchValue({
      username: s.username,
      role: s.role,
      client: s.client || '',
      tjm: s.tjm || 0,
      adresse: s.adresse || '',
      num_securite_sociale: s.num_securite_sociale,
      date_entree: s.date_entree ? s.date_entree.split('T')[0] : ''
    });
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Ouvrir le modal en mode consultation
  openDetailsModal(s: any): void {
    this.selectedSalarie = s;
    this.modalMode = 'details';
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSalarie = null;
    document.body.style.overflow = 'auto';
  }

  // Soumettre le formulaire (ajout ou modification)
  onSubmit(): void {
    if (this.salarieForm.valid) {
      const formData = this.salarieForm.value;

      if (this.modalMode === 'add') {
        // Mode ajout - pas d'id
        this.salarieService.addSalarie(formData).subscribe({
          next: (newSalarie) => {
            this.salaries.push(newSalarie);
          this.filterSalaries();
            this.closeModal();
            console.log('Salarié ajouté avec succès:', newSalarie);
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout:', err);
          }
        });
      } else if (this.modalMode === 'edit') {
        // Mode modification - on récupère l'id du selectedSalarie
       const id = this.selectedSalarie.id;
  this.salarieService.updateSalarie(id, formData).subscribe({
    next: (updatedSalarie) => {
      const index = this.salaries.findIndex(s => s.id === id);
      if (index !== -1) {
        this.salaries[index] = updatedSalarie;
      }
      this.filterSalaries();
      this.closeModal();
    },
    error: (err) => console.error('Erreur lors de la modification:', err)
  });
} else {
  console.error('Impossible de modifier : id manquant');
      }
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.salarieForm.controls).forEach(key => {
        this.salarieForm.get(key)?.markAsTouched();
      });
    }
  }

  // Supprimer un salarié
  deleteSalarie(id: number): void {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: "Cette action est irréversible !",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer !',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {
      // appel service suppression
      this.salarieService.deleteSalarie(id).subscribe({
        next: () => {
          this.salaries = this.salaries.filter(s => s.id !== id);
          this.loadSalaries();
          Swal.fire(
            'Supprimé !',
            'Le salarié a été supprimé.',
            'success'
          );

          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          Swal.fire(
            'Erreur !',
            'Une erreur est survenue.',
            'error'
          );
        }
      });
    }
  });
}
  // Vérifier si un champ est invalide
  isFieldInvalid(fieldName: string): boolean {
    const field = this.salarieForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  // Générer la classe CSS d'avatar optimisée
  getAvatarClass(salarie: Salarie): string {
    if (!salarie || !salarie.username) {
      return 'avatar-default';
    }

    const firstLetter = salarie.username.charAt(0).toUpperCase();
    return `avatar-${firstLetter.toLowerCase()}`;
  }

  @ViewChild('fileInput') fileInput!: ElementRef;

openExtractModal() {
  this.fileInput.nativeElement.click();
}
onFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;
 this.isLoading = true; // 🔥 afficher loader
  this.ExtractionService.extractionDonneesPersonnelles(file).subscribe({
    next: (data) => {
      console.log('DATA EXTRAITE:', data);
  this.isLoading = false; // ✅ cacher loader
      // ouvrir modal en mode add
      this.modalMode = 'add';
      this.showModal = true;

      // remplir automatiquement le form
      this.salarieForm.patchValue({
        username: data.nom_salarie || '',
         num_securite_sociale: data.numero_ss || '',
        adresse: data.adresse || ''
      });
    },
    error: (err) => {
      console.error(err);
      this.isLoading = false;
      alert("Erreur lors de l'extraction");
    }
  });
}
}



