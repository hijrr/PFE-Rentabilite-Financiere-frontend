import { AuthService } from 'src/app/services/auth.service';
import { ExtractionService } from 'src/app/services/extraction.service';
import { Salarie, SalarieServiceService } from './../../services/salarie-service.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
  filteredSalaries: Salarie[] = [];
  searchText: string = '';
  selectedRole: string = '';
  roleSearchTextModal: string = '';
  showRoleListModal: boolean = false;
  roleHideTimeoutModal: any;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;
  roles: any[] = [];

  // KPI
  totalSalaries: number = 0;
  tjmMoyen: number = 0;
  isLoading = false;
  isLoadingSalaries = false;
  roleSearchText: string = '';
  showRoleList: boolean = false;
  roleHideTimeout: any;
  selectedRoleId: number | null = null;

  salarieForm = new FormGroup({
    username: new FormControl('', Validators.required),
    role_id: new FormControl(null, Validators.required),
    email: new FormControl('', [Validators.email, Validators.required]),
    tjm: new FormControl(0, [Validators.min(0)]),
    adresse: new FormControl(''),
    date_entree: new FormControl(null, Validators.required),
    num_securite_sociale: new FormControl(null, [Validators.required, Validators.min(1)])
  });

  constructor(
    public authService:AuthService,
    private salarieService: SalarieServiceService,
    private clientService: ClientService,
    private extractionService: ExtractionService
  ) {}

  ngOnInit(): void {
    this.loadSalaries();
    this.loadRoles();
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
        this.isLoadingSalaries = false;
      }
    });
  }

  loadRoles() {
    this.clientService.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
      },
      error: (err) => console.error(err)
    });
  }

  getRoleName(role_id: number): string {
    const role = this.roles.find(r => r.id === role_id);
    return role ? role.name : '-';
  }

  calculerKPIs(): void {
    this.totalSalaries = this.filteredSalaries.length;
    if (this.totalSalaries > 0) {
      const totalTJM = this.filteredSalaries.reduce((sum, s) => sum + (s.tjm || 0), 0);
      this.tjmMoyen = Math.round(totalTJM / this.totalSalaries);
    } else {
      this.tjmMoyen = 0;
    }
  }

  filteredRoles() {
    const search = this.roleSearchText.toLowerCase();
    return this.roles.filter(r => r.name.toLowerCase().includes(search));
  }

  hideRoleListWithDelay() {
    this.roleHideTimeout = setTimeout(() => {
      this.showRoleList = false;
      this.salarieForm.get('role_id')?.markAsTouched();
    }, 200);
  }

  selectRole(role: any) {
    this.roleSearchText = role.name;
    this.selectedRoleId = role.id;
    this.showRoleList = false;
    clearTimeout(this.roleHideTimeout);
    this.filterSalaries();
  }

  filteredRolesModal() {
    const search = this.roleSearchTextModal.toLowerCase();
    return this.roles.filter(r => r.name.toLowerCase().includes(search));
  }

  hideRoleListModalWithDelay() {
    this.roleHideTimeoutModal = setTimeout(() => {
       this.salarieForm.get('role_id')?.markAsTouched();
      this.showRoleListModal = false;
    }, 200);
  }

  selectRoleModal(role: any) {
    this.roleSearchTextModal = role.name;
    this.salarieForm.patchValue({ role_id: role.id });
    this.salarieForm.updateValueAndValidity();
    this.showRoleListModal = false;
    clearTimeout(this.roleHideTimeoutModal);
  }

  resetAllFilters(): void {
    this.searchText = '';
    this.roleSearchText = '';
    this.selectedRoleId = null;
    this.filterSalaries();
  }

  filterSalaries(): void {
    this.filteredSalaries = this.salaries.filter(s => {
      const search = this.searchText.toLowerCase();
      const matchesName = s.username.toLowerCase().includes(search);
      const matchesEmail = s.email?.toLowerCase().includes(search) || false;
      const matchesTjm = s.tjm?.toString().includes(search) || false;
      const matchesRole = this.selectedRoleId ? s.role_id === this.selectedRoleId : true;
      return (matchesName || matchesEmail || matchesTjm) && matchesRole;
    });
    this.currentPage = 1;
    this.updatePagination();
    this.calculerKPIs();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSalaries.length / this.itemsPerPage);
  }

  get paginatedSalaries(): Salarie[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSalaries.slice(start, start + this.itemsPerPage);
  }

  getPaginationStart(): number {
    return this.filteredSalaries.length > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredSalaries.length);
  }

  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - delta);
      let end = Math.min(total - 1, current + delta);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push('...');
      if (total > 1) pages.push(total);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number') this.changePage(page);
  }

  onSearchTextChange(): void {
    this.filterSalaries();
  }

  onRoleChange(): void {
    this.filterSalaries();
  }
