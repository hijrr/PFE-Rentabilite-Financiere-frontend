import { SalarieServiceService } from 'src/app/services/salarie-service.service';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClientService } from 'src/app/services/client.service';
import { Projet, ProjetService } from 'src/app/services/projet.service';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-gestion-projet',
  templateUrl: './gestion-projet.component.html',
  styleUrls: ['./gestion-projet.component.css']
})
export class GestionProjetComponent implements OnInit {
  projets: Projet[] = [];
  filteredProjets: Projet[] = [];
  clients: any[] = [];
  searchTerm: string = '';
  salariesList: any[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;

  totalProjets: number = 0;
  margeMoyen: number = 0;

  showModal = false;
  modalMode: string = 'add';
  selectedProjet: any = null;
  isLoading = false;

  filteredClients: any[] = [];
  selectedStatusFilter: string = '';
  showClientList: boolean = false;
  hideTimeout: any;

  searchSalarieTerm: string = '';
  filteredSalaries: any[] = [];
  showSalarieList: boolean = false;
  salarieHideTimeout: any;

  projetForm: FormGroup = new FormGroup({
    nom: new FormControl('', Validators.required),
    client: new FormControl('', Validators.required),       // affichage uniquement
    client_id: new FormControl(null, Validators.required),  // envoyé au backend
    marge_cible: new FormControl(0, [Validators.min(0)]),
    salarie_id: new FormControl(null, Validators.required),
    tjm: new FormControl(0, [Validators.min(0), Validators.required]),
    status_paiement: new FormControl('en_attente'),
    champ_remarque: new FormControl('')
  });

  constructor(
    public authService: AuthService,
    private projetservice: ProjetService,
    private clientService: ClientService,
    private SalarieServiceService: SalarieServiceService
  ) {}

  ngOnInit(): void {
    this.loadProjets();
    this.loadClients();
    this.loadSalaries();
    this.projetForm.get('client')?.valueChanges.subscribe(() => this.updateNomProjet());
    this.projetForm.get('salarie_id')?.valueChanges.subscribe(() => this.updateNomProjet());
  }

  // ─── CHARGEMENTS ────────────────────────────────────────────────

  loadSalaries(): void {
    this.SalarieServiceService.getSalaries().subscribe({
      next: (data) => {
        this.salariesList = data || [];
        this.refreshProjectNames();
      },
      error: (err) => console.error('Erreur chargement salariés:', err)
    });
  }

  loadProjets(): void {
    this.isLoading = true;
    this.projetservice.getProjets().subscribe({
      next: (data) => {
        this.isLoading = false;
        // Le backend retourne salarie et client comme objets imbriqués
        this.projets = data || [];
        this.filteredProjets = [...this.projets];
        this.calculerKPIs();
        this.updatePagination();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur chargement projets:', err);
      }
    });
  }

  loadClients(): void {
    this.clientService.getclientsBD().subscribe({
      next: (data) => {
        this.clients = data.clients || [];
        this.filteredClients = [...this.clients];
        this.clients.forEach(client => {
          if (client.logo && client.id) {
            const filePath = `${client.id}/logos/${client.logo}`;
            this.clientService.getClientLogo('societe', filePath).subscribe({
              next: (res) => {
                client.logoData = `data:${res.content_type};base64,${res.base64}`;
              },
              error: (err) => console.error('Erreur logo :', err)
            });
          }
        });
      },
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  // ─── KPIs ────────────────────────────────────────────────────────

  calculerKPIs(): void {
    this.totalProjets = this.projets.length;
    if (this.totalProjets > 0) {
      this.margeMoyen =
        this.projets.reduce((sum, p) => sum + (p?.marge_cible ?? 0), 0) / this.totalProjets;
    }
  }

  // ─── FILTRES ─────────────────────────────────────────────────────

  applyFilters(): void {
    let filtered = [...this.projets];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom?.toLowerCase().includes(term) ||
        p.client?.name?.toLowerCase().includes(term)
      );
    }
    if (this.selectedStatusFilter) {
      filtered = filtered.filter(p => p.status_paiement === this.selectedStatusFilter);
    }
    this.filteredProjets = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  filterProjets(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  filterProjetsByStatus(): void {
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedStatusFilter);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatusFilter = '';
    this.applyFilters();
  }

  // ─── PAGINATION ──────────────────────────────────────────────────

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjets.length / this.itemsPerPage);
  }

  get paginatedProjets(): Projet[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProjets.slice(start, start + this.itemsPerPage);
  }

  getPaginationStart(): number {
    return this.filteredProjets.length > 0
      ? (this.currentPage - 1) * this.itemsPerPage + 1
      : 0;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredProjets.length);
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

  // ─── AUTOCOMPLETE CLIENT ─────────────────────────────────────────

  onClientFocus(): void {
    this.showClientList = true;
    if (!this.filteredClients.length) {
      this.filteredClients = [...this.clients];
    }
    this.positionAutocompleteList('.client-autocomplete-input', '.client-autocomplete-list');
  }

  onClientSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.showClientList = true;
    // Si l'utilisateur efface le champ → reset client_id
    this.projetForm.patchValue({ client_id: null });
    this.filteredClients = term
      ? this.clients.filter(c =>
          c.name?.toLowerCase().includes(term) ||
          c.code_client?.toLowerCase().includes(term)
        )
      : [...this.clients];
    this.positionAutocompleteList('.client-autocomplete-input', '.client-autocomplete-list');
  }

