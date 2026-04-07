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
  itemsPerPage: number = 5;
  totalPages: number = 1;
// KPI
  totalProjets: number = 0;
  joursFacturables: number = 0;

  showModal = false;
  modalMode: string = 'add';
  selectedProjet: any = null;


  // Pour l'autocomplete client
  filteredClients: any[] = [];
  showClientList: boolean = false;
  hideTimeout: any;
 projetForm: FormGroup=new FormGroup({
     nom: new FormControl('', Validators.required),
      client: new FormControl('', Validators.required),
      clientId: new FormControl(''),
      marge_cible: new FormControl(0, [Validators.min(0)]),
      salarie_id: new FormControl(null, Validators.required),
      tjm: new FormControl(0, [Validators.min(0)]),
      status_paiement: new FormControl('en_attente'),
       champ_remarque: new FormControl('')
    });
  constructor(private projetservice: ProjetService,private clientService: ClientService,private SalarieServiceService: SalarieServiceService) { }

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
    this.projetservice.getProjets().subscribe({
      next: (data) => {
        this.projets = data || [];
        this.filteredProjets = [...this.projets];
        this.calculerKPIs();
        this.updatePagination();
        console.log('Projets chargés:', this.projets);
      },
      error: (err) => {
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
          // Chargement des logos
        this.clients.forEach(client => {
          if (client.logo && client.id) {
            const filePath = `${client.id}/logos/${client.logo}`;
            this.clientService.getClientLogo('societe', filePath)
              .subscribe({
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
// Calcul des KPI
  calculerKPIs(): void {
    this.totalProjets = this.projets.length;
  }

  // Filtrage
  filterProjets(event: any): void {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;

    if (!term) {
      this.filteredProjets = [...this.projets];
    } else {
      this.filteredProjets = this.projets.filter(p =>
        p.nom?.toLowerCase().includes(term) ||
        p.client?.toLowerCase().includes(term) ||
        p.status_paiement?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
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
// Supprimer un salarié
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
      // appel service suppression
      this.projetservice.deleteProjet(id).subscribe({
        next: () => {
          this.projets = this.projets.filter(s => s.id !== id);
          this.loadProjets();
          Swal.fire(
            'Supprimé !',
            'Le projet a été supprimé.',
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

   // ========== AUTOCOMPLETE CLIENTS ==========
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

updateNomProjet(): void {
  const clientName = this.projetForm.get('client')?.value || '';
  const salarieId = this.projetForm.get('salarie_id')?.value;

  // conversion string -> number si besoin
  const salarieName = this.salariesList.find(s => s.id == salarieId)?.username || '';

  const currentNom = this.projetForm.get('nom')?.value || '';
  const generatedNom = clientName && salarieName ? `${clientName} - ${salarieName}` : '';

  if (!currentNom || currentNom === generatedNom) {
    this.projetForm.get('nom')?.setValue(generatedNom);
  }
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

  // Ouvrir le modal en mode ajout
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedProjet = null;
    this.projetForm.reset({
      nom: '',
      client: '',
      clientId: '',
      marge_cible: 0,
      salarie_id: null,
      champ_remarque: '',
      jours_travailles: 0,
      tjm: 0,
      status_paiement: 'en_attente'
    });
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }
// Ouvrir le modal en mode édition
  openEditModal(p: any): void {
    this.modalMode = 'edit';
    this.selectedProjet = p;
    this.projetForm.patchValue({
       nom: p.nom,
    client: p.client,
    clientId: p.clientId || '',
    tjm: p.tjm || 0,
    marge_cible: p.marge_cible || 0,
    status_paiement: p.status_paiement || 'en_attente',
    champ_remarque: p.champ_remarque || '',
    salarie_id: p.salarie_id || null  // <-- ici
    });
    this.showModal = true;
    this.updateNomProjet();
    document.body.style.overflow = 'hidden';
  }

  // Ouvrir le modal en mode consultation
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

  // Statut paiement
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
      case 'payé': return 'Payé';
      case 'en_attente': return 'En attente';
      case 'retard': return 'En retard';
      default: return status || '—';
    }
  }

  // Soumettre le formulaire
  onSubmit(): void {
    if (this.projetForm.valid) {
      const formData = this.projetForm.value;

      if (this.modalMode === 'add') {
        this.projetservice.addProjet(formData).subscribe({
          next: (newProjet) => {
            this.projets.push(newProjet);
            this.filteredProjets = [...this.projets];
            this.calculerKPIs();
            this.updatePagination();
            this.closeModal();
            console.log('Projet ajouté avec succès:', newProjet);
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout:', err);
          }
        });
      } else if (this.modalMode === 'edit') {
        const id = this.selectedProjet.id;
        this.projetservice.updateProjet(id, formData).subscribe({
          next: (updatedProjet) => {
            const index = this.projets.findIndex(p => p.id === id);
            if (index !== -1) {
              this.projets[index] = updatedProjet;
            }
            this.filteredProjets = [...this.projets];
            this.calculerKPIs();
            this.updatePagination();
            this.closeModal();
            console.log('Projet modifié avec succès:', updatedProjet);
          },
          error: (err) => {
            console.error('Erreur lors de la modification:', err);
          }
        });
      }
    } else {
      Object.keys(this.projetForm.controls).forEach(key => {
        this.projetForm.get(key)?.markAsTouched();
      });
    }
  }
  // Vérifier si un champ est invalide
  isFieldInvalid(fieldName: string): boolean {
    const field = this.projetForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  // Formater les montants
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant || 0) + ' €';
  }


     // Générer la classe CSS d'avatar optimisée
  getAvatarClass(client: any): string {
    if (!client || !client.name) {
      return 'avatar-default';
    }

    const firstLetter = client.name.charAt(0).toUpperCase();
    return `avatar-${firstLetter.toLowerCase()}`;


}
}
