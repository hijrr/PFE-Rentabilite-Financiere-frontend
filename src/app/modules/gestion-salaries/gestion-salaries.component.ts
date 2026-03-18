import { Salarie, SalarieServiceService } from './../../services/salarie-service.service';
import { Component, OnInit } from '@angular/core';
import {  FormControl, FormGroup, Validators } from '@angular/forms';

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

  salarieForm: FormGroup= new FormGroup({
     username:new FormControl( ['', Validators.required]),
      role: new FormControl('', Validators.required),
      projet: new FormControl(''),
      tjm: new FormControl(0, [ Validators.min(0)])
    });
  constructor(private salarieService: SalarieServiceService,) {}
    // Formulaire sans le champ id

  ngOnInit(): void {
    this.loadSalaries();
  }

  loadSalaries(): void {
    this.salarieService.getSalaries().subscribe({
      next: (data) => {
        this.salaries = data || [];
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

    // Vérifie si le texte recherché correspond à username, projet ou tjm
    const matchesName = s.username.toLowerCase().includes(search);
    const matchesProject = s.projet?.toLowerCase().includes(search) || false;
    const matchesTjm = s.tjm !== null && s.tjm !== undefined ? s.tjm.toString().includes(search) : false;

    const matchesRole = this.selectedRole ? s.role === this.selectedRole : true;

    return matchesRole && (matchesName || matchesProject || matchesTjm);
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
      tjm: 0
    });
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Ouvrir le modal en mode édition
  openEditModal(s: any): void {
    this.modalMode = 'edit';
    this.selectedSalarie = s;
    this.salarieForm.patchValue({
      username: s.username,
      role: s.role,
      projet: s.projet || '',
      tjm: s.tjm || 0
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce salarié ?')) {
      // Implémentez la méthode delete dans votre service si nécessaire
      // this.salarieService.deleteSalarie(id).subscribe({
      //   next: () => {
      //     this.salaries = this.salaries.filter(s => s.id !== id);
      //     this.closeModal();
      //   },
      //   error: (err) => console.error(err)
      // });
    }
  }

  // Vérifier si un champ est invalide
  isFieldInvalid(fieldName: string): boolean {
    const field = this.salarieForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