onRoleInputChange() {
  if (!this.roleSearchTextModal) {
    this.salarieForm.patchValue({ role_id: null });
    this.salarieForm.get('role_id')?.markAsTouched();
  }
}
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedSalarie = null;
    this.salarieForm.reset({
      username: '',
      role_id: null,
      email: '',
      tjm: 0,
      adresse: '',
      num_securite_sociale: null,
      date_entree: null
    });
    this.roleSearchTextModal = '';
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  openEditModal(s: any): void {
    this.modalMode = 'edit';
    this.selectedSalarie = s;
    this.salarieForm.patchValue({
      username: s.username,
      role_id: s.role_id,
      email: s.email || '',
      tjm: s.tjm || 0,
      adresse: s.adresse || '',
      num_securite_sociale: s.num_securite_sociale,
      date_entree: s.date_entree ? s.date_entree.split('T')[0] : ''
    });
    this.roleSearchTextModal = this.getRoleName(s.role_id);
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

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

isFieldInvalid(fieldName: string): boolean {
  const field = this.salarieForm.get(fieldName);
  return field ? (field.invalid && (field.touched || field.dirty)) : false;
}

  onSubmit(): void {
    if (!this.salarieForm.valid) {
      Object.keys(this.salarieForm.controls).forEach(key => {
        this.salarieForm.get(key)?.markAsTouched();
      });
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire invalide',
        text: 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }

    const formData = this.salarieForm.value;

    if (this.modalMode === 'add') {
      this.salarieService.addSalarie(formData).subscribe({
        next: (newSalarie) => {
          this.salaries.push(newSalarie);
          this.filterSalaries();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Salarié ajouté avec succès',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          const message = err?.error?.detail || err?.error?.message || err?.message || 'Erreur inconnue';
          Swal.fire({ icon: 'error', title: 'Erreur lors de l\'ajout', text: message });
        }
      });
    } else if (this.modalMode === 'edit') {
      const id = this.selectedSalarie?.id;
      if (!id) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'ID manquant' });
        return;
      }
      this.salarieService.updateSalarie(id, formData).subscribe({
        next: (updatedSalarie) => {
          const index = this.salaries.findIndex(s => s.id === id);
          if (index !== -1) this.salaries[index] = updatedSalarie;
          this.filterSalaries();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Salarié modifié avec succès',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          const message = err?.error?.detail || err?.error?.message || err?.message || 'Erreur inconnue';
          Swal.fire({ icon: 'error', title: 'Erreur lors de la modification', text: message });
        }
      });
    }
  }
deleteSalarie(id: number): void {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: 'Cette action est irréversible !',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer !',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {
      this.salarieService.deleteSalarie(id).subscribe({
        next: () => {
          this.loadSalaries();
          Swal.fire('Supprimé !', 'Le salarié a été supprimé.', 'success');
          this.closeModal();
        },
        error: (err) => {
          console.error(err);

          let message = 'Une erreur est survenue.';

          // ✅ récupérer message backend
          if (err.error?.detail) {
            message = err.error.detail;
          }

          Swal.fire('Erreur !', message, 'error');
        }
      });
    }
  });
}

  getAvatarClass(salarie: Salarie): string {
    if (!salarie || !salarie.username) return 'avatar-default';
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
    this.isLoading = true;
    this.extractionService.extractionDonneesPersonnelles(file).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.modalMode = 'add';
        this.showModal = true;
        this.salarieForm.patchValue({
          username: data.nom_salarie || '',
          num_securite_sociale: data.numero_ss || '',
          adresse: data.adresse || ''
        });
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        alert('Erreur lors de l\'extraction');
      }
    });
  }
}
