import { SalarieServiceService } from 'src/app/services/salarie-service.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClientService } from 'src/app/services/client.service';
import { Projet, ProjetService } from 'src/app/services/projet.service';
import Swal from 'sweetalert2';

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

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;

  // KPI
  totalProjets: number = 0;
  margeMoyen: number = 0;

  showModal = false;
  modalMode: string = 'add';
  selectedProjet: any = null;
  isLoading = false;

  // Autocomplete client
  filteredClients: any[] = [];
  selectedStatusFilter: string = '';
  showClientList: boolean = false;
  hideTimeout: any;

  // Autocomplete salarié
  searchSalarieTerm: string = '';
  filteredSalaries: any[] = [];
  showSalarieList: boolean = false;
  salarieHideTimeout: any;

  projetForm: FormGroup = new FormGroup({
    nom: new FormControl('', Validators.required),
    client: new FormControl('', Validators.required),
    clientId: new FormControl(''),
    marge_cible: new FormControl(0, [Validators.min(0)]),
    salarie_id: new FormControl(null, Validators.required),
    tjm: new FormControl(0, [Validators.min(0), Validators.required]),
    status_paiement: new FormControl('en_attente'),
    champ_remarque: new FormControl('')
  });

  constructor(
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

  loadSalaries(): void {
    this.SalarieServiceService.getSalaries().subscribe({
      next: (data) => {
        this.salariesList = data || [];
        console.log('Salariés chargés:', this.salariesList);
      },
      error: (err) => console.error('Erreur chargement salariés:', err)
    });
  }

  loadProjets(): void {
    this.isLoading = true;
    this.projetservice.getProjets().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.projets = data || [];
        this.filteredProjets = [...this.projets];
        this.calculerKPIs();
        this.updatePagination();
        console.log('Projets chargés:', this.projets);
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
        console.log('Clients chargés:', this.clients);
        this.clients.forEach(client => {
          if (client.logo && client.id) {
            const filePath = `${client.id}/logos/${client.logo}`;
            this.clientService.getClientLogo('societe', filePath).subscribe({
              next: (res) => {
                client.logoData = `data:${res.content_type};base64,${res.base64}`;
              },
              error: (err) => console.error("Erreur logo :", err)
            });
          }
        });
      },
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  calculerKPIs(): void {
    this.totalProjets = this.projets.length;
    if (this.totalProjets > 0) {
      this.margeMoyen = this.projets.reduce((sum, projet) => sum + (projet?.marge_cible ?? 0), 0) / this.totalProjets;
    }
  }

  // Filtrage combiné (texte + statut)
  applyFilters(): void {
    let filtered = [...this.projets];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom?.toLowerCase().includes(term) ||
        p.client?.toLowerCase().includes(term)
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

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjets.length / this.itemsPerPage);
  }

  get paginatedProjets(): Projet[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProjets.slice(start, end);
  }

  getPaginationStart(): number {
    return this.filteredProjets.length > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
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

  deleteProjet(id: number): void {
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
        this.projetservice.deleteProjet(id).subscribe({
          next: () => {
            this.loadProjets();
            Swal.fire('Supprimé !', 'Le projet a été supprimé.', 'success');
            this.closeModal();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erreur !', 'Une erreur est survenue.', 'error');
          }
        });
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number') this.changePage(page);
  }

  // Autocomplete client
  onClientSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.showClientList = true;
    if (term) {
      this.filteredClients = this.clients.filter(client =>
        client.name?.toLowerCase().includes(term) ||
        client.code_client?.toLowerCase().includes(term)
      );
    } else {
      this.filteredClients = [...this.clients];
    }
  }

  hideClientListWithDelay(): void {
    this.hideTimeout = setTimeout(() => {
      this.showClientList = false;
    }, 200);
  }

  selectClient(client: any): void {
    this.projetForm.patchValue({
      client: client.name,
      clientId: client.id
    });
    this.showClientList = false;
    clearTimeout(this.hideTimeout);
    this.updateNomProjet();
  }

  // Autocomplete salarié
 onSalarieSearch(): void {
  const term = this.searchSalarieTerm.toLowerCase().trim();
  console.log('Recherche salarié:', term);
  if (!term) {
    this.filteredSalaries = [];
    return;
  }
  this.filteredSalaries = this.salariesList.filter(s =>
    s.username.toLowerCase().includes(term) ||
    s.email.toLowerCase().includes(term)
  );
  console.log('Résultats:', this.filteredSalaries);
  this.showSalarieList = true; // Force l'affichage
}

 hideSalarieListWithDelay(): void {
  setTimeout(() => {
    this.showSalarieList = false;
  }, 300);
}

  selectSalarie(salarie: any): void {
    this.searchSalarieTerm = salarie.username;
    this.projetForm.patchValue({ salarie_id: salarie.id });
    this.showSalarieList = false;
    clearTimeout(this.salarieHideTimeout);
    this.updateNomProjet();
  }

 updateNomProjet(): void {
  const clientName = this.projetForm.get('client')?.value || '';
  const salarieId = this.projetForm.get('salarie_id')?.value;
  const salarieName = this.salariesList.find(s => s.id == salarieId)?.username || '';

  if (clientName && salarieName) {
    const generatedNom = `${clientName} - ${salarieName}`;
    this.projetForm.get('nom')?.setValue(generatedNom);
  }
}

  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedProjet = null;
    this.searchSalarieTerm = '';
    this.projetForm.reset({
      nom: '',
      client: '',
      clientId: '',
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
    const salarie = this.salariesList.find(s => s.id === p.salarie_id);
    this.searchSalarieTerm = salarie ? salarie.username : '';
    this.projetForm.patchValue({
      nom: p.nom,
      client: p.client,
      clientId: p.clientId || '',
      tjm: p.tjm || 0,
      marge_cible: p.marge_cible || 0,
      status_paiement: p.status_paiement || 'en_attente',
      champ_remarque: p.champ_remarque || '',
      salarie_id: p.salarie_id || null
    });
    this.showModal = true;
    this.updateNomProjet();
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

  getStatusClass(status: string): string {
    switch(status) {
      case 'payé': return 'status-paid';
      case 'en_attente': return 'status-pending';
      case 'retard': return 'status-late';
      default: return 'status-draft';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'payé': return 'Terminée';
      case 'en_attente': return 'En attente';
      case 'retard': return 'En retard';
      default: return status || '—';
    }
  }

  onSubmit(): void {
  if (!this.projetForm.valid) {
    Object.keys(this.projetForm.controls).forEach(key => {
      this.projetForm.get(key)?.markAsTouched();
    });

    Swal.fire({
      icon: 'warning',
      title: 'Formulaire invalide',
      text: 'Veuillez remplir tous les champs obligatoires.'
    });

    return;
  }

  const formData = this.projetForm.value;

  // ================= ADD =================
  if (this.modalMode === 'add') {

    this.projetservice.addProjet(formData).subscribe({
      next: (newProjet) => {
        this.projets.push(newProjet);
        this.filteredProjets = [...this.projets];
        this.calculerKPIs();
        this.updatePagination();
        this.closeModal();

        Swal.fire({
          icon: 'success',
          title: 'Projet ajouté avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      },

      error: (err) => {
        console.error(err);

        const backendMsg = err?.error?.detail || err?.error?.message || '';

        let message = 'Erreur inconnue';

        if (backendMsg.includes('existe déjà') || backendMsg.includes('duplicate')) {
          message = 'Ce nom de projet existe déjà.';
        }
        else if (backendMsg) {
          message = backendMsg;
        }

        Swal.fire({
          icon: 'error',
          title: 'Erreur lors de l\'ajout',
          text: message
        });
      }
    });
  }

  // ================= EDIT =================
  else if (this.modalMode === 'edit') {

    const id = this.selectedProjet.id;

    this.projetservice.updateProjet(id, formData).subscribe({
      next: (updatedProjet) => {
        const index = this.projets.findIndex(p => p.id === id);
        if (index !== -1) this.projets[index] = updatedProjet;

        this.filteredProjets = [...this.projets];
        this.calculerKPIs();
        this.updatePagination();
        this.closeModal();

        Swal.fire({
          icon: 'success',
          title: 'Projet modifié avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      },

      error: (err) => {
        console.error(err);

        const backendMsg = err?.error?.detail || err?.error?.message || '';

        let message = 'Erreur inconnue';

        if (backendMsg.includes('existe déjà') || backendMsg.includes('duplicate')) {
          message = 'Ce nom de projet est déjà utilisé.';
        }
        else if (backendMsg) {
          message = backendMsg;
        }

        Swal.fire({
          icon: 'error',
          title: 'Erreur lors de la modification',
          text: message
        });
      }
    });
  }
}
  isFieldInvalid(fieldName: string): boolean {
    const field = this.projetForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant || 0) + ' €';
  }

  getAvatarClass(client: any): string {
    if (!client || !client.name) return 'avatar-default';
    const firstLetter = client.name.charAt(0).toUpperCase();
    return `avatar-${firstLetter.toLowerCase()}`;
  }
  hasActiveFilters(): boolean {
  return !!(this.searchTerm || this.selectedStatusFilter);
}

// Réinitialise tous les filtres
resetFilters(): void {
  this.searchTerm = '';
  this.selectedStatusFilter = '';
  this.applyFilters();
}
}