  hideClientListWithDelay(): void {
    this.hideTimeout = setTimeout(() => {
      this.showClientList = false;
    }, 200);
  }

  selectClient(client: any): void {
    this.projetForm.patchValue({
      client: client.name,
      client_id: client.id       // ✅ id entier envoyé au backend
    });
    this.showClientList = false;
    clearTimeout(this.hideTimeout);
    this.updateNomProjet();
  }

  // ─── AUTOCOMPLETE SALARIÉ ────────────────────────────────────────

  onSalarieFocus(): void {
    this.showSalarieList = true;
    if (!this.searchSalarieTerm.trim()) {
      this.filteredSalaries = [...this.salariesList];
    }
    this.positionAutocompleteList('.salarie-autocomplete-input', '.salarie-autocomplete-list');
  }

  onSalarieSearch(): void {
    const term = this.searchSalarieTerm.toLowerCase().trim();
    if (!term) {
      this.filteredSalaries = [...this.salariesList];
      this.projetForm.patchValue({ salarie_id: null });
      this.projetForm.get('salarie_id')?.markAsTouched();
      this.showSalarieList = true;
      this.positionAutocompleteList('.salarie-autocomplete-input', '.salarie-autocomplete-list');
      return;
    }
    this.filteredSalaries = this.salariesList.filter(s =>
      s.username.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
    this.showSalarieList = true;
    this.updateNomProjet();
    this.positionAutocompleteList('.salarie-autocomplete-input', '.salarie-autocomplete-list');
  }

  hideSalarieListWithDelay(): void {
    setTimeout(() => {
      this.showSalarieList = false;
      this.projetForm.get('salarie_id')?.markAsTouched();
    }, 300);
  }

  selectSalarie(salarie: any): void {
    this.searchSalarieTerm = salarie.username;
    this.projetForm.patchValue({ salarie_id: salarie.id });
    this.showSalarieList = false;
    clearTimeout(this.salarieHideTimeout);
    this.updateNomProjet();
  }

  repositionAutocompleteLists(): void {
    if (this.showClientList) {
      this.positionAutocompleteList('.client-autocomplete-input', '.client-autocomplete-list');
    }
    if (this.showSalarieList) {
      this.positionAutocompleteList('.salarie-autocomplete-input', '.salarie-autocomplete-list');
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.repositionAutocompleteLists();
  }

  private positionAutocompleteList(inputSelector: string, listSelector: string): void {
    setTimeout(() => {
      const input = document.querySelector(inputSelector) as HTMLElement | null;
      const list = document.querySelector(listSelector) as HTMLElement | null;
      if (!input || !list) return;

      const rect = input.getBoundingClientRect();
      list.style.top = `${rect.bottom + 4}px`;
      list.style.left = `${rect.left}px`;
      list.style.width = `${rect.width}px`;
    }, 0);
  }

  // ─── NOM AUTO ────────────────────────────────────────────────────

  updateNomProjet(): void {
    const clientName = this.projetForm.get('client')?.value || '';
    const salarieId = this.projetForm.get('salarie_id')?.value;
    let salarieName = this.salariesList.find(s => s.id == salarieId)?.username
      || this.searchSalarieTerm || '';

    if (clientName && salarieName) {
      this.projetForm.get('nom')?.setValue(`${clientName} - ${salarieName}`, { emitEvent: false });
    } else if (clientName) {
      this.projetForm.get('nom')?.setValue(clientName, { emitEvent: false });
    } else {
      this.projetForm.get('nom')?.setValue('', { emitEvent: false });
    }
  }

  refreshProjectNames(): void {
    this.projets = this.projets.map(p => {
      // Le backend retourne déjà p.salarie et p.client comme objets imbriqués
      const salarieName = p.salarie?.username || '';
      const clientName  = p.client?.name || '';
      return {
        ...p,
        nom: clientName && salarieName ? `${clientName} - ${salarieName}` : p.nom
      };
    });
    this.filteredProjets = [...this.projets];
  }

  // ─── MODALS ──────────────────────────────────────────────────────

  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedProjet = null;
    this.searchSalarieTerm = '';
    this.projetForm.reset({
      nom: '',
      client: '',
      client_id: null,
      marge_cible: 0,
      salarie_id: null,
      champ_remarque: '',
      tjm: 0,
      status_paiement: 'en_attente'
    });
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  openEditModal(p: any): void {
    this.modalMode = 'edit';
    this.selectedProjet = p;
    // p.salarie est un objet complet retourné par le backend
    this.searchSalarieTerm = p.salarie?.username || '';
    this.projetForm.patchValue({
      nom: p.nom,
      client: p.client?.name || '',
      client_id: p.client?.id || null,     // ✅ on utilise p.client.id (objet imbriqué)
      tjm: p.tjm || 0,
      marge_cible: p.marge_cible || 0,
      status_paiement: p.status_paiement || 'en_attente',
      champ_remarque: p.champ_remarque || '',
      salarie_id: p.salarie?.id || null    // ✅ on utilise p.salarie.id (objet imbriqué)
    });
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  openDetailsModal(p: any): void {
    this.selectedProjet = p;
    this.modalMode = 'details';
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedProjet = null;
    document.body.style.overflow = 'auto';
  }

  // ─── CRUD ────────────────────────────────────────────────────────

 onSubmit(): void {
    if (!this.projetForm.valid) {
      Object.keys(this.projetForm.controls).forEach(key =>
        this.projetForm.get(key)?.markAsTouched()
      );
      Swal.fire({ icon: 'warning', title: 'Formulaire invalide', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    // ✅ On construit manuellement le payload selon ProjetsBase du backend
    // nom, client_id, marge_cible, salarie_id, tjm, status_paiement, champ_remarque
    const payload = {
      nom:             this.projetForm.get('nom')?.value,
      client_id:       this.projetForm.get('client_id')?.value,
      marge_cible:     this.projetForm.get('marge_cible')?.value ?? 0,
      salarie_id:      this.projetForm.get('salarie_id')?.value,
      tjm:             this.projetForm.get('tjm')?.value ?? 0,
      status_paiement: this.projetForm.get('status_paiement')?.value || 'en_attente',
      champ_remarque:  this.projetForm.get('champ_remarque')?.value || ''
    };

    console.log('Payload envoyé:', payload); // ✅ pour vérifier en console

    if (this.modalMode === 'add') {
      this.projetservice.addProjet(payload).subscribe({
        next: (newProjet) => {
          this.projets.push(newProjet);
          this.filteredProjets = [...this.projets];
          this.calculerKPIs();
          this.updatePagination();
          this.closeModal();
          Swal.fire({ icon: 'success', title: 'Projet ajouté avec succès', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          console.error('Erreur add:', err);
          const msg = err?.error?.detail || err?.error?.message || 'Erreur inconnue';
          Swal.fire({ icon: 'error', title: "Erreur lors de l'ajout", text: msg });
        }
      });

    } else if (this.modalMode === 'edit') {
      const id = this.selectedProjet.id;
      this.projetservice.updateProjet(id, payload).subscribe({
        next: (updatedProjet) => {
          const index = this.projets.findIndex(p => p.id === id);
          if (index !== -1) this.projets[index] = updatedProjet;
          this.filteredProjets = [...this.projets];
          this.calculerKPIs();
          this.updatePagination();
          this.closeModal();
          Swal.fire({ icon: 'success', title: 'Projet modifié avec succès', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          console.error('Erreur edit:', err);
          const msg = err?.error?.detail || err?.error?.message || 'Erreur inconnue';
          Swal.fire({ icon: 'error', title: 'Erreur lors de la modification', text: msg });
        }
      });
    }
  }
  deleteProjet(id: number): void {
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
        this.projetservice.deleteProjet(id).subscribe({
          next: () => {
            // ✅ Suppression locale sans recharger toute la liste
            this.projets = this.projets.filter(p => p.id !== id);
            this.filteredProjets = this.filteredProjets.filter(p => p.id !== id);
            this.calculerKPIs();
            this.updatePagination();
            this.closeModal();
            Swal.fire('Supprimé !', 'Le projet a été supprimé.', 'success');
          },
          error: (err) => {
            const msg = err?.error?.detail || (typeof err.error === 'string' ? err.error : 'Une erreur est survenue.');
            Swal.fire('Erreur !', msg, 'error');
          }
        });
      }
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────

  isFieldInvalid(fieldName: string): boolean {
    const field = this.projetForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'payé':       return 'status-paid';
      case 'en_attente': return 'status-pending';
      case 'retard':     return 'status-late';
      default:           return 'status-draft';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'payé':       return 'Terminée';
      case 'en_attente': return 'En attente';
      case 'retard':     return 'En retard';
      default:           return status || '—';
    }
  }

  getAvatarClass(client: any): string {
    if (!client || !client.name) return 'avatar-default';
    return `avatar-${client.name.charAt(0).toLowerCase()}`;
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant || 0) + ' €';
  }
}
